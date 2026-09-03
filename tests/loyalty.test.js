// End-to-end coverage for the loyalty program: admin-configurable rewards,
// stamp-earning tied to real paid orders, auto-redemption on completing a
// card, and staff-side redemption code verification. Runs against the real
// dev database.
process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = require('../index');

const prisma = new PrismaClient();
const TEST_PREFIX = 'jest-loyalty';

let admin, adminToken, empleado, employeeToken, cliente, clienteToken, producto;

beforeAll(async () => {
  const password = await bcrypt.hash('ClientePass123', 10);
  const pin = await bcrypt.hash('9911', 10);

  admin = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-admin`, email: `${TEST_PREFIX}-admin@benditas.local`, password, role: 'admin' },
  });
  adminToken = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  empleado = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-empleado`, role: 'empleado', sucursal: 'xico', pin },
  });
  employeeToken = jwt.sign({ id: empleado.id, role: 'empleado', sucursal: 'xico' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  cliente = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-cliente`, email: `${TEST_PREFIX}-cliente@benditas.local`, password, role: 'cliente' },
  });
  clienteToken = jwt.sign({ id: cliente.id, role: 'cliente' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  producto = await prisma.product.findFirst({ where: { activo: true, maxSabores: null } });
});

afterAll(async () => {
  const orders = await prisma.order.findMany({ where: { clienteId: cliente.id } });
  await prisma.order.deleteMany({ where: { id: { in: orders.map((o) => o.id) } } });
  await prisma.loyaltyRedemption.deleteMany({ where: { customerId: cliente.id } });
  await prisma.loyaltyCard.deleteMany({ where: { customerId: cliente.id } });
  await prisma.loyaltyReward.deleteMany({ where: { label: { contains: TEST_PREFIX } } });
  await prisma.user.deleteMany({ where: { nombre: { contains: TEST_PREFIX } } });
  await prisma.$disconnect();
});

async function crearYPagarPedido() {
  const created = await request(app)
    .post('/api/customer/orders')
    .set('Authorization', `Bearer ${clienteToken}`)
    .send({ sucursal: 'xico', tipo: 'para_llevar', items: [{ productId: producto.id, cantidad: 1 }] });
  expect(created.status).toBe(201);

  return request(app)
    .put(`/api/orders/${created.body.id}/estado`)
    .set('Authorization', `Bearer ${employeeToken}`)
    .send({ estado: 'pagado', metodoPago: 'efectivo' });
}

describe('Admin loyalty reward configuration', () => {
  let rewardA, rewardB;

  it('rejects a non-admin creating a reward', async () => {
    const res = await request(app).post('/api/admin/loyalty/rewards').set('Authorization', `Bearer ${employeeToken}`).send({ label: 'x', type: 'discount_percent' });
    expect(res.status).toBe(403);
  });

  it('creates a reward, marking it active', async () => {
    const res = await request(app)
      .post('/api/admin/loyalty/rewards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: `${TEST_PREFIX}-20% de descuento`, type: 'discount_percent', value: 20, stampsRequired: 3 });

    expect(res.status).toBe(201);
    expect(res.body.activo).toBe(true);
    rewardA = res.body;
  });

  it('creating a second reward deactivates the first — only one active at a time', async () => {
    const res = await request(app)
      .post('/api/admin/loyalty/rewards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: `${TEST_PREFIX}-envio gratis`, type: 'free_shipping', stampsRequired: 3 });

    expect(res.status).toBe(201);
    expect(res.body.activo).toBe(true);
    rewardB = res.body;

    const list = await request(app).get('/api/admin/loyalty/rewards').set('Authorization', `Bearer ${adminToken}`);
    const a = list.body.find((r) => r.id === rewardA.id);
    expect(a.activo).toBe(false);
  });

  it('rejects free_item without a productId', async () => {
    const res = await request(app)
      .post('/api/admin/loyalty/rewards')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ label: `${TEST_PREFIX}-postre gratis`, type: 'free_item' });
    expect(res.status).toBe(400);
  });

  it('re-activating rewardA via PUT deactivates rewardB', async () => {
    const res = await request(app)
      .put(`/api/admin/loyalty/rewards/${rewardA.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ activo: true });

    expect(res.status).toBe(200);
    expect(res.body.activo).toBe(true);

    const list = await request(app).get('/api/admin/loyalty/rewards').set('Authorization', `Bearer ${adminToken}`);
    const b = list.body.find((r) => r.id === rewardB.id);
    expect(b.activo).toBe(false);
  });
});

describe('Earning stamps and completing a card', () => {
  it('a customer starts with 0 stamps and the active reward visible', async () => {
    const res = await request(app).get('/api/customer/loyalty').set('Authorization', `Bearer ${clienteToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stamps).toBe(0);
    expect(res.body.stampsRequired).toBe(3);
    expect(res.body.activeReward.label).toBe(`${TEST_PREFIX}-20% de descuento`);
  });

  it('each paid order adds exactly one stamp', async () => {
    const first = await crearYPagarPedido();
    expect(first.status).toBe(200);

    const afterFirst = await request(app).get('/api/customer/loyalty').set('Authorization', `Bearer ${clienteToken}`);
    expect(afterFirst.body.stamps).toBe(1);

    const second = await crearYPagarPedido();
    expect(second.status).toBe(200);

    const afterSecond = await request(app).get('/api/customer/loyalty').set('Authorization', `Bearer ${clienteToken}`);
    expect(afterSecond.body.stamps).toBe(2);
  });

  it('the 3rd stamp (this reward\'s threshold) completes the card, creates a redemption, and resets to 0', async () => {
    const third = await crearYPagarPedido();
    expect(third.status).toBe(200);

    const after = await request(app).get('/api/customer/loyalty').set('Authorization', `Bearer ${clienteToken}`);
    expect(after.body.stamps).toBe(0);
    expect(after.body.redemptions).toHaveLength(1);
    expect(after.body.redemptions[0].reward.label).toBe(`${TEST_PREFIX}-20% de descuento`);
    expect(after.body.redemptions[0].redeemed).toBe(false);
    expect(after.body.redemptions[0].code).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}$/);
  });
});

describe('Staff redemption verification', () => {
  let code;

  beforeAll(async () => {
    const res = await request(app).get('/api/customer/loyalty').set('Authorization', `Bearer ${clienteToken}`);
    code = res.body.redemptions[0].code;
  });

  it('rejects an unknown code', async () => {
    const res = await request(app).post('/api/loyalty/redeem').set('Authorization', `Bearer ${employeeToken}`).send({ code: 'ZZZZ-9999' });
    expect(res.status).toBe(404);
  });

  it('redeems a valid code (case-insensitive)', async () => {
    const res = await request(app).post('/api/loyalty/redeem').set('Authorization', `Bearer ${employeeToken}`).send({ code: code.toLowerCase() });
    expect(res.status).toBe(200);
    expect(res.body.redeemed).toBe(true);
    expect(res.body.customer.nombre).toBe(`${TEST_PREFIX}-cliente`);
  });

  it('rejects redeeming the same code twice', async () => {
    const res = await request(app).post('/api/loyalty/redeem').set('Authorization', `Bearer ${employeeToken}`).send({ code });
    expect(res.status).toBe(409);
  });
});
