process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const TEST_PREFIX = 'jest-customer-orders';

let cliente, clienteToken, otherClienteToken, productoAlitas, productoSnack;

beforeAll(async () => {
  await prisma.order.deleteMany({ where: { clienteNombre: { contains: TEST_PREFIX } } });
  await prisma.user.deleteMany({ where: { nombre: { contains: TEST_PREFIX } } });
  const hashedPassword = await bcrypt.hash('TestPass123', 10);
  cliente = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-cliente`, email: `${TEST_PREFIX}@benditas.local`, password: hashedPassword, role: 'cliente', telefono: '2281112222' },
  });
  clienteToken = jwt.sign({ id: cliente.id, email: cliente.email, role: cliente.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  const other = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-otro`, email: `${TEST_PREFIX}-otro@benditas.local`, password: hashedPassword, role: 'cliente' },
  });
  otherClienteToken = jwt.sign({ id: other.id, email: other.email, role: other.role }, process.env.JWT_SECRET, { expiresIn: '1h' });

  productoAlitas = await prisma.product.findFirst({ where: { nombre: '8 Alitas' } });
  productoSnack = await prisma.product.findFirst({ where: { nombre: 'Palomitas' } });
});

afterAll(async () => {
  await prisma.order.deleteMany({ where: { cliente: { nombre: { contains: TEST_PREFIX } } } });
  await prisma.user.deleteMany({ where: { nombre: { contains: TEST_PREFIX } } });
  await prisma.$disconnect();
});

describe('Customer orders', () => {
  it('creates an authenticated customer order and connects it to the profile', async () => {
    const res = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        sucursal: 'xico',
        tipo: 'para_llevar',
        notas: 'Sin cubiertos',
        items: [
          { productId: productoAlitas.id, cantidad: 1, sabores: ['BBQ', 'Búfalo'] },
          { productId: productoSnack.id, cantidad: 2 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.clienteId).toBe(cliente.id);
    expect(res.body.empleadoId).toBeNull();
    expect(res.body.clienteNombre).toBe(cliente.nombre);
    expect(res.body.clienteTelefono).toBe(cliente.telefono);
    expect(res.body.total).toBe(99 + 2 * 39);
  });

  it('lists only the authenticated customer order history', async () => {
    const res = await request(app)
      .get('/api/customer/orders')
      .set('Authorization', `Bearer ${clienteToken}`);

    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body.every((order) => order.clienteId === cliente.id)).toBe(true);

    const other = await request(app)
      .get('/api/customer/orders')
      .set('Authorization', `Bearer ${otherClienteToken}`);

    expect(other.status).toBe(200);
    expect(other.body).toHaveLength(0);
  });
});
