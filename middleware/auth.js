// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Verifica el JWT en el header Authorization: Bearer <token>
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

// Uso: requireRole('admin') o requireRole('empleado', 'cocina')
// Siempre debe ir DESPUÉS de verifyToken.
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}.` });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
