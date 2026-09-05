// index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = require('./lib/prisma');
const { verifyToken, requireRole, optionalAuth } = require('./middleware/auth');
const {
  parseDashboardFilters,
  summarizeOrders,
  groupTopProducts,
  groupByBranch,
  groupHourlySales,
} = require('./server/admin/analytics');
const adminRouter = require('./server/admin/router');
const { applyInventoryForOrder } = require('./server/admin/inventory-service');
const { classifyInventoryHealth, calculateExpectedCash } = require('./server/admin/inventory');
const { awardStampForOrder, awardPointsForOrder, generateRedemptionCode } = require('./server/loyalty/loyalty-service');

const JWT_SECRET = process.env.JWT_SECRET;
const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Cualquier puerto de localhost siempre se acepta (desarrollo). En
// producción, además, los dominios reales listados en ALLOWED_ORIGINS
// (separados por coma, ej. "https://www.benditasclub.com,https://benditasclub.com").
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl / tests sin Origin
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // callback(null, false) en vez de un Error: un origen no listado en
    // ALLOWED_ORIGINS responde sin headers CORS (el navegador bloquea la
    // lectura de la respuesta, como debe ser), en vez de reventar como un
    // 500 genérico que tumba CUALQUIER llamada real — así, si algún día
    // falta agregar un dominio a la lista, solo ese dominio se ve afectado
    // y no el sitio entero.
    callback(null, false);
  },
  credentials: true,
}));

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

async function buildOrderItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('tipo e items (no vacío) son obligatorios');
    error.status = 400;
    throw error;
  }

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds }, activo: true } });
  const productMap = new Map(products.map((p) => [p.id, p]));

  const orderItemsData = [];
  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      const error = new Error(`Producto no encontrado: ${item.productId}`);
      error.status = 400;
      throw error;
    }
    const cantidad = item.cantidad || 1;
    const sabores = Array.isArray(item.sabores) ? item.sabores : [];
    if (product.maxSabores !== null && sabores.length > product.maxSabores) {
      const error = new Error(`${product.nombre} admite máximo ${product.maxSabores} sabores`);
      error.status = 400;
      throw error;
    }
    const subtotal = product.precio * cantidad;
    orderItemsData.push({
      productId: product.id,
      nombre: product.nombre,
      precio: product.precio,
      cantidad,
      sabores,
      subtotal,
    });
  }

  return orderItemsData;
}

function safeCustomer(user) {
  const { password: _, pin: __, ...safeUser } = user;
  return safeUser;
}

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    console.error('❌ Error health check:', e);
    res.status(500).json({ ok: false });
  }
});

