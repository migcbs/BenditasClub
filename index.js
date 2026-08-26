// index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = require('./lib/prisma');
const { verifyToken, requireRole } = require('./middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;
const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Todo corre en local por ahora: aceptamos cualquier puerto de localhost.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl / tests sin Origin
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    callback(new Error('No permitido por CORS'));
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
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, email, password' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const emailLimpio = email.toLowerCase().trim();
    const existe = await prisma.user.findUnique({ where: { email: emailLimpio } });
    if (existe) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { nombre, email: emailLimpio, password: hashedPassword, role: 'cliente' },
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

app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { activo: true },
      include: { category: { select: { nombre: true, orden: true } } },
      orderBy: [{ category: { orden: 'asc' } }, { nombre: 'asc' }],
    });
    res.json(products);
  } catch (e) {
    console.error('❌ Error listando productos:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/admin/products', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, precio, categoryId, maxSabores, isPromotion } = req.body;
    if (!nombre || precio === undefined || !categoryId) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, precio, categoryId' });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(400).json({ error: 'categoryId no existe' });

    const product = await prisma.product.create({
      data: { nombre, precio, categoryId, maxSabores: maxSabores ?? null, isPromotion: isPromotion ?? false },
    });
    res.status(201).json(product);
  } catch (e) {
    console.error('❌ Error creando producto:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.put('/api/admin/products/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, precio, categoryId, maxSabores, isPromotion, activo } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { nombre, precio, categoryId, maxSabores, isPromotion, activo },
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
