// End-to-end coverage for server/admin/router.js — every endpoint there was
// previously exercised only manually (via AdminWorkspace's demo mode) with
// zero automated proof it actually reads/writes Postgres correctly. This
// walks the real business chain end to end: crear insumo -> ajustar stock ->
// ver movimiento -> receta -> proveedor -> compra -> recibir compra (verifica
// que el stock e inventario se actualizan de verdad) -> turno de caja ->
// movimiento de caja -> cerrar turno -> gasto. Same pattern as the other
// test files: runs against the real dev database with prefixed test data,
// cleaned up in afterAll.
process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = require('../index');

const prisma = new PrismaClient();
const TEST_PREFIX = 'jest-admin-inv';

let admin, adminToken, empleado, employeeToken, product;

beforeAll(async () => {
  const password = await bcrypt.hash('AdminPass123', 10);
  const pin = await bcrypt.hash('4321', 10);

  admin = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-admin`, email: `${TEST_PREFIX}@benditas.local`, password, role: 'admin' },
  });
  adminToken = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  empleado = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-empleado`, role: 'empleado', sucursal: 'xico', pin },
  });
  employeeToken = jwt.sign({ id: empleado.id, role: 'empleado', sucursal: 'xico' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  product = await prisma.product.findFirst({ where: { activo: true } });
});

afterAll(async () => {
  // Orden que respeta las relaciones sin onDelete: Cascade (ingredient en
  // movimientos/recetas/compras es restrict — hay que borrar esos hijos
  // antes del ingrediente).
  const purchases = await prisma.purchaseOrder.findMany({ where: { createdById: admin.id } });
  await prisma.purchaseOrder.deleteMany({ where: { id: { in: purchases.map((p) => p.id) } } });

  // La receta de prueba se asigna a un producto real del menú (no uno con
  // prefijo de prueba) para ejercitar la relación tal como la usa el admin
  // de verdad — se borra explícitamente por productId, nunca por nombre.
  if (product) await prisma.recipe.deleteMany({ where: { productId: product.id } });

  await prisma.inventoryMovement.deleteMany({ where: { createdById: admin.id } });
  await prisma.ingredient.deleteMany({ where: { nombre: { contains: TEST_PREFIX } } });
  await prisma.supplier.deleteMany({ where: { nombre: { contains: TEST_PREFIX } } });
  await prisma.cashMovement.deleteMany({ where: { createdById: admin.id } });
  await prisma.cashShift.deleteMany({ where: { openedById: admin.id } });
  await prisma.expense.deleteMany({ where: { createdById: admin.id } });
  await prisma.user.deleteMany({ where: { nombre: { contains: TEST_PREFIX } } });
  await prisma.$disconnect();
});

describe('Admin router — auth boundary', () => {
  it('rejects every admin route for a non-admin token', async () => {
    const res = await request(app).get('/api/admin/inventory').set('Authorization', `Bearer ${employeeToken}`);
    expect(res.status).toBe(403);
  });

  it('rejects every admin route with no token', async () => {
    const res = await request(app).get('/api/admin/inventory');
    expect(res.status).toBe(401);
  });
});

