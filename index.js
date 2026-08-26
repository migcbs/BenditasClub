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
