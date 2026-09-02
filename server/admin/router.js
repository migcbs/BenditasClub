const express = require('express');
const prisma = require('../../lib/prisma');
const { verifyToken, requireRole } = require('../../middleware/auth');
const { calculateExpectedCash, classifyInventoryHealth } = require('./inventory');

const router = express.Router();
router.use(verifyToken, requireRole('admin'));

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

router.use((error, _req, res, _next) => {
  console.error('Error en módulo administrativo:', error);
  res.status(500).json({ error: 'No pudimos completar la operación administrativa' });
});

module.exports = router;