app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { nombre, email, password, telefono, direccion, fechaNacimiento } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, email, password' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }
    // Teléfono obligatorio: es el dato de contacto que usa el staff para
    // pedidos en línea (mismo formato de 10 dígitos que el popup de pedido).
    const telLimpio = (telefono || '').replace(/\D/g, '');
    if (telLimpio.length !== 10) {
      return res.status(400).json({ error: 'Teléfono a 10 dígitos es obligatorio' });
    }
    // Opcional: habilita la promoción de cumpleaños si el admin configura una.
    let fechaNacimientoParsed = null;
    if (fechaNacimiento) {
      fechaNacimientoParsed = new Date(fechaNacimiento);
      if (Number.isNaN(fechaNacimientoParsed.getTime())) return res.status(400).json({ error: 'Fecha de nacimiento inválida' });
    }

    const emailLimpio = email.toLowerCase().trim();
    const existe = await prisma.user.findUnique({ where: { email: emailLimpio } });
    if (existe) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        nombre,
        email: emailLimpio,
        password: hashedPassword,
        role: 'cliente',
        telefono: telLimpio,
        fechaNacimiento: fechaNacimientoParsed,
        // Dirección opcional al registrarse: si la dan, queda como su
        // primera dirección guardada (ver modelo Address) — puede agregar
        // más después desde su perfil.
        ...(direccion?.trim() ? { addresses: { create: { direccion: direccion.trim(), esPrincipal: true } } } : {}),
      },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, pin: __, ...safeUser } = newUser;
    res.status(201).json({ success: true, token, user: safeUser });
  } catch (e) {
    console.error('❌ Error registro:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, pin: __, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });
  } catch (e) {
    console.error('❌ Error login:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// Sin correo saliente: registra la solicitud para que el admin la vea en
// Configuración y restablezca la contraseña a mano — el seguimiento real
// pasa por WhatsApp (ver mensaje que se le muestra al cliente al enviar).
// No revela si el correo existe o no: siempre responde success para no
// filtrar qué correos están registrados.
app.post('/api/auth/solicitar-restablecimiento', authLimiter, async (req, res) => {
  try {
    const { email, nombre, telefono } = req.body;
    if (!email) return res.status(400).json({ error: 'El correo es obligatorio' });
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    await prisma.passwordResetRequest.create({
      data: {
        email: normalizedEmail,
        nombre: nombre?.trim() || null,
        telefono: telefono?.trim() || null,
        customerId: user?.role === 'cliente' ? user.id : null,
      },
    });
    res.status(201).json({ success: true });
  } catch (e) {
    console.error('❌ Error solicitando restablecimiento:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/auth/staff-login', authLimiter, async (req, res) => {
  try {
    const { sucursal, pin } = req.body;
    if (!sucursal || !pin) {
      return res.status(400).json({ error: 'sucursal y pin son obligatorios' });
    }

    const candidatos = await prisma.user.findMany({
      where: { sucursal, role: { in: ['empleado', 'cocina'] }, activo: true },
    });

    let match = null;
    for (const candidato of candidatos) {
      if (candidato.pin && (await bcrypt.compare(pin, candidato.pin))) {
        match = candidato;
        break;
      }
    }

    if (!match) {
      return res.status(401).json({ error: 'PIN o sucursal incorrectos' });
    }

    const token = jwt.sign(
      { id: match.id, role: match.role, sucursal: match.sucursal },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    const { password: _, pin: __, ...safeUser } = match;
    res.json({ success: true, token, user: safeUser });
  } catch (e) {
    console.error('❌ Error staff-login:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/admin/session', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, nombre: true, email: true, role: true, activo: true, createdAt: true },
    });
    if (!user || !user.activo) return res.status(401).json({ error: 'Cuenta administrativa inactiva' });
    res.json({ user });
  } catch (e) {
    console.error('❌ Error validando sesión admin:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/customer/me', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, nombre: true, email: true, telefono: true, fechaNacimiento: true, role: true, activo: true, createdAt: true },
    });
    if (!user || !user.activo) return res.status(401).json({ error: 'Cuenta inactiva' });
    res.json({ user });
  } catch (e) {
    console.error('❌ Error perfil cliente:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.put('/api/customer/me', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const { nombre, telefono, fechaNacimiento } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'El nombre es obligatorio' });
    let fechaNacimientoParsed;
    if (fechaNacimiento !== undefined) {
      fechaNacimientoParsed = fechaNacimiento ? new Date(fechaNacimiento) : null;
      if (fechaNacimientoParsed && Number.isNaN(fechaNacimientoParsed.getTime())) return res.status(400).json({ error: 'Fecha de nacimiento inválida' });
    }
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        ...(fechaNacimiento !== undefined ? { fechaNacimiento: fechaNacimientoParsed } : {}),
      },
      select: { id: true, nombre: true, email: true, telefono: true, fechaNacimiento: true, role: true, activo: true, createdAt: true },
    });
    res.json({ user });
  } catch (e) {
    console.error('❌ Error actualizando perfil cliente:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.put('/api/customer/password', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const { passwordActual, passwordNueva } = req.body;
    if (!passwordActual || !passwordNueva) return res.status(400).json({ error: 'La contraseña actual y la nueva son obligatorias' });
    if (passwordNueva.length < 8) return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user?.password || !(await bcrypt.compare(passwordActual, user.password))) {
      return res.status(401).json({ error: 'La contraseña actual no es correcta' });
    }
    await prisma.user.update({ where: { id: req.user.id }, data: { password: await bcrypt.hash(passwordNueva, 10) } });
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error cambiando contraseña de cliente:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// ── Direcciones guardadas del cliente (una cuenta puede tener varias:
// casa, trabajo, etc.) — se usan al pedir a domicilio en vez de escribir
// la dirección cada vez. ──
app.get('/api/customer/addresses', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user.id },
      orderBy: [{ esPrincipal: 'desc' }, { createdAt: 'asc' }],
    });
    res.json(addresses);
  } catch (e) {
    console.error('❌ Error listando direcciones:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/customer/addresses', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const { etiqueta, direccion, esPrincipal } = req.body;
    if (!direccion?.trim()) return res.status(400).json({ error: 'La dirección es obligatoria' });

    if (esPrincipal) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { esPrincipal: false } });
    }
    const address = await prisma.address.create({
      data: { userId: req.user.id, etiqueta: etiqueta?.trim() || null, direccion: direccion.trim(), esPrincipal: !!esPrincipal },
    });
    res.status(201).json(address);
  } catch (e) {
    console.error('❌ Error creando dirección:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.put('/api/customer/addresses/:id', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) return res.status(404).json({ error: 'Dirección no encontrada' });

    const { etiqueta, direccion, esPrincipal } = req.body;
    if (esPrincipal) {
      await prisma.address.updateMany({ where: { userId: req.user.id }, data: { esPrincipal: false } });
    }
    const address = await prisma.address.update({
      where: { id: req.params.id },
      data: {
        ...(etiqueta !== undefined ? { etiqueta: etiqueta?.trim() || null } : {}),
        ...(direccion !== undefined ? { direccion: direccion.trim() } : {}),
        ...(esPrincipal !== undefined ? { esPrincipal: !!esPrincipal } : {}),
      },
    });
    res.json(address);
  } catch (e) {
    console.error('❌ Error actualizando dirección:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.delete('/api/customer/addresses/:id', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const existing = await prisma.address.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.user.id) return res.status(404).json({ error: 'Dirección no encontrada' });
    await prisma.address.delete({ where: { id: req.params.id } });
    res.status(204).end();
  } catch (e) {
    console.error('❌ Error eliminando dirección:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/admin/dashboard', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    let filters;
    try {
      filters = parseDashboardFilters(req.query);
    } catch (error) {
      return res.status(400).json({ error: error.message });
    }

    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: filters.from, lte: filters.to },
        ...(filters.branch !== 'all' ? { sucursal: filters.branch } : {}),
      },
      include: {
        items: true,
        empleado: { select: { id: true, nombre: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Alertas de inventario reales: un insumo cuenta como alerta si su stock
    // está bajo/crítico en CUALQUIER sucursal cuando se ven "Todas", o en la
    // sucursal filtrada específicamente.
    const ingredients = await prisma.ingredient.findMany({
      where: { activo: true },
      include: {
        stocks: filters.branch !== 'all' ? { where: { sucursal: filters.branch } } : true,
      },
    });
    const alerts = ingredients
      .filter((ingredient) =>
        ingredient.stocks.some((stock) => classifyInventoryHealth(stock.quantity, ingredient.reorderPoint) !== 'healthy')
      )
      .map((ingredient) => ({ type: 'stock', ingredientId: ingredient.id, nombre: ingredient.nombre }));

    res.json({
      filters: {
        branch: filters.branch,
        from: filters.from.toISOString(),
        to: filters.to.toISOString(),
      },
      summary: summarizeOrders(orders),
      byBranch: groupByBranch(orders),
      topProducts: groupTopProducts(orders),
      hourlySales: groupHourlySales(orders),
      recentOrders: orders.slice(0, 8),
      alerts,
    });
  } catch (e) {
    console.error('❌ Error dashboard admin:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// Pública (sin login) — el popup de pedido la usa para mostrar el CLABE de
// la sucursal elegida cuando el cliente paga por transferencia. Solo
// expone clabe/banco/titular, nada administrativo.
app.get('/api/branch-settings/:sucursal', async (req, res) => {
  try {
    const { sucursal } = req.params;
    if (!['xico', 'coatepec'].includes(sucursal)) return res.status(400).json({ error: 'Sucursal inválida' });
    const settings = await prisma.branchSettings.findUnique({ where: { sucursal } });
    res.json({
      sucursal,
      clabe: settings?.clabe || null,
      banco: settings?.banco || null,
      titular: settings?.titular || null,
    });
  } catch (e) {
    console.error('❌ Error obteniendo datos de transferencia:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { activo: true, tipo: 'comida' },
      include: { category: { select: { nombre: true, orden: true } } },
      orderBy: [{ category: { orden: 'asc' } }, { nombre: 'asc' }],
    });
    res.json(products);
  } catch (e) {
    console.error('❌ Error listando productos:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/shop/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { activo: true, tipo: 'merch' },
      include: {
        category: { select: { nombre: true, orden: true } },
        variants: { where: { activo: true }, include: { stocks: true }, orderBy: { orden: 'asc' } },
      },
      orderBy: [{ category: { orden: 'asc' } }, { nombre: 'asc' }],
    });
    const conEstado = products.map((product) => ({
      ...product,
      variants: product.variants.map((variant) => {
        const totalStock = variant.stocks.reduce((sum, stock) => sum + stock.quantity, 0);
        const estado = totalStock <= 0 ? 'agotado' : totalStock <= 5 ? 'poco' : 'disponible';
        return { ...variant, totalStock, estado };
      }),
    }));
    res.json(conEstado);
  } catch (e) {
    console.error('❌ Error listando catálogo de merch:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/customer/shop-orders', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const { sucursal, tipoEntrega, direccion, notas, items } = req.body;
    if (!['xico', 'coatepec'].includes(sucursal) || !['recoger', 'domicilio'].includes(tipoEntrega)) {
      return res.status(400).json({ error: 'Sucursal y tipo de entrega válidos son obligatorios' });
    }
    if (tipoEntrega === 'domicilio' && !direccion?.trim()) {
      return res.status(400).json({ error: 'La dirección es obligatoria para domicilio' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items (no vacío) es obligatorio' });
    }

    const customer = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!customer || !customer.activo) return res.status(401).json({ error: 'Cuenta inactiva' });

    const variantIds = items.map((i) => i.variantId);
    const variants = await prisma.productVariant.findMany({
      where: { id: { in: variantIds }, activo: true },
      include: { product: true, stocks: { where: { sucursal } } },
    });
    const variantMap = new Map(variants.map((v) => [v.id, v]));

    const orderItemsData = [];
    for (const item of items) {
      const variant = variantMap.get(item.variantId);
      if (!variant) return res.status(400).json({ error: `Variante no encontrada: ${item.variantId}` });
      const cantidad = item.cantidad || 1;
      const disponible = variant.stocks[0]?.quantity ?? 0;
      if (disponible < cantidad) {
        return res.status(400).json({ error: `No hay suficiente stock de ${variant.product.nombre} (${variant.nombre})` });
      }
      orderItemsData.push({
        variantId: variant.id,
        nombre: variant.product.nombre,
        varianteNombre: variant.nombre,
        precio: variant.precio,
        cantidad,
        subtotal: variant.precio * cantidad,
      });
    }

    const total = orderItemsData.reduce((acc, i) => acc + i.subtotal, 0);

    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.merchOrder.create({
        data: {
          sucursal,
          tipoEntrega,
          clienteId: customer.id,
          clienteNombre: customer.nombre,
          clienteTelefono: customer.telefono,
          direccion: direccion || null,
          notas: notas || null,
          total,
          items: { create: orderItemsData },
        },
        include: { items: true },
      });
      for (const item of orderItemsData) {
        await tx.variantStock.update({
          where: { variantId_sucursal: { variantId: item.variantId, sucursal } },
          data: { quantity: { decrement: item.cantidad } },
        });
      }
      return created;
    });

    res.status(201).json(order);
  } catch (e) {
    console.error('❌ Error creando pedido de merch:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// optionalAuth (no verifyToken/requireRole): un pedido en línea debe
// guardarse tanto si el cliente tiene cuenta como si es invitado — antes
// esta ruta exigía sesión de cliente y los pedidos de invitados (el caso
// más común, vía el botón "Haz tu pedido" sin login) nunca llegaban a la
// BD ni a Recepción/Cocina/Admin, solo se mandaban por WhatsApp.
app.post('/api/customer/orders', optionalAuth, async (req, res) => {
  try {
    const { sucursal, tipo, direccion, notas, items, nombre, telefono } = req.body;
    if (!['xico', 'coatepec'].includes(sucursal) || !['para_llevar', 'domicilio'].includes(tipo)) {
      return res.status(400).json({ error: 'Sucursal y tipo de pedido válidos son obligatorios' });
    }
    if (tipo === 'domicilio' && !direccion?.trim()) {
      return res.status(400).json({ error: 'La dirección es obligatoria para domicilio' });
    }

    let clienteId = null;
    let clienteNombre;
    let clienteTelefono;

    if (req.user?.role === 'cliente') {
      const customer = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!customer || !customer.activo) return res.status(401).json({ error: 'Cuenta inactiva' });
      clienteId = customer.id;
      clienteNombre = customer.nombre;
      clienteTelefono = customer.telefono;
    } else {
      // Invitado: no hay cuenta de la que tomar nombre/teléfono, así que
      // vienen directo del formulario del popup (mismos campos que ya
      // se piden para el mensaje de WhatsApp).
      const telLimpio = (telefono || '').replace(/\D/g, '');
      if (!nombre?.trim() || telLimpio.length !== 10) {
        return res.status(400).json({ error: 'Nombre y teléfono a 10 dígitos son obligatorios' });
      }
      clienteNombre = nombre.trim();
      clienteTelefono = telLimpio;
    }

    let orderItemsData;
    try {
      orderItemsData = await buildOrderItems(items);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }

    const total = orderItemsData.reduce((acc, i) => acc + i.subtotal, 0);
    const order = await prisma.order.create({
      data: {
        sucursal,
        tipo,
        clienteId,
        clienteNombre,
        clienteTelefono,
        direccion: direccion || null,
        notas: notas || null,
        total,
        origen: 'online',
        // recibidoEn queda null a propósito: un pedido en línea entra primero
        // a la cola de Recepción (POS) y solo aparece en cocina/POS una vez
        // que el staff lo acepta vía PUT /api/orders/:id/recepcion.
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    res.status(201).json(order);
  } catch (e) {
    console.error('❌ Error creando pedido cliente:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/customer/orders', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const orders = await prisma.order.findMany({
      where: { clienteId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(orders);
  } catch (e) {
    console.error('❌ Error historial cliente:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/customer/loyalty', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const [card, activeReward, redemptions, productosCanjeables, pointsRedemptions, activeBirthdayReward, birthdayRedemptions, me] = await Promise.all([
      prisma.loyaltyCard.findUnique({ where: { customerId: req.user.id } }),
      prisma.loyaltyReward.findFirst({ where: { activo: true }, include: { product: true } }),
      prisma.loyaltyRedemption.findMany({
        where: { customerId: req.user.id },
        include: { reward: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      // Sin mínimo genérico: cualquier producto con costoPuntos es
      // canjeable en cuanto el cliente junte esa cantidad exacta.
      prisma.product.findMany({ where: { activo: true, costoPuntos: { not: null } }, orderBy: { costoPuntos: 'asc' } }),
      prisma.pointsRedemption.findMany({ where: { customerId: req.user.id }, include: { product: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
      prisma.birthdayReward.findFirst({ where: { activo: true }, include: { product: true } }),
      prisma.birthdayRedemption.findMany({ where: { customerId: req.user.id }, include: { reward: true }, orderBy: { createdAt: 'desc' } }),
      prisma.user.findUnique({ where: { id: req.user.id }, select: { fechaNacimiento: true } }),
    ]);
    res.json({
      stamps: card?.stamps ?? 0,
      stampsRequired: activeReward?.stampsRequired ?? 6,
      activeReward,
      redemptions,
      puntos: Number(card?.puntos ?? 0),
      productosCanjeables,
      pointsRedemptions,
      activeBirthdayReward,
      birthdayRedemptions,
      fechaNacimiento: me?.fechaNacimiento,
    });
  } catch (e) {
    console.error('❌ Error consultando fidelidad:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/loyalty/redeem', verifyToken, requireRole('empleado', 'admin'), async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code es obligatorio' });

    const redemption = await prisma.loyaltyRedemption.findUnique({ where: { code: code.toUpperCase().trim() }, include: { reward: true, customer: { select: { nombre: true } } } });
    if (!redemption) return res.status(404).json({ error: 'Código no encontrado' });
    if (redemption.redeemed) return res.status(409).json({ error: `Este código ya se canjeó el ${new Date(redemption.redeemedAt).toLocaleString('es-MX')}` });

    const updated = await prisma.loyaltyRedemption.update({
      where: { id: redemption.id },
      data: { redeemed: true, redeemedAt: new Date() },
      include: { reward: true, customer: { select: { nombre: true } } },
    });
    res.json(updated);
  } catch (e) {
    console.error('❌ Error canjeando recompensa:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// El cliente reclama el regalo de cumpleaños — solo si hoy es su
// cumpleaños (mismo día y mes que fechaNacimiento) y no lo ha reclamado ya
// este mismo año calendario.
app.post('/api/customer/birthday/reclamar', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user.fechaNacimiento) return res.status(400).json({ error: 'No tienes registrada tu fecha de nacimiento.' });

    const hoy = new Date();
    const nacimiento = new Date(user.fechaNacimiento);
    if (hoy.getUTCMonth() !== nacimiento.getUTCMonth() || hoy.getUTCDate() !== nacimiento.getUTCDate()) {
      return res.status(400).json({ error: 'Hoy no es tu cumpleaños.' });
    }

    const activeReward = await prisma.birthdayReward.findFirst({ where: { activo: true } });
    if (!activeReward) return res.status(404).json({ error: 'No hay una promoción de cumpleaños activa.' });

    const year = hoy.getUTCFullYear();
    const yaReclamado = await prisma.birthdayRedemption.findUnique({ where: { customerId_year: { customerId: req.user.id, year } } });
    if (yaReclamado) return res.status(409).json({ error: 'Ya reclamaste tu regalo de cumpleaños este año.' });

    const redemption = await prisma.birthdayRedemption.create({
      data: { customerId: req.user.id, rewardId: activeReward.id, year, code: generateRedemptionCode() },
      include: { reward: true },
    });
    res.status(201).json(redemption);
  } catch (e) {
    console.error('❌ Error reclamando cumpleaños:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/loyalty/birthday/redeem', verifyToken, requireRole('empleado', 'admin'), async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code es obligatorio' });
    const redemption = await prisma.birthdayRedemption.findUnique({ where: { code: code.toUpperCase().trim() }, include: { reward: true, customer: { select: { nombre: true } } } });
    if (!redemption) return res.status(404).json({ error: 'Código no encontrado' });
    if (redemption.redeemed) return res.status(409).json({ error: `Este código ya se canjeó el ${new Date(redemption.redeemedAt).toLocaleString('es-MX')}` });
    const updated = await prisma.birthdayRedemption.update({
      where: { id: redemption.id },
      data: { redeemed: true, redeemedAt: new Date() },
      include: { reward: true, customer: { select: { nombre: true } } },
    });
    res.json(updated);
  } catch (e) {
    console.error('❌ Error canjeando cumpleaños:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// El cliente canjea puntos por UN producto específico (no un monto libre)
// — se descuenta solo el costoPuntos de ese producto de su saldo, nunca
// todo el balance. Genera un código para mostrar en sucursal, igual que
// las recompensas por sellos.
app.post('/api/customer/points/canjear', verifyToken, requireRole('cliente'), async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'productId es obligatorio' });

    const redemption = await prisma.$transaction(async (tx) => {
      const producto = await tx.product.findUnique({ where: { id: productId } });
      if (!producto || !producto.activo || producto.costoPuntos == null) {
        const error = new Error('Ese producto no está disponible para canje con puntos.');
        error.status = 400;
        throw error;
      }
      const card = await tx.loyaltyCard.findUnique({ where: { customerId: req.user.id } });
      const puntos = Number(card?.puntos ?? 0);
      if (puntos < producto.costoPuntos) {
        const error = new Error(`Necesitas ${producto.costoPuntos} puntos para "${producto.nombre}" (tienes ${puntos}).`);
        error.status = 400;
        throw error;
      }
      await tx.loyaltyCard.update({ where: { customerId: req.user.id }, data: { puntos: { decrement: producto.costoPuntos } } });
      return tx.pointsRedemption.create({
        data: { customerId: req.user.id, productId: producto.id, puntos: producto.costoPuntos, code: generateRedemptionCode() },
        include: { product: true },
      });
    });
    res.status(201).json(redemption);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    console.error('❌ Error canjeando puntos:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// Staff marca un código de puntos como entregado en sucursal — mismo
// patrón que /api/loyalty/redeem para recompensas por sellos.
app.post('/api/loyalty/points/redeem', verifyToken, requireRole('empleado', 'admin'), async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'code es obligatorio' });
    const redemption = await prisma.pointsRedemption.findUnique({ where: { code: code.toUpperCase().trim() }, include: { customer: { select: { nombre: true } } } });
    if (!redemption) return res.status(404).json({ error: 'Código no encontrado' });
    if (redemption.redeemed) return res.status(409).json({ error: `Este código ya se canjeó el ${new Date(redemption.redeemedAt).toLocaleString('es-MX')}` });
    const updated = await prisma.pointsRedemption.update({
      where: { id: redemption.id },
      data: { redeemed: true, redeemedAt: new Date() },
      include: { customer: { select: { nombre: true } } },
    });
    res.json(updated);
  } catch (e) {
    console.error('❌ Error canjeando puntos:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/admin/products', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, precio, categoryId, maxSabores, isPromotion, tipo, imagenUrl, costoPuntos } = req.body;
    if (!nombre || precio === undefined || !categoryId) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, precio, categoryId' });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(400).json({ error: 'categoryId no existe' });

    const product = await prisma.product.create({
      data: {
        nombre, precio, categoryId,
        maxSabores: maxSabores ?? null,
        isPromotion: isPromotion ?? false,
        tipo: tipo === 'merch' ? 'merch' : 'comida',
        imagenUrl: imagenUrl || null,
        costoPuntos: costoPuntos != null && costoPuntos !== '' ? Number(costoPuntos) : null,
      },
    });
    res.status(201).json(product);
  } catch (e) {
    console.error('❌ Error creando producto:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.put('/api/admin/products/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, precio, categoryId, maxSabores, isPromotion, activo, imagenUrl, costoPuntos } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        nombre, precio, categoryId, maxSabores, isPromotion, activo, imagenUrl,
        ...(costoPuntos !== undefined ? { costoPuntos: costoPuntos === '' || costoPuntos === null ? null : Number(costoPuntos) } : {}),
      },
    });
    res.json(product);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Producto no encontrado' });
    console.error('❌ Error actualizando producto:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.delete('/api/admin/products/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { activo: false },
    });
    res.json(product);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Producto no encontrado' });
    console.error('❌ Error eliminando producto:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/admin/categories', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { orden: 'asc' } });
    res.json(categories);
  } catch (e) {
    console.error('❌ Error listando categorías:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/admin/categories', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, orden } = req.body;
    if (!nombre?.trim()) return res.status(400).json({ error: 'nombre es obligatorio' });
    const category = await prisma.category.create({ data: { nombre: nombre.trim(), orden: orden ?? 0 } });
    res.status(201).json(category);
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Ya existe una categoría con ese nombre' });
    console.error('❌ Error creando categoría:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/admin/merch/products', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { tipo: 'merch' },
      include: {
        category: { select: { nombre: true, orden: true } },
        variants: { include: { stocks: true }, orderBy: { orden: 'asc' } },
      },
      orderBy: [{ category: { orden: 'asc' } }, { nombre: 'asc' }],
    });
    res.json(products);
  } catch (e) {
    console.error('❌ Error listando productos de merch:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/admin/merch/orders', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const orders = await prisma.merchOrder.findMany({
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    res.json(orders);
  } catch (e) {
    console.error('❌ Error listando pedidos de merch:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/admin/products/:id/variants', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, precio, imagenUrl, sku } = req.body;
    if (!nombre?.trim() || precio === undefined) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, precio' });
    }
    const product = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: 'Producto no encontrado' });

    const variant = await prisma.$transaction(async (tx) => {
      const created = await tx.productVariant.create({
        data: { productId: product.id, nombre: nombre.trim(), precio, imagenUrl: imagenUrl || null, sku: sku || null },
      });
      for (const sucursal of ['xico', 'coatepec']) {
        await tx.variantStock.create({ data: { variantId: created.id, sucursal, quantity: 0 } });
      }
      return tx.productVariant.findUnique({ where: { id: created.id }, include: { stocks: true } });
    });
    res.status(201).json(variant);
  } catch (e) {
    console.error('❌ Error creando variante:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.put('/api/admin/variants/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, precio, imagenUrl, activo } = req.body;
    const variant = await prisma.productVariant.update({
      where: { id: req.params.id },
      data: { nombre, precio, imagenUrl, activo },
    });
    res.json(variant);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Variante no encontrada' });
    console.error('❌ Error actualizando variante:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.put('/api/admin/variants/:id/stock', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { sucursal, quantity } = req.body;
    if (!['xico', 'coatepec'].includes(sucursal) || typeof quantity !== 'number' || quantity < 0) {
      return res.status(400).json({ error: 'sucursal válida y quantity (>= 0) son obligatorios' });
    }
    const variant = await prisma.productVariant.findUnique({ where: { id: req.params.id } });
    if (!variant) return res.status(404).json({ error: 'Variante no encontrada' });

    const stock = await prisma.variantStock.upsert({
      where: { variantId_sucursal: { variantId: variant.id, sucursal } },
      update: { quantity },
      create: { variantId: variant.id, sucursal, quantity },
    });
    res.json(stock);
  } catch (e) {
    console.error('❌ Error actualizando stock de variante:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/admin/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { sucursal } = req.query;
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['empleado', 'cocina'] },
        ...(sucursal ? { sucursal } : {}),
      },
      select: { id: true, nombre: true, role: true, sucursal: true, activo: true, createdAt: true },
    });
    res.json(users);
  } catch (e) {
    console.error('❌ Error listando staff:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/admin/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, role, sucursal, pin } = req.body;

    if (!nombre || !role || !sucursal || !pin) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, role, sucursal, pin' });
    }
    if (!['empleado', 'cocina'].includes(role)) {
      return res.status(400).json({ error: 'role debe ser empleado o cocina' });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'pin debe ser exactamente 4 dígitos' });
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    const user = await prisma.user.create({
      data: { nombre, role, sucursal, pin: hashedPin },
    });

    const { password: _, pin: __, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (e) {
    console.error('❌ Error creando staff:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.put('/api/admin/users/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, role, sucursal, activo, pin } = req.body;
    const data = {};
    if (nombre !== undefined) data.nombre = nombre;
    if (role !== undefined) {
      if (!['empleado', 'cocina'].includes(role)) return res.status(400).json({ error: 'role debe ser empleado o cocina' });
      data.role = role;
    }
    if (sucursal !== undefined) data.sucursal = sucursal;
    if (activo !== undefined) data.activo = activo;
    if (pin) {
      if (!/^\d{4}$/.test(pin)) return res.status(400).json({ error: 'pin debe ser exactamente 4 dígitos' });
      data.pin = await bcrypt.hash(pin, 10);
    }
    const user = await prisma.user.update({ where: { id: req.params.id }, data });
    const { password: _, pin: __, ...safeUser } = user;
    res.json(safeUser);
  } catch (e) {
    console.error('❌ Error editando staff:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/orders', verifyToken, requireRole('empleado'), async (req, res) => {
  try {
    const { tipo, mesa, clienteNombre, clienteTelefono, direccion, notas, items } = req.body;

    if (!tipo) {
      return res.status(400).json({ error: 'tipo e items (no vacío) son obligatorios' });
    }

    let orderItemsData;
    try {
      orderItemsData = await buildOrderItems(items);
    } catch (error) {
      return res.status(error.status || 500).json({ error: error.message });
    }

    const total = orderItemsData.reduce((acc, i) => acc + i.subtotal, 0);

    const order = await prisma.order.create({
      data: {
        sucursal: req.user.sucursal,
        tipo,
        mesa: mesa || null,
        clienteNombre: clienteNombre || null,
        clienteTelefono: clienteTelefono || null,
        direccion: direccion || null,
        notas: notas || null,
        total,
        empleadoId: req.user.id,
        origen: 'pos',
        recibidoEn: new Date(), // un pedido tomado en caja/mesa ya pasó por una persona, no necesita Recepción
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    res.status(201).json(order);
  } catch (e) {
    console.error('❌ Error creando pedido:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.get('/api/orders', verifyToken, requireRole('empleado', 'cocina'), async (req, res) => {
  try {
    const { estado, pendientes } = req.query;
    const orders = await prisma.order.findMany({
      where: {
        sucursal: req.user.sucursal,
        ...(estado ? { estado } : {}),
        // Por default solo se listan pedidos ya recibidos (tomados en caja o
        // aceptados en Recepción). ?pendientes=true expone la cola de
        // Recepción: pedidos en línea que todavía no ha filtrado nadie.
        ...(pendientes === 'true' ? { recibidoEn: null } : { recibidoEn: { not: null } }),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (e) {
    console.error('❌ Error listando pedidos:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.put('/api/orders/:id/recepcion', verifyToken, requireRole('empleado'), async (req, res) => {
  try {
    const { aceptar, motivo } = req.body;
    if (typeof aceptar !== 'boolean') {
      return res.status(400).json({ error: 'aceptar debe ser true o false' });
    }
    if (!aceptar && !motivo?.trim()) {
      return res.status(400).json({ error: 'El motivo de rechazo es obligatorio' });
    }

    const orden = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!orden || orden.sucursal !== req.user.sucursal) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    if (orden.recibidoEn) {
      return res.status(400).json({ error: 'Este pedido ya fue procesado en recepción' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        recibidoEn: new Date(),
        ...(aceptar ? {} : { estado: 'cancelado', motivoRechazo: motivo.trim() }),
      },
      include: { items: true },
    });
    res.json(updated);
  } catch (e) {
    console.error('❌ Error procesando recepción:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.put('/api/orders/:id/estado', verifyToken, requireRole('empleado'), async (req, res) => {
  try {
    const { estado, metodoPago } = req.body;
    if (!['pagado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ error: 'estado debe ser pagado o cancelado' });
    }
    if (estado === 'pagado' && !metodoPago) {
      return res.status(400).json({ error: 'metodoPago es obligatorio para marcar como pagado' });
    }

    const orden = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!orden || orden.sucursal !== req.user.sucursal) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const orderUpdated = await tx.order.update({
        where: { id: req.params.id },
        data: { estado, ...(metodoPago ? { metodoPago } : {}) },
        include: { items: true },
      });
      if (estado === 'pagado') {
        await applyInventoryForOrder(tx, orderUpdated.id, req.user.id);
        await awardStampForOrder(tx, orderUpdated);
        await awardPointsForOrder(tx, orderUpdated);
      }
      return tx.order.findUnique({ where: { id: orderUpdated.id }, include: { items: true } });
    });
    res.json(updated);
  } catch (e) {
    console.error('❌ Error actualizando estado del pedido:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// El mesero nunca puede borrar ni cancelar una venta directamente — solo
// pedirlo con un motivo. El admin decide (aprobar cancela de verdad la
// venta, rechazar la deja como estaba) para que quede registro de todo.
app.post('/api/orders/:id/solicitar-eliminacion', verifyToken, requireRole('empleado'), async (req, res) => {
  try {
    const motivo = req.body.motivo?.trim();
    if (!motivo) return res.status(400).json({ error: 'El motivo es obligatorio' });

    const orden = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!orden || orden.sucursal !== req.user.sucursal) return res.status(404).json({ error: 'Pedido no encontrado' });
    if (orden.eliminacionEstado === 'pendiente') return res.status(409).json({ error: 'Ya hay una solicitud pendiente para este pedido' });

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: {
        eliminacionEstado: 'pendiente',
        eliminacionMotivo: motivo,
        eliminacionSolicitadaPorId: req.user.id,
        eliminacionSolicitadaAt: new Date(),
      },
      include: { items: true },
    });
    res.json(updated);
  } catch (e) {
    console.error('❌ Error solicitando eliminación:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

const ESTADOS_COCINA_VALIDOS = ['nueva', 'en_preparacion', 'lista', 'entregada'];

app.put('/api/orders/:id/cocina', verifyToken, requireRole('empleado', 'cocina'), async (req, res) => {
  try {
    const { estadoCocina } = req.body;
    if (!ESTADOS_COCINA_VALIDOS.includes(estadoCocina)) {
      return res.status(400).json({ error: 'estadoCocina inválido' });
    }
    if (req.user.role === 'empleado' && estadoCocina !== 'entregada') {
      return res.status(400).json({ error: 'Un empleado solo puede marcar un pedido como entregada' });
    }

    const orden = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!orden || orden.sucursal !== req.user.sucursal) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { estadoCocina },
      include: { items: true },
    });
    res.json(updated);
  } catch (e) {
    console.error('❌ Error actualizando estado de cocina:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

// ── Caja del mesero — mismo modelo CashShift/CashMovement que ya usa
// Finanzas en el Admin, pero aquí escapado siempre a req.user.sucursal (el
// mesero nunca ve ni toca la caja de la otra sucursal, y no necesita
// entrar como admin solo para esto). Pagos con tarjeta/transferencia no
// entran a "ventas en efectivo" — igual que en el cierre del Admin, ya
// quedan fuera de este cálculo por sí solos (metodoPago: 'efectivo').
async function calcularCajaActual(sucursal) {
  const shift = await prisma.cashShift.findFirst({ where: { sucursal, status: 'open' }, include: { movements: { orderBy: { createdAt: 'desc' } } } });
  if (!shift) return null;
  const cashSales = await prisma.order.aggregate({
    where: { sucursal, estado: 'pagado', metodoPago: 'efectivo', createdAt: { gte: shift.openedAt } },
    _sum: { total: true },
  });
  const payIns = shift.movements.filter((m) => m.type === 'pay_in').reduce((sum, m) => sum + Number(m.amount), 0);
  const payOuts = shift.movements.filter((m) => m.type === 'pay_out').reduce((sum, m) => sum + Number(m.amount), 0);
  const esperado = calculateExpectedCash({ opening: shift.openingAmount, cashSales: cashSales._sum.total || 0, payIns, payOuts });
  return { ...shift, cashSales: cashSales._sum.total || 0, esperado };
}

app.get('/api/caja/actual', verifyToken, requireRole('empleado'), async (req, res) => {
  try {
    res.json(await calcularCajaActual(req.user.sucursal));
  } catch (e) {
    console.error('❌ Error obteniendo caja actual:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/caja/abrir', verifyToken, requireRole('empleado'), async (req, res) => {
  try {
    const openingAmount = Number(req.body.openingAmount);
    if (!(openingAmount >= 0)) return res.status(400).json({ error: 'Fondo inicial inválido' });
    const activo = await prisma.cashShift.findFirst({ where: { sucursal: req.user.sucursal, status: 'open' } });
    if (activo) return res.status(409).json({ error: 'Ya hay una caja abierta en esta sucursal' });
    await prisma.cashShift.create({ data: { sucursal: req.user.sucursal, openingAmount, openedById: req.user.id } });
    res.status(201).json(await calcularCajaActual(req.user.sucursal));
  } catch (e) {
    console.error('❌ Error abriendo caja:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/caja/movimientos', verifyToken, requireRole('empleado'), async (req, res) => {
  try {
    const { type, amount, concept } = req.body;
    if (!['pay_in', 'pay_out'].includes(type) || !(Number(amount) > 0) || !concept?.trim()) {
      return res.status(400).json({ error: 'Tipo, monto y concepto son obligatorios' });
    }
    const shift = await prisma.cashShift.findFirst({ where: { sucursal: req.user.sucursal, status: 'open' } });
    if (!shift) return res.status(404).json({ error: 'No hay una caja abierta en esta sucursal' });
    await prisma.cashMovement.create({ data: { cashShiftId: shift.id, type, amount: Number(amount), concept: concept.trim(), createdById: req.user.id } });
    res.status(201).json(await calcularCajaActual(req.user.sucursal));
  } catch (e) {
    console.error('❌ Error registrando movimiento de caja:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/caja/cerrar', verifyToken, requireRole('empleado'), async (req, res) => {
  try {
    const shift = await prisma.cashShift.findFirst({ where: { sucursal: req.user.sucursal, status: 'open' }, include: { movements: true } });
    if (!shift) return res.status(404).json({ error: 'No hay una caja abierta en esta sucursal' });
    const countedAmount = Number(req.body.countedAmount);
    if (!(countedAmount >= 0)) return res.status(400).json({ error: 'Monto contado inválido' });

    const cashSales = await prisma.order.aggregate({ where: { sucursal: shift.sucursal, estado: 'pagado', metodoPago: 'efectivo', createdAt: { gte: shift.openedAt } }, _sum: { total: true } });
    const payIns = shift.movements.filter((m) => m.type === 'pay_in').reduce((sum, m) => sum + Number(m.amount), 0);
    const payOuts = shift.movements.filter((m) => m.type === 'pay_out').reduce((sum, m) => sum + Number(m.amount), 0);
    const expectedAmount = calculateExpectedCash({ opening: shift.openingAmount, cashSales: cashSales._sum.total || 0, payIns, payOuts });

    const cerrada = await prisma.cashShift.update({
      where: { id: shift.id },
      data: {
        status: 'closed',
        countedAmount,
        expectedAmount,
        difference: countedAmount - expectedAmount,
        closedAt: new Date(),
        closedById: req.user.id,
        notes: req.body.notes || null,
      },
      include: { movements: true },
    });
    res.json(cerrada);
  } catch (e) {
    console.error('❌ Error cerrando caja:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.use('/api/admin', adminRouter);

// ======================================================
// 404 y errores no capturados
// ======================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('❌ Error no capturado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.listen(3001, () => console.log('✅ Servidor local en puerto 3001'));
}

module.exports = app;
