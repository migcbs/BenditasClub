const { calculateRecipeConsumption } = require('./inventory');

async function applyInventoryForOrder(tx, orderId, userId) {
  const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
  if (!order || order.inventoryAppliedAt) return order;

  const recipes = await tx.recipe.findMany({
    where: { productId: { in: order.items.map((item) => item.productId) } },
    include: { items: true },
  });
  const consumption = calculateRecipeConsumption(order.items, recipes);

  for (const item of consumption) {
    await tx.locationStock.upsert({
      where: { ingredientId_sucursal: { ingredientId: item.ingredientId, sucursal: order.sucursal } },
      create: { ingredientId: item.ingredientId, sucursal: order.sucursal, quantity: -item.quantity },
      update: { quantity: { decrement: item.quantity } },
    });
    await tx.inventoryMovement.create({
      data: {
        ingredientId: item.ingredientId,
        sucursal: order.sucursal,
        type: 'sale',
        quantity: -item.quantity,
        reason: `Consumo del pedido ${order.id.slice(0, 8)}`,
        referenceId: order.id,
        createdById: userId,
      },
    });
  }

  return tx.order.update({ where: { id: order.id }, data: { inventoryAppliedAt: new Date() } });
}

module.exports = { applyInventoryForOrder };

