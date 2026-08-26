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
