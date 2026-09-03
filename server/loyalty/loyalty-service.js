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

  const card = await tx.loyaltyCard.upsert({
    where: { customerId: order.clienteId },
    create: { customerId: order.clienteId, stamps: 1 },
    update: { stamps: { increment: 1 } },
  });

  const activeReward = await tx.loyaltyReward.findFirst({ where: { activo: true } });
  const stampsRequired = activeReward?.stampsRequired ?? 6;

  if (!activeReward || card.stamps < stampsRequired) {
    return { card, redemption: null };
  }

  const redemption = await tx.loyaltyRedemption.create({
    data: { customerId: order.clienteId, rewardId: activeReward.id, code: generateRedemptionCode() },
    include: { reward: true },
  });
  const resetCard = await tx.loyaltyCard.update({ where: { customerId: order.clienteId }, data: { stamps: 0 } });

  return { card: resetCard, redemption };
}

module.exports = { awardStampForOrder, generateRedemptionCode };