describe('Inventory lifecycle', () => {
  let ingredient;

  it('creates an ingredient with initial stock seeded per sucursal', async () => {
    const res = await request(app)
      .post('/api/admin/ingredients')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `${TEST_PREFIX}-pollo`, unit: 'kg', costPerUnit: 45, reorderPoint: 10, initialStock: { xico: 20, coatepec: 5 } });

    expect(res.status).toBe(201);
    expect(res.body.stocks).toHaveLength(2);
    ingredient = res.body;
  });

  it('lists the ingredient in GET /inventory with the real Xico stock and computed health', async () => {
    const res = await request(app)
      .get('/api/admin/inventory?branch=xico')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const found = res.body.find((i) => i.id === ingredient.id);
    expect(found).toBeTruthy();
    expect(Number(found.quantity)).toBe(20);
    expect(found.health).toBe('healthy');
  });

  it('rejects an invalid sucursal', async () => {
    const res = await request(app)
      .get('/api/admin/inventory?branch=monterrey')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });

  it('updates the ingredient', async () => {
    const res = await request(app)
      .put(`/api/admin/ingredients/${ingredient.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `${TEST_PREFIX}-pollo`, unit: 'kg', costPerUnit: 48, reorderPoint: 12 });

    expect(res.status).toBe(200);
    expect(Number(res.body.costPerUnit)).toBe(48);
  });

  it('registers a stock adjustment and actually increments LocationStock in the database', async () => {
    const res = await request(app)
      .post('/api/admin/inventory/adjustments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ingredientId: ingredient.id, sucursal: 'xico', quantity: 5, reason: 'Entrada manual de prueba' });

    expect(res.status).toBe(201);
    expect(Number(res.body.quantity)).toBe(25); // 20 inicial + 5

    const stockInDb = await prisma.locationStock.findUnique({
      where: { ingredientId_sucursal: { ingredientId: ingredient.id, sucursal: 'xico' } },
    });
    expect(Number(stockInDb.quantity)).toBe(25);
  });

  it('records a merma (negative adjustment) correctly', async () => {
    const res = await request(app)
      .post('/api/admin/inventory/adjustments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ingredientId: ingredient.id, sucursal: 'xico', quantity: -3, reason: 'Merma de prueba' });

    expect(res.status).toBe(201);
    expect(Number(res.body.quantity)).toBe(22); // 25 - 3
  });

  it('lists both adjustment movements for the ingredient', async () => {
    const res = await request(app)
      .get(`/api/admin/inventory/movements?ingredientId=${ingredient.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    expect(res.body.every((m) => m.ingredient.nombre === `${TEST_PREFIX}-pollo`)).toBe(true);
  });

  it('rejects an adjustment with a missing reason', async () => {
    const res = await request(app)
      .post('/api/admin/inventory/adjustments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ ingredientId: ingredient.id, sucursal: 'xico', quantity: 1 });
    expect(res.status).toBe(400);
  });

  it('creates and reads a recipe linking a real product to the ingredient', async () => {
    const put = await request(app)
      .put(`/api/admin/recipes/${product.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ yield: 1, items: [{ ingredientId: ingredient.id, quantity: 0.25 }] });

    expect(put.status).toBe(200);
    expect(put.body.items).toHaveLength(1);

    const list = await request(app).get('/api/admin/recipes').set('Authorization', `Bearer ${adminToken}`);
    expect(list.status).toBe(200);
    expect(list.body.some((r) => r.productId === product.id)).toBe(true);
  });

  it('rejects a recipe with a non-positive quantity', async () => {
    const res = await request(app)
      .put(`/api/admin/recipes/${product.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ yield: 1, items: [{ ingredientId: ingredient.id, quantity: 0 }] });
    expect(res.status).toBe(400);
  });
});

describe('Purchasing lifecycle', () => {
  let ingredient, supplier, purchase;

  beforeAll(async () => {
    ingredient = await prisma.ingredient.create({
      data: {
        nombre: `${TEST_PREFIX}-papa`,
        unit: 'kg',
        stocks: { create: [{ sucursal: 'xico', quantity: 0 }, { sucursal: 'coatepec', quantity: 0 }] },
      },
    });
  });

  it('creates a supplier', async () => {
    const res = await request(app)
      .post('/api/admin/suppliers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `${TEST_PREFIX}-proveedor`, contacto: 'Ana', telefono: '2281234567' });

    expect(res.status).toBe(201);
    supplier = res.body;
  });

  it('rejects a supplier with no nombre', async () => {
    const res = await request(app).post('/api/admin/suppliers').set('Authorization', `Bearer ${adminToken}`).send({});
    expect(res.status).toBe(400);
  });

  it('creates a purchase order with a server-computed total', async () => {
    const res = await request(app)
      .post('/api/admin/purchases')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        supplierId: supplier.id,
        sucursal: 'xico',
        items: [{ ingredientId: ingredient.id, quantityOrdered: 50, unitCost: 12 }],
      });

    expect(res.status).toBe(201);
    expect(Number(res.body.total)).toBe(600); // 50 * 12
    expect(res.body.status).toBe('draft');
    purchase = res.body;
  });

  it('receiving the purchase increments real stock and logs a purchase movement', async () => {
    const line = purchase.items[0];
    const res = await request(app)
      .post(`/api/admin/purchases/${purchase.id}/receive`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [{ id: line.id, quantityReceived: 50 }] });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('received');
    expect(Number(res.body.items[0].quantityReceived)).toBe(50);

    const stockInDb = await prisma.locationStock.findUnique({
      where: { ingredientId_sucursal: { ingredientId: ingredient.id, sucursal: 'xico' } },
    });
    expect(Number(stockInDb.quantity)).toBe(50);

    const movement = await prisma.inventoryMovement.findFirst({
      where: { ingredientId: ingredient.id, type: 'purchase', referenceId: purchase.id },
    });
    expect(movement).toBeTruthy();
    expect(Number(movement.quantity)).toBe(50);
  });

  it('404s receiving a purchase that does not exist', async () => {
    const res = await request(app)
      .post('/api/admin/purchases/00000000-0000-0000-0000-000000000000/receive')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ items: [] });
    expect(res.status).toBe(404);
  });

  it('lists the purchase scoped by branch', async () => {
    const res = await request(app).get('/api/admin/purchases?branch=xico').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((p) => p.id === purchase.id)).toBe(true);
  });
});

