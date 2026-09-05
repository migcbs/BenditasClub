const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { put } = require('@vercel/blob');
const prisma = require('../../lib/prisma');
const { verifyToken, requireRole } = require('../../middleware/auth');
const { calculateExpectedCash, classifyInventoryHealth } = require('./inventory');

const router = express.Router();
router.use(verifyToken, requireRole('admin'));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No se recibió ningún archivo.' });
  if (!/^image\//.test(req.file.mimetype)) return res.status(400).json({ error: 'Solo se permiten imágenes.' });
  try {
    const ext = (req.file.originalname.match(/\.[a-zA-Z0-9]+$/) || [''])[0];
    const filename = `merch/${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const blob = await put(filename, req.file.buffer, { access: 'public', contentType: req.file.mimetype });
    res.status(201).json({ url: blob.url });
  } catch (error) {
    console.error('❌ Error subiendo imagen:', error);
    res.status(500).json({ error: 'No se pudo subir la imagen.' });
  }
});

router.get('/inventory', async (req, res) => {
  const branch = req.query.branch || 'xico';
  if (!['xico', 'coatepec'].includes(branch)) return res.status(400).json({ error: 'Sucursal inválida' });
  const ingredients = await prisma.ingredient.findMany({
    where: { activo: true },
    include: { stocks: { where: { sucursal: branch } } },
    orderBy: { nombre: 'asc' },
  });
  res.json(ingredients.map((ingredient) => {
    const quantity = Number(ingredient.stocks[0]?.quantity || 0);
    return { ...ingredient, quantity, health: classifyInventoryHealth(quantity, Number(ingredient.reorderPoint)) };
  }));
});

router.post('/ingredients', async (req, res) => {
  const { nombre, sku, unit, costPerUnit = 0, reorderPoint = 0, initialStock = {} } = req.body;
  if (!nombre || !unit) return res.status(400).json({ error: 'Nombre y unidad son obligatorios' });
  const ingredient = await prisma.ingredient.create({
    data: {
      nombre, sku: sku || null, unit, costPerUnit, reorderPoint,
      stocks: { create: ['xico', 'coatepec'].map((sucursal) => ({ sucursal, quantity: Number(initialStock[sucursal] || 0) })) },
    },
    include: { stocks: true },
  });
  res.status(201).json(ingredient);
});

router.put('/ingredients/:id', async (req, res) => {
  const { nombre, sku, unit, costPerUnit, reorderPoint, activo } = req.body;
  if (!nombre || !unit) return res.status(400).json({ error: 'Nombre y unidad son obligatorios' });
  res.json(await prisma.ingredient.update({
    where: { id: req.params.id },
    data: { nombre, sku: sku || null, unit, costPerUnit: Number(costPerUnit || 0), reorderPoint: Number(reorderPoint || 0), ...(activo === undefined ? {} : { activo }) },
  }));
});

router.post('/inventory/adjustments', async (req, res) => {
  const { ingredientId, sucursal, quantity, reason } = req.body;
  if (!ingredientId || !['xico', 'coatepec'].includes(sucursal) || !Number.isFinite(Number(quantity)) || !reason) {
    return res.status(400).json({ error: 'Ingrediente, sucursal, cantidad y motivo son obligatorios' });
  }
  const result = await prisma.$transaction(async (tx) => {
    const stock = await tx.locationStock.upsert({
      where: { ingredientId_sucursal: { ingredientId, sucursal } },
      create: { ingredientId, sucursal, quantity },
      update: { quantity: { increment: quantity } },
    });
    await tx.inventoryMovement.create({ data: { ingredientId, sucursal, type: 'adjustment', quantity, reason, createdById: req.user.id } });
    return stock;
  });
  res.status(201).json(result);
});

router.get('/inventory/movements', async (req, res) => {
  const { branch, ingredientId } = req.query;
  res.json(await prisma.inventoryMovement.findMany({
    where: { ...(branch && branch !== 'all' ? { sucursal: branch } : {}), ...(ingredientId ? { ingredientId } : {}) },
    include: { ingredient: { select: { nombre: true, unit: true } } },
    orderBy: { createdAt: 'desc' }, take: 100,
  }));
});

router.get('/recipes', async (_req, res) => {
  res.json(await prisma.recipe.findMany({ include: { product: true, items: { include: { ingredient: true } } }, orderBy: { product: { nombre: 'asc' } } }));
});

router.put('/recipes/:productId', async (req, res) => {
  const { yield: recipeYield = 1, items = [] } = req.body;
  if (!Array.isArray(items) || items.some((item) => !item.ingredientId || Number(item.quantity) <= 0)) {
    return res.status(400).json({ error: 'La receta requiere ingredientes con cantidades positivas' });
  }
  const recipe = await prisma.$transaction(async (tx) => {
    const record = await tx.recipe.upsert({
      where: { productId: req.params.productId },
      create: { productId: req.params.productId, yield: recipeYield },
      update: { yield: recipeYield },
    });
    await tx.recipeItem.deleteMany({ where: { recipeId: record.id } });
    if (items.length) await tx.recipeItem.createMany({ data: items.map((item) => ({ recipeId: record.id, ingredientId: item.ingredientId, quantity: item.quantity })) });
    return tx.recipe.findUnique({ where: { id: record.id }, include: { product: true, items: { include: { ingredient: true } } } });
  });
  res.json(recipe);
});

router.get('/suppliers', async (_req, res) => res.json(await prisma.supplier.findMany({ where: { activo: true }, orderBy: { nombre: 'asc' } })));
router.post('/suppliers', async (req, res) => {
  if (!req.body.nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  res.status(201).json(await prisma.supplier.create({ data: req.body }));
});
router.put('/suppliers/:id', async (req, res) => {
  const { nombre, contacto, telefono, email, paymentTerms, activo } = req.body;
  if (nombre !== undefined && !nombre) return res.status(400).json({ error: 'El nombre es obligatorio' });
  res.json(await prisma.supplier.update({
    where: { id: req.params.id },
    data: { ...(nombre !== undefined ? { nombre } : {}), ...(contacto !== undefined ? { contacto } : {}), ...(telefono !== undefined ? { telefono } : {}), ...(email !== undefined ? { email } : {}), ...(paymentTerms !== undefined ? { paymentTerms } : {}), ...(activo !== undefined ? { activo } : {}) },
  }));
});

router.get('/purchases', async (req, res) => {
  const where = req.query.branch && req.query.branch !== 'all' ? { sucursal: req.query.branch } : {};
  res.json(await prisma.purchaseOrder.findMany({ where, include: { supplier: true, items: { include: { ingredient: true } } }, orderBy: { createdAt: 'desc' } }));
});

router.post('/purchases', async (req, res) => {
  const { supplierId, sucursal, items = [], notes } = req.body;
  if (!supplierId || !['xico', 'coatepec'].includes(sucursal) || !items.length) return res.status(400).json({ error: 'Proveedor, sucursal e insumos son obligatorios' });
  const total = items.reduce((sum, item) => sum + Number(item.quantityOrdered) * Number(item.unitCost), 0);
  const purchase = await prisma.purchaseOrder.create({
    data: { supplierId, sucursal, notes, total, createdById: req.user.id, items: { create: items } },
    include: { supplier: true, items: { include: { ingredient: true } } },
  });
  res.status(201).json(purchase);
});

router.post('/purchases/:id/receive', async (req, res) => {
  const received = req.body.items || [];
  const purchase = await prisma.purchaseOrder.findUnique({ where: { id: req.params.id }, include: { items: true } });
  if (!purchase) return res.status(404).json({ error: 'Compra no encontrada' });
  const result = await prisma.$transaction(async (tx) => {
    for (const entry of received) {
      const line = purchase.items.find((item) => item.id === entry.id);
      const quantity = Number(entry.quantityReceived || 0);
      if (!line || quantity <= 0) continue;
      await tx.purchaseOrderItem.update({ where: { id: line.id }, data: { quantityReceived: { increment: quantity } } });
      await tx.locationStock.upsert({ where: { ingredientId_sucursal: { ingredientId: line.ingredientId, sucursal: purchase.sucursal } }, create: { ingredientId: line.ingredientId, sucursal: purchase.sucursal, quantity }, update: { quantity: { increment: quantity } } });
      await tx.inventoryMovement.create({ data: { ingredientId: line.ingredientId, sucursal: purchase.sucursal, type: 'purchase', quantity, referenceId: purchase.id, reason: 'Recepción de compra', createdById: req.user.id } });
    }
    return tx.purchaseOrder.update({ where: { id: purchase.id }, data: { status: 'received', receivedAt: new Date() }, include: { supplier: true, items: { include: { ingredient: true } } } });
  });
  res.json(result);
});

router.get('/cash-shifts', async (req, res) => {
  const where = req.query.branch && req.query.branch !== 'all' ? { sucursal: req.query.branch } : {};
  res.json(await prisma.cashShift.findMany({ where, include: { movements: true }, orderBy: { openedAt: 'desc' }, take: 30 }));
});

router.post('/cash-shifts', async (req, res) => {
  const { sucursal, openingAmount } = req.body;
  if (!['xico', 'coatepec'].includes(sucursal) || Number(openingAmount) < 0) return res.status(400).json({ error: 'Sucursal y fondo inicial válido son obligatorios' });
  const active = await prisma.cashShift.findFirst({ where: { sucursal, status: 'open' } });
  if (active) return res.status(409).json({ error: 'Ya existe un turno de caja abierto' });
  res.status(201).json(await prisma.cashShift.create({ data: { sucursal, openingAmount, openedById: req.user.id } }));
});

router.post('/cash-shifts/:id/movements', async (req, res) => {
  const { type, amount, concept } = req.body;
  if (!['pay_in', 'pay_out'].includes(type) || Number(amount) <= 0 || !concept) return res.status(400).json({ error: 'Tipo, monto y concepto son obligatorios' });
  res.status(201).json(await prisma.cashMovement.create({ data: { cashShiftId: req.params.id, type, amount, concept, createdById: req.user.id } }));
});

router.post('/cash-shifts/:id/close', async (req, res) => {
  const shift = await prisma.cashShift.findUnique({ where: { id: req.params.id }, include: { movements: true } });
  if (!shift || shift.status !== 'open') return res.status(404).json({ error: 'Turno abierto no encontrado' });
  const cashSales = await prisma.order.aggregate({ where: { sucursal: shift.sucursal, estado: 'pagado', metodoPago: 'efectivo', createdAt: { gte: shift.openedAt } }, _sum: { total: true } });
  const payIns = shift.movements.filter((item) => item.type === 'pay_in').reduce((sum, item) => sum + Number(item.amount), 0);
  const payOuts = shift.movements.filter((item) => item.type === 'pay_out').reduce((sum, item) => sum + Number(item.amount), 0);
  const expectedAmount = calculateExpectedCash({ opening: shift.openingAmount, cashSales: cashSales._sum.total || 0, payIns, payOuts });
  const countedAmount = Number(req.body.countedAmount);
  res.json(await prisma.cashShift.update({ where: { id: shift.id }, data: { status: 'closed', countedAmount, expectedAmount, difference: countedAmount - expectedAmount, closedAt: new Date(), closedById: req.user.id, notes: req.body.notes || null }, include: { movements: true } }));
});

router.get('/expenses', async (req, res) => {
  const where = req.query.branch && req.query.branch !== 'all' ? { sucursal: req.query.branch } : {};
  res.json(await prisma.expense.findMany({ where, orderBy: { occurredAt: 'desc' }, take: 100 }));
});
router.post('/expenses', async (req, res) => {
  const { sucursal, category, concept, amount, paymentMethod, supplierId, receiptRef, occurredAt } = req.body;
  if (!['xico', 'coatepec'].includes(sucursal) || !category || !concept || Number(amount) <= 0 || !['efectivo', 'tarjeta'].includes(paymentMethod)) return res.status(400).json({ error: 'Completa los datos válidos del gasto' });
  res.status(201).json(await prisma.expense.create({ data: { sucursal, category, concept, amount, paymentMethod, supplierId: supplierId || null, receiptRef: receiptRef || null, occurredAt: occurredAt ? new Date(occurredAt) : new Date(), createdById: req.user.id } }));
});

const LOYALTY_REWARD_TYPES = ['discount_percent', 'discount_fixed', 'free_item', 'free_shipping'];

router.get('/loyalty/rewards', async (_req, res) => {
  res.json(await prisma.loyaltyReward.findMany({ include: { product: true }, orderBy: { createdAt: 'desc' } }));
});

router.post('/loyalty/rewards', async (req, res) => {
  const { label, type, value, productId, stampsRequired = 6, minOrderAmount = 0 } = req.body;
  if (!label || !LOYALTY_REWARD_TYPES.includes(type)) {
    return res.status(400).json({ error: 'label y type (uno de: ' + LOYALTY_REWARD_TYPES.join(', ') + ') son obligatorios' });
  }
  if (type === 'free_item' && !productId) return res.status(400).json({ error: 'free_item requiere productId' });
  if (Number(stampsRequired) <= 0) return res.status(400).json({ error: 'stampsRequired debe ser mayor a cero' });
  if (Number(minOrderAmount) < 0) return res.status(400).json({ error: 'minOrderAmount no puede ser negativo' });

  const reward = await prisma.$transaction(async (tx) => {
    // Solo una recompensa activa a la vez — es la que se otorga cuando una
    // tarjeta llega a su umbral de sellos.
    await tx.loyaltyReward.updateMany({ where: { activo: true }, data: { activo: false } });
    return tx.loyaltyReward.create({
      data: { label, type, value: value ?? null, productId: type === 'free_item' ? productId : null, stampsRequired: Number(stampsRequired), minOrderAmount: Number(minOrderAmount), activo: true },
      include: { product: true },
    });
  });
  res.status(201).json(reward);
});

router.put('/loyalty/rewards/:id', async (req, res) => {
  const { label, type, value, productId, stampsRequired, minOrderAmount, activo } = req.body;
  if (type && !LOYALTY_REWARD_TYPES.includes(type)) return res.status(400).json({ error: 'type inválido' });

  const reward = await prisma.$transaction(async (tx) => {
    if (activo === true) await tx.loyaltyReward.updateMany({ where: { activo: true, id: { not: req.params.id } }, data: { activo: false } });
    return tx.loyaltyReward.update({
      where: { id: req.params.id },
      data: {
        ...(label !== undefined ? { label } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(value !== undefined ? { value } : {}),
        ...(productId !== undefined ? { productId: productId || null } : {}),
        ...(stampsRequired !== undefined ? { stampsRequired: Number(stampsRequired) } : {}),
        ...(minOrderAmount !== undefined ? { minOrderAmount: Number(minOrderAmount) } : {}),
        ...(activo !== undefined ? { activo } : {}),
      },
      include: { product: true },
    });
  });
  res.json(reward);
});

router.get('/loyalty/redemptions', async (req, res) => {
  const where = req.query.redeemed !== undefined ? { redeemed: req.query.redeemed === 'true' } : {};
  res.json(await prisma.loyaltyRedemption.findMany({
    where,
    include: { reward: true, customer: { select: { nombre: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }));
});

// ── Promoción de cumpleaños — mismo patrón que las recompensas por sellos ──
router.get('/birthday-rewards', async (req, res) => {
  res.json(await prisma.birthdayReward.findMany({ include: { product: true }, orderBy: { createdAt: 'desc' } }));
});

router.post('/birthday-rewards', async (req, res) => {
  const { label, type, value, productId } = req.body;
  if (!label || !LOYALTY_REWARD_TYPES.includes(type)) {
    return res.status(400).json({ error: 'label y type (uno de: ' + LOYALTY_REWARD_TYPES.join(', ') + ') son obligatorios' });
  }
  if (type === 'free_item' && !productId) return res.status(400).json({ error: 'free_item requiere productId' });
  const reward = await prisma.$transaction(async (tx) => {
    await tx.birthdayReward.updateMany({ where: { activo: true }, data: { activo: false } });
    return tx.birthdayReward.create({
      data: { label, type, value: value ?? null, productId: type === 'free_item' ? productId : null, activo: true },
      include: { product: true },
    });
  });
  res.status(201).json(reward);
});

router.put('/birthday-rewards/:id', async (req, res) => {
  const { label, type, value, productId, activo } = req.body;
  if (type && !LOYALTY_REWARD_TYPES.includes(type)) return res.status(400).json({ error: 'type inválido' });
  const reward = await prisma.$transaction(async (tx) => {
    if (activo === true) await tx.birthdayReward.updateMany({ where: { activo: true, id: { not: req.params.id } }, data: { activo: false } });
    return tx.birthdayReward.update({
      where: { id: req.params.id },
      data: {
        ...(label !== undefined ? { label } : {}),
        ...(type !== undefined ? { type } : {}),
        ...(value !== undefined ? { value } : {}),
        ...(productId !== undefined ? { productId: productId || null } : {}),
        ...(activo !== undefined ? { activo } : {}),
      },
      include: { product: true },
    });
  });
  res.json(reward);
});

router.get('/birthday-redemptions', async (req, res) => {
  const where = req.query.redeemed !== undefined ? { redeemed: req.query.redeemed === 'true' } : {};
  res.json(await prisma.birthdayRedemption.findMany({
    where,
    include: { reward: true, customer: { select: { nombre: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }));
});

// ── Programa de puntos (2% de cada pedido, separado de los sellos) — sin
// mínimo genérico: cada producto define su propio costo en puntos, ver
// costoPuntos en PUT /products/:id. ──
router.get('/loyalty/points-redemptions', async (req, res) => {
  const where = req.query.redeemed !== undefined ? { redeemed: req.query.redeemed === 'true' } : {};
  res.json(await prisma.pointsRedemption.findMany({
    where,
    include: { customer: { select: { nombre: true, email: true } } },
    orderBy: { createdAt: 'desc' },
    take: 100,
  }));
});

// ── Eliminación de ventas — nunca se borra la fila, para que se
// contabilice todo. El mesero solo solicita con motivo (ver
// /api/orders/:id/solicitar-eliminacion); aquí el admin aprueba/rechaza o
// elimina (cancela) directo sin pasar por una solicitud. ──
router.get('/orders/eliminaciones-pendientes', async (req, res) => {
  res.json(await prisma.order.findMany({
    where: { eliminacionEstado: 'pendiente' },
    include: { items: true },
    orderBy: { eliminacionSolicitadaAt: 'desc' },
  }));
});

router.put('/orders/:id/eliminacion', async (req, res) => {
  const { aprobar } = req.body;
  const orden = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!orden || orden.eliminacionEstado !== 'pendiente') return res.status(404).json({ error: 'No hay una solicitud pendiente para este pedido' });

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      eliminacionEstado: aprobar ? 'aprobada' : 'rechazada',
      eliminacionResueltaPorId: req.user.id,
      eliminacionResueltaAt: new Date(),
      ...(aprobar ? { estado: 'cancelado' } : {}),
    },
    include: { items: true },
  });
  res.json(updated);
});

// Eliminación directa por el admin, sin pasar por una solicitud del
// mesero — igual "soft delete" (queda como cancelada, nunca desaparece).
router.delete('/orders/:id', async (req, res) => {
  const motivo = req.body?.motivo?.trim() || 'Eliminada directamente por administrador';
  const orden = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!orden) return res.status(404).json({ error: 'Pedido no encontrado' });

  const updated = await prisma.order.update({
    where: { id: req.params.id },
    data: {
      estado: 'cancelado',
      eliminacionEstado: 'aprobada',
      eliminacionMotivo: motivo,
      eliminacionResueltaPorId: req.user.id,
      eliminacionResueltaAt: new Date(),
    },
    include: { items: true },
  });
  res.json(updated);
});

// ── Datos bancarios por sucursal (pago por transferencia) ──
router.get('/branch-settings', async (req, res) => {
  const rows = await prisma.branchSettings.findMany();
  const bySucursal = Object.fromEntries(rows.map((r) => [r.sucursal, r]));
  res.json(['xico', 'coatepec'].map((sucursal) => bySucursal[sucursal] || { sucursal, clabe: null, banco: null, titular: null, envioMinimo: 35 }));
});

router.put('/branch-settings/:sucursal', async (req, res) => {
  const { sucursal } = req.params;
  if (!['xico', 'coatepec'].includes(sucursal)) return res.status(400).json({ error: 'Sucursal inválida' });
  const { clabe, banco, titular, envioMinimo } = req.body;
  if (clabe && !/^\d{18}$/.test(clabe.replace(/\s/g, ''))) {
    return res.status(400).json({ error: 'El CLABE debe tener 18 dígitos' });
  }
  if (envioMinimo !== undefined && (Number.isNaN(Number(envioMinimo)) || Number(envioMinimo) < 0)) {
    return res.status(400).json({ error: 'El envío mínimo debe ser un número válido' });
  }
  const data = { clabe: clabe?.replace(/\s/g, '') || null, banco: banco?.trim() || null, titular: titular?.trim() || null };
  if (envioMinimo !== undefined) data.envioMinimo = Number(envioMinimo);
  const settings = await prisma.branchSettings.upsert({
    where: { sucursal },
    update: data,
    create: { sucursal, ...data },
  });
  res.json(settings);
});

router.get('/delivery-zones', async (req, res) => {
  const where = req.query.branch && req.query.branch !== 'all' ? { sucursal: req.query.branch } : {};
  res.json(await prisma.deliveryZone.findMany({ where, orderBy: [{ sucursal: 'asc' }, { codigoPostal: 'asc' }] }));
});

router.post('/delivery-zones', async (req, res) => {
  const { sucursal, codigoPostal, costoEnvio, etiqueta } = req.body;
  if (!['xico', 'coatepec'].includes(sucursal) || !codigoPostal?.trim() || Number(costoEnvio) < 0 || Number.isNaN(Number(costoEnvio))) {
    return res.status(400).json({ error: 'Sucursal, código postal y costo de envío válidos son obligatorios' });
  }
  try {
    const zona = await prisma.deliveryZone.create({
      data: { sucursal, codigoPostal: codigoPostal.trim(), costoEnvio: Number(costoEnvio), etiqueta: etiqueta?.trim() || null },
    });
    res.status(201).json(zona);
  } catch (error) {
    if (error.code === 'P2002') return res.status(409).json({ error: 'Ya existe una zona para ese código postal en esa sucursal' });
    throw error;
  }
});

router.put('/delivery-zones/:id', async (req, res) => {
  const { costoEnvio, etiqueta, activo } = req.body;
  if (costoEnvio !== undefined && (Number.isNaN(Number(costoEnvio)) || Number(costoEnvio) < 0)) {
    return res.status(400).json({ error: 'Costo de envío inválido' });
  }
  res.json(await prisma.deliveryZone.update({
    where: { id: req.params.id },
    data: {
      ...(costoEnvio !== undefined ? { costoEnvio: Number(costoEnvio) } : {}),
      ...(etiqueta !== undefined ? { etiqueta: etiqueta?.trim() || null } : {}),
      ...(activo !== undefined ? { activo } : {}),
    },
  }));
});

router.delete('/delivery-zones/:id', async (req, res) => {
  await prisma.deliveryZone.delete({ where: { id: req.params.id } });
  res.status(204).end();
});

router.get('/password-reset-requests', async (_req, res) => {
  res.json(await prisma.passwordResetRequest.findMany({ orderBy: { createdAt: 'desc' } }));
});

router.post('/password-reset-requests/:id/resolver', async (req, res) => {
  const request = await prisma.passwordResetRequest.findUnique({ where: { id: req.params.id } });
  if (!request) return res.status(404).json({ error: 'Solicitud no encontrada' });
  const { nuevaPassword } = req.body;
  if (nuevaPassword) {
    if (!request.customerId) return res.status(400).json({ error: 'Esta solicitud no tiene una cuenta de cliente identificada — confirma el correo con el cliente antes de restablecer.' });
    if (nuevaPassword.length < 8) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    await prisma.user.update({ where: { id: request.customerId }, data: { password: await bcrypt.hash(nuevaPassword, 10) } });
  }
  res.json(await prisma.passwordResetRequest.update({
    where: { id: req.params.id },
    data: { estado: 'atendida', resolvedAt: new Date(), resolvedById: req.user.id },
  }));
});

router.get('/customers', async (req, res) => {
  const customers = await prisma.user.findMany({
    where: { role: 'cliente' },
    select: {
      id: true, nombre: true, email: true, telefono: true, fechaNacimiento: true, activo: true, createdAt: true,
      _count: { select: { customerOrders: true, addresses: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
  res.json(customers.map((c) => ({
    id: c.id, nombre: c.nombre, email: c.email, telefono: c.telefono, fechaNacimiento: c.fechaNacimiento,
    activo: c.activo, createdAt: c.createdAt, totalPedidos: c._count.customerOrders, totalDirecciones: c._count.addresses,
  })));
});

router.get('/customers/:id', async (req, res) => {
  const customer = await prisma.user.findUnique({
    where: { id: req.params.id, role: 'cliente' },
    select: {
      id: true, nombre: true, email: true, telefono: true, fechaNacimiento: true, activo: true, createdAt: true,
      addresses: { orderBy: [{ esPrincipal: 'desc' }, { createdAt: 'asc' }] },
      loyaltyCard: true,
      customerOrders: { orderBy: { createdAt: 'desc' }, take: 10, select: { id: true, total: true, estado: true, sucursal: true, tipo: true, createdAt: true } },
    },
  });
  if (!customer) return res.status(404).json({ error: 'Cliente no encontrado' });
  const gastado = await prisma.order.aggregate({
    where: { clienteId: customer.id, estado: 'pagado' },
    _sum: { total: true },
    _count: true,
  });
  res.json({ ...customer, totalPedidosPagados: gastado._count, totalGastado: gastado._sum.total || 0 });
});

router.use((error, _req, res, _next) => {
  console.error('Error en módulo administrativo:', error);
  res.status(500).json({ error: 'No pudimos completar la operación administrativa' });
});

module.exports = router;
