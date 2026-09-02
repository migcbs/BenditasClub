process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = require('../index');

const prisma = new PrismaClient();
const TEST_PREFIX = 'jest-admin-dashboard';

let admin;
let empleadoXico;
let empleadoCoatepec;
let adminToken;
let employeeToken;

beforeAll(async () => {
  const password = await bcrypt.hash('AdminPass123', 10);
  const pin = await bcrypt.hash('1234', 10);

  admin = await prisma.user.create({
    data: {
      nombre: `${TEST_PREFIX}-admin`,
      email: `${TEST_PREFIX}@benditas.local`,
      password,
      role: 'admin',
    },
  });
  empleadoXico = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-xico`, role: 'empleado', sucursal: 'xico', pin },
  });
  empleadoCoatepec = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-coatepec`, role: 'empleado', sucursal: 'coatepec', pin },
  });

  adminToken = jwt.sign({ id: admin.id, email: admin.email, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  employeeToken = jwt.sign({ id: empleadoXico.id, role: 'empleado', sucursal: 'xico' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const product = await prisma.product.findFirst({ where: { activo: true } });
  const now = new Date();
  const createOrder = (empleado, sucursal, total, metodoPago, quantity) => prisma.order.create({
    data: {
      empleadoId: empleado.id,
      sucursal,
      tipo: 'para_llevar',
      estado: 'pagado',
      estadoCocina: 'entregada',
      metodoPago,
      total,
      createdAt: now,
      items: {
        create: {
          productId: product.id,
          nombre: product.nombre,
          precio: total / quantity,
          cantidad: quantity,
          sabores: [],
          subtotal: total,
        },
      },
    },
  });

  await createOrder(empleadoXico, 'xico', 300, 'efectivo', 2);
  await createOrder(empleadoXico, 'xico', 200, 'tarjeta', 1);
  await createOrder(empleadoCoatepec, 'coatepec', 450, 'efectivo', 3);
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { empleado: { nombre: { contains: TEST_PREFIX } } } });
  await prisma.user.deleteMany({ where: { nombre: { contains: TEST_PREFIX } } });
  await prisma.$disconnect();
});

describe('Admin session', () => {
  it('returns the authenticated admin without secrets', async () => {
    const res = await request(app)
      .get('/api/admin/session')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toMatchObject({ id: admin.id, role: 'admin', nombre: admin.nombre });
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.pin).toBeUndefined();
  });

  it('rejects a non-admin account', async () => {
    const res = await request(app)
      .get('/api/admin/session')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  });
});

describe('Admin dashboard', () => {
  it('rejects a non-admin dashboard request', async () => {
    const res = await request(app)
      .get('/api/admin/dashboard')
      .set('Authorization', `Bearer ${employeeToken}`);

    expect(res.status).toBe(403);
  });

  it('returns sales totals scoped to a branch', async () => {
    const from = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const to = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .get(`/api/admin/dashboard?branch=xico&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.filters.branch).toBe('xico');
    expect(res.body.summary).toMatchObject({
      sales: 500,
      orders: 2,
      averageTicket: 250,
      cashSales: 300,
      cardSales: 200,
    });
    expect(res.body.topProducts[0]).toMatchObject({ quantity: 3, sales: 500 });
  });

  it('returns consolidated totals for all branches', async () => {
    const from = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const to = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const res = await request(app)
      .get(`/api/admin/dashboard?branch=all&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.summary).toMatchObject({ sales: 950, orders: 3, cashSales: 750, cardSales: 200 });
    expect(res.body.byBranch).toEqual(expect.arrayContaining([
      expect.objectContaining({ branch: 'xico', sales: 500 }),
      expect.objectContaining({ branch: 'coatepec', sales: 450 }),
    ]));
  });

  it('rejects invalid branch and date filters', async () => {
    const branch = await request(app)
      .get('/api/admin/dashboard?branch=cordoba')
      .set('Authorization', `Bearer ${adminToken}`);
    const dates = await request(app)
      .get('/api/admin/dashboard?from=not-a-date')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(branch.status).toBe(400);
    expect(dates.status).toBe(400);
  });
});
