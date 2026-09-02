const {
  calculateRecipeConsumption,
  calculateExpectedCash,
  classifyInventoryHealth,
} = require('../server/admin/inventory');

describe('recipe inventory consumption', () => {
  it('aggregates ingredient quantities across order items and recipes', () => {
    const orderItems = [
      { productId: 'wings', cantidad: 2 },
      { productId: 'fries', cantidad: 1 },
    ];
    const recipes = [
      { productId: 'wings', items: [{ ingredientId: 'chicken', quantity: 0.5 }, { ingredientId: 'oil', quantity: 0.03 }] },
      { productId: 'fries', items: [{ ingredientId: 'potato', quantity: 0.3 }, { ingredientId: 'oil', quantity: 0.04 }] },
    ];

    expect(calculateRecipeConsumption(orderItems, recipes)).toEqual([
      { ingredientId: 'chicken', quantity: 1 },
      { ingredientId: 'oil', quantity: 0.1 },
      { ingredientId: 'potato', quantity: 0.3 },
    ]);
  });

  it('ignores products without a configured recipe', () => {
    expect(calculateRecipeConsumption([{ productId: 'drink', cantidad: 2 }], [])).toEqual([]);
  });
});

describe('cash and stock controls', () => {
  it('reconciles opening float, cash sales, pay-ins and pay-outs', () => {
    expect(calculateExpectedCash({ opening: 1000, cashSales: 2500, payIns: 200, payOuts: 350 })).toBe(3350);
  });

  it('classifies inventory by reorder and critical thresholds', () => {
    expect(classifyInventoryHealth(1, 5)).toBe('critical');
    expect(classifyInventoryHealth(4, 5)).toBe('low');
    expect(classifyInventoryHealth(7, 5)).toBe('healthy');
  });
});

