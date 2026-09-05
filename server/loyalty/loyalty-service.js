const crypto = require('crypto');

// Genera un código de canje corto y legible en persona (sin caracteres
// ambiguos como 0/O, 1/I).
function generateRedemptionCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += alphabet[crypto.randomInt(alphabet.length)];
    if (i === 3) code += '-';
  }
  return code;
}

// Se llama dentro de la misma transacción que marca un pedido como
// 'pagado'. Si el pedido está ligado a una cuenta de cliente (clienteId),
// suma un sello a su tarjeta. Al llegar al umbral de la recompensa activa,
// genera un canje con esa recompensa y reinicia la tarjeta en 0.
async function awardStampForOrder(tx, order) {
  if (!order.clienteId) return null;

  const activeReward = await tx.loyaltyReward.findFirst({ where: { activo: true } });
  if (!activeReward) return null;

  // Pedidos por debajo del mínimo configurado no cuentan — ni siquiera se
  // toca la tarjeta, para no sumar un sello "a medias".
  if (order.total < activeReward.minOrderAmount) return null;

  const card = await tx.loyaltyCard.upsert({
    where: { customerId: order.clienteId },
    create: { customerId: order.clienteId, stamps: 1 },
    update: { stamps: { increment: 1 } },
  });

  const stampsRequired = activeReward.stampsRequired;

  if (card.stamps < stampsRequired) {
    return { card, redemption: null };
  }

  const redemption = await tx.loyaltyRedemption.create({
    data: { customerId: order.clienteId, rewardId: activeReward.id, code: generateRedemptionCode() },
    include: { reward: true },
  });
  const resetCard = await tx.loyaltyCard.update({ where: { customerId: order.clienteId }, data: { stamps: 0 } });

  return { card: resetCard, redemption };
}

const TASA_PUNTOS = 0.02; // 2% de cada pedido pagado, sin importar recompensas/sellos.

// Independiente de awardStampForOrder — los puntos se acumulan siempre que
// el pedido esté ligado a una cuenta, no dependen de una recompensa activa
// ni de un mínimo de compra.
async function awardPointsForOrder(tx, order) {
  if (!order.clienteId) return null;
  const puntosGanados = Math.round(order.total * TASA_PUNTOS * 100) / 100;
  if (puntosGanados <= 0) return null;
  return tx.loyaltyCard.upsert({
    where: { customerId: order.clienteId },
    create: { customerId: order.clienteId, puntos: puntosGanados },
    update: { puntos: { increment: puntosGanados } },
  });
}

module.exports = { awardStampForOrder, awardPointsForOrder, generateRedemptionCode };
