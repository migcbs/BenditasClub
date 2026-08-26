process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const TEST_PREFIX = 'jest-infra';

afterAll(async () => {
  await prisma.user.deleteMany({ where: { OR: [{ email: { contains: TEST_PREFIX } }, { nombre: { contains: TEST_PREFIX } }] } });
  await prisma.$disconnect();
});

describe('GET /api/health', () => {
  it('responds with ok status and confirms the DB connection', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});

describe('Client auth', () => {
  const email = `${TEST_PREFIX}-cliente@benditas.local`;
  const password = 'TestPass123';

  it('registers a new client and returns a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Jest Cliente', email, password });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(email);
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.user.role).toBe('cliente');
  });

  it('rejects a duplicate email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ nombre: 'Jest Cliente Otra Vez', email, password });

    expect(res.status).toBe(409);
  });

  it('logs the client in with correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe(email);
  });

  it('rejects login with the wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrong-password' });

    expect(res.status).toBe(401);
  });
});

describe('Staff PIN auth', () => {
  const nombre = `${TEST_PREFIX}-empleado`;
  const pin = '4321';

  beforeAll(async () => {
    const hashedPin = await bcrypt.hash(pin, 10);
    await prisma.user.create({
      data: { nombre, role: 'empleado', sucursal: 'xico', pin: hashedPin, activo: true },
    });
  });

  it('logs a staff member in with the correct sucursal + PIN', async () => {
    const res = await request(app)
      .post('/api/auth/staff-login')
      .send({ sucursal: 'xico', pin });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.role).toBe('empleado');
    expect(res.body.user.sucursal).toBe('xico');
    expect(res.body.user.pin).toBeUndefined();
  });

  it('rejects a correct PIN at the wrong sucursal', async () => {
    const res = await request(app)
      .post('/api/auth/staff-login')
      .send({ sucursal: 'coatepec', pin });

    expect(res.status).toBe(401);
  });

  it('rejects an incorrect PIN', async () => {
    const res = await request(app)
      .post('/api/auth/staff-login')
      .send({ sucursal: 'xico', pin: '0000' });

    expect(res.status).toBe(401);
  });
});

describe('Products', () => {
  let adminToken, clienteToken, categoryId, productId;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('TestPass123', 10);
    const admin = await prisma.user.create({
      data: { nombre: `${TEST_PREFIX}-admin`, email: `${TEST_PREFIX}-admin@benditas.local`, password: hashedPassword, role: 'admin' },
    });
    adminToken = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const cliente = await prisma.user.create({
      data: { nombre: `${TEST_PREFIX}-cliente2`, email: `${TEST_PREFIX}-cliente2@benditas.local`, password: hashedPassword, role: 'cliente' },
    });
    clienteToken = jwt.sign({ id: cliente.id, role: cliente.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const category = await prisma.category.findFirst({ where: { nombre: 'Snacks' } });
    categoryId = category.id;
  });

  it('lists active products publicly, no auth required', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0]).toHaveProperty('nombre');
    expect(res.body[0]).toHaveProperty('precio');
  });

  it('rejects product creation without a token', async () => {
    const res = await request(app).post('/api/admin/products').send({ nombre: 'X', precio: 10, categoryId });
    expect(res.status).toBe(401);
  });

  it('rejects product creation from a non-admin role', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ nombre: 'X', precio: 10, categoryId });
    expect(res.status).toBe(403);
  });

  it('lets an admin create a product', async () => {
    const res = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `${TEST_PREFIX}-producto`, precio: 77, categoryId });

    expect(res.status).toBe(201);
    expect(res.body.nombre).toBe(`${TEST_PREFIX}-producto`);
    productId = res.body.id;
  });

  it('lets an admin update a product', async () => {
    const res = await request(app)
      .put(`/api/admin/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ precio: 88 });

    expect(res.status).toBe(200);
    expect(res.body.precio).toBe(88);
  });

  it('lets an admin soft-delete a product', async () => {
    const res = await request(app)
      .delete(`/api/admin/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);

    const stillInDb = await prisma.product.findUnique({ where: { id: productId } });
    expect(stillInDb.activo).toBe(false);

    const publicList = await request(app).get('/api/products');
    expect(publicList.body.find((p) => p.id === productId)).toBeUndefined();
  });
});

describe('Admin staff management', () => {
  let adminToken, empleadoToken;

  beforeAll(async () => {
    const hashedPassword = await bcrypt.hash('TestPass123', 10);
    const admin = await prisma.user.create({
      data: { nombre: `${TEST_PREFIX}-admin2`, email: `${TEST_PREFIX}-admin2@benditas.local`, password: hashedPassword, role: 'admin' },
    });
    adminToken = jwt.sign({ id: admin.id, role: admin.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const hashedPin = await bcrypt.hash('1111', 10);
    const empleado = await prisma.user.create({
      data: { nombre: `${TEST_PREFIX}-staff-existente`, role: 'empleado', sucursal: 'coatepec', pin: hashedPin },
    });
    empleadoToken = jwt.sign({ id: empleado.id, role: empleado.role, sucursal: empleado.sucursal }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  it('rejects listing staff from a non-admin role', async () => {
    const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${empleadoToken}`);
    expect(res.status).toBe(403);
  });

  it('lets an admin list staff, optionally filtered by sucursal', async () => {
    const res = await request(app)
      .get('/api/admin/users?sucursal=coatepec')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.every((u) => u.sucursal === 'coatepec')).toBe(true);
    expect(res.body.every((u) => u.pin === undefined)).toBe(true);
  });

  it('lets an admin create a new staff member with a PIN', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `${TEST_PREFIX}-nuevo-cocinero`, role: 'cocina', sucursal: 'xico', pin: '2468' });

    expect(res.status).toBe(201);
    expect(res.body.role).toBe('cocina');
    expect(res.body.pin).toBeUndefined();

    const canLogin = await request(app).post('/api/auth/staff-login').send({ sucursal: 'xico', pin: '2468' });
    expect(canLogin.status).toBe(200);
  });

  it('rejects creating staff with an invalid role', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'X', role: 'admin', sucursal: 'xico', pin: '9999' });

    expect(res.status).toBe(400);
  });

  it('rejects a non-4-digit pin', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'X', role: 'empleado', sucursal: 'xico', pin: '12' });

    expect(res.status).toBe(400);
  });
});
