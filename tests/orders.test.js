process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const TEST_PREFIX = 'jest-orders';

let empleadoXico, empleadoCoatepec, tokenXico, tokenCoatepec, productoAlitas, productoSnack;

beforeAll(async () => {
  const hashedPin = await bcrypt.hash('1234', 10);

  empleadoXico = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-empleado-xico`, role: 'empleado', sucursal: 'xico', pin: hashedPin },
  });
  tokenXico = jwt.sign(
    { id: empleadoXico.id, role: empleadoXico.role, sucursal: empleadoXico.sucursal },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  empleadoCoatepec = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-empleado-coatepec`, role: 'empleado', sucursal: 'coatepec', pin: hashedPin },
  });
  tokenCoatepec = jwt.sign(
    { id: empleadoCoatepec.id, role: empleadoCoatepec.role, sucursal: empleadoCoatepec.sucursal },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  productoAlitas = await prisma.product.findFirst({ where: { nombre: '8 Alitas' } });
  productoSnack = await prisma.product.findFirst({ where: { nombre: 'Palomitas' } });
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { empleado: { nombre: { contains: TEST_PREFIX } } } });
  await prisma.user.deleteMany({ where: { nombre: { contains: TEST_PREFIX } } });
  await prisma.$disconnect();
});

describe('POST /api/orders', () => {
  it('rejects an unauthenticated request', async () => {
    const res = await request(app).post('/api/orders').send({ tipo: 'mesa', mesa: '5', items: [] });
    expect(res.status).toBe(401);
  });

  it('creates an order, computing the total on the server (ignores a spoofed total)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({
        tipo: 'mesa',
        mesa: '5',
        total: 999999, // spoofed, must be ignored
        items: [
          { productId: productoAlitas.id, cantidad: 1, sabores: ['BBQ', 'Búfalo'] },
          { productId: productoSnack.id, cantidad: 2 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.sucursal).toBe('xico');
    expect(res.body.empleadoId).toBe(empleadoXico.id);
    expect(res.body.estado).toBe('pendiente');
    expect(res.body.items).toHaveLength(2);
    // 99 (8 Alitas) + 2 * 39 (Palomitas) = 177 — never 999999
    expect(res.body.total).toBe(99 + 2 * 39);
    expect(res.body.items.find((i) => i.productId === productoAlitas.id).sabores).toEqual(['BBQ', 'Búfalo']);
  });

  it('rejects an order with no items', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ tipo: 'mesa', mesa: '5', items: [] });

    expect(res.status).toBe(400);
  });

  it('rejects more sabores than the product allows', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({
        tipo: 'mesa',
        mesa: '5',
        items: [{ productId: productoAlitas.id, cantidad: 1, sabores: ['BBQ', 'Búfalo', 'Habanero'] }],
      });

    expect(res.status).toBe(400);
  });

  it('stamps the order with the sucursal from the token, not from the body', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenCoatepec}`)
      .send({
        tipo: 'para_llevar',
        sucursal: 'xico', // spoofed, must be ignored
        items: [{ productId: productoSnack.id, cantidad: 1 }],
      });

    expect(res.status).toBe(201);
    expect(res.body.sucursal).toBe('coatepec');
  });
});
