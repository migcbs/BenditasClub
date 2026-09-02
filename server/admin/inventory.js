const roundQuantity = (value) => Math.round((Number(value) + Number.EPSILON) * 10000) / 10000;

function calculateRecipeConsumption(orderItems, recipes) {
  const recipeByProduct = new Map(recipes.map((recipe) => [recipe.productId, recipe.items || []]));
  const consumption = new Map();

  for (const orderItem of orderItems) {
    const recipeItems = recipeByProduct.get(orderItem.productId) || [];
    for (const item of recipeItems) {
      const quantity = Number(item.quantity) * Number(orderItem.cantidad || 1);
      consumption.set(item.ingredientId, (consumption.get(item.ingredientId) || 0) + quantity);
    }
  }

  return [...consumption.entries()]
    .map(([ingredientId, quantity]) => ({ ingredientId, quantity: roundQuantity(quantity) }))
    .sort((a, b) => a.ingredientId.localeCompare(b.ingredientId));
}

function calculateExpectedCash({ opening = 0, cashSales = 0, payIns = 0, payOuts = 0 }) {
  return Number(opening) + Number(cashSales) + Number(payIns) - Number(payOuts);
}

function classifyInventoryHealth(current, reorderPoint) {
  if (Number(current) <= Number(reorderPoint) * 0.25) return 'critical';
  if (Number(current) <= Number(reorderPoint)) return 'low';
  return 'healthy';
}

module.exports = { calculateRecipeConsumption, calculateExpectedCash, classifyInventoryHealth };

