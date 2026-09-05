// server/coupons.js
// Valida un código de cupón contra el catálogo (CouponCode) — usado tanto
// por el endpoint público de validación (el cliente escribe el código
// antes de confirmar) como por la creación real del pedido (donde se
// vuelve a validar y aplicar server-side, nunca se confía en lo que
// calculó el cliente).
const prisma = require('../lib/prisma');

async function validarCupon(codigoCrudo) {
  const codigo = codigoCrudo?.trim().toUpperCase();
  if (!codigo) return { valido: false, error: 'Escribe un código de cupón' };

  const cupon = await prisma.couponCode.findUnique({ where: { codigo } });
  if (!cupon || !cupon.activo) return { valido: false, error: 'Cupón no válido' };
  if (cupon.expiraEn && cupon.expiraEn.getTime() < Date.now()) return { valido: false, error: 'Este cupón ya expiró' };
  if (cupon.usosMaximos != null && cupon.usosActuales >= cupon.usosMaximos) return { valido: false, error: 'Este cupón ya alcanzó su límite de usos' };

  return { valido: true, cupon };
}

function calcularDescuentoCupon(cupon, subtotal) {
  if (cupon.tipo === 'discount_percent') return Math.round(subtotal * (cupon.valor / 100));
  return Math.min(cupon.valor, subtotal);
}

module.exports = { validarCupon, calcularDescuentoCupon };