describe('Cash shift lifecycle', () => {
  let shift;

  it('opens a cash shift', async () => {
    const res = await request(app)
      .post('/api/admin/cash-shifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sucursal: 'coatepec', openingAmount: 1000 });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('open');
    shift = res.body;
  });

  it('rejects opening a second shift for the same sucursal while one is open', async () => {
    const res = await request(app)
      .post('/api/admin/cash-shifts')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sucursal: 'coatepec', openingAmount: 500 });
    expect(res.status).toBe(409);
  });

  it('records a pay-out movement against the shift', async () => {
    const res = await request(app)
      .post(`/api/admin/cash-shifts/${shift.id}/movements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'pay_out', amount: 150, concept: 'Compra de hielo' });

    expect(res.status).toBe(201);
    expect(Number(res.body.amount)).toBe(150);
  });

  it('rejects a movement with an invalid type', async () => {
    const res = await request(app)
      .post(`/api/admin/cash-shifts/${shift.id}/movements`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ type: 'refund', amount: 10, concept: 'x' });
    expect(res.status).toBe(400);
  });

  it('closes the shift and computes expected cash from opening, sales and movements', async () => {
    // No asumimos que no hay otras ventas en efectivo de coatepec desde que
    // se abrió el turno (otros archivos de test corren contra la misma BD
    // de desarrollo) — replicamos el cálculo real del servidor para que la
    // aserción sea correcta sin importar qué más exista en la BD.
    const cashSales = await prisma.order.aggregate({
      where: { sucursal: 'coatepec', estado: 'pagado', metodoPago: 'efectivo', createdAt: { gte: shift.openedAt } },
      _sum: { total: true },
    });
    const expected = Number(shift.openingAmount) + Number(cashSales._sum.total || 0) - 150; // pay_out registrado arriba
    const countedAmount = expected - 5;

    const res = await request(app)
      .post(`/api/admin/cash-shifts/${shift.id}/close`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ countedAmount, notes: 'Cierre de prueba' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('closed');
    expect(Number(res.body.expectedAmount)).toBe(expected);
    expect(Number(res.body.difference)).toBe(-5);
  });
});

describe('Expenses', () => {
  it('creates an expense', async () => {
    const res = await request(app)
      .post('/api/admin/expenses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sucursal: 'xico', category: 'Servicios', concept: 'Gas', amount: 620, paymentMethod: 'efectivo' });

    expect(res.status).toBe(201);
    expect(Number(res.body.amount)).toBe(620);
  });

  it('rejects an expense with an invalid paymentMethod', async () => {
    const res = await request(app)
      .post('/api/admin/expenses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sucursal: 'xico', category: 'Servicios', concept: 'Gas', amount: 620, paymentMethod: 'transferencia' });
    expect(res.status).toBe(400);
  });

  it('lists expenses scoped by branch', async () => {
    const res = await request(app).get('/api/admin/expenses?branch=xico').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
