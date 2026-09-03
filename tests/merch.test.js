// Cobertura end-to-end del catálogo de merch: CRUD de admin (categorías,
// productos, variantes, stock), el catálogo público con estado de stock
// calculado, y el pedido de un cliente autenticado (que descuenta stock real
// y queda visible para el admin). Corre contra la base de datos real.
process.env.NODE_ENV = 'test';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const app = require('../index');

const prisma = new PrismaClient();
const TEST_PREFIX = 'jest-merch';

let admin, adminToken, cliente, clienteToken;

beforeAll(async () => {
  const password = await bcrypt.hash('TestPass123', 10);

  admin = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-admin`, email: `${TEST_PREFIX}-admin@benditas.local`, password, role: 'admin' },
  });
  adminToken = jwt.sign({ id: admin.id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });

  cliente = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-cliente`, email: `${TEST_PREFIX}-cliente@benditas.local`, password, role: 'cliente', telefono: '2280001111' },
  });
  clienteToken = jwt.sign({ id: cliente.id, role: 'cliente' }, process.env.JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  await prisma.merchOrder.deleteMany({ where: { cliente: { nombre: { contains: TEST_PREFIX } } } });
  await prisma.product.deleteMany({ where: { nombre: { contains: TEST_PREFIX } } });
  await prisma.category.deleteMany({ where: { nombre: { contains: TEST_PREFIX } } });
  await prisma.user.deleteMany({ where: { nombre: { contains: TEST_PREFIX } } });
  await prisma.$disconnect();
});

describe('Admin: categorías y productos de merch', () => {
  it('rejects a non-admin creating a category', async () => {
    const res = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ nombre: `${TEST_PREFIX}-categoria` });
    expect(res.status).toBe(403);
  });

  it('lets an admin create a category, then a merch product with a variant', async () => {
    const category = await request(app)
      .post('/api/admin/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `${TEST_PREFIX}-categoria`, orden: 200 });
    expect(category.status).toBe(201);

    const product = await request(app)
      .post('/api/admin/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: `${TEST_PREFIX}-playera`, precio: 199, categoryId: category.body.id, tipo: 'merch', imagenUrl: '/assets/shop/x.jpg' });
    expect(product.status).toBe(201);
    expect(product.body.tipo).toBe('merch');

    const variant = await request(app)
      .post(`/api/admin/products/${product.body.id}/variants`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ nombre: 'Rosa', precio: 199 });
    expect(variant.status).toBe(201);
    expect(variant.body.stocks).toEqual(expect.arrayContaining([
      expect.objectContaining({ sucursal: 'xico', quantity: 0 }),
      expect.objectContaining({ sucursal: 'coatepec', quantity: 0 }),
    ]));
  });

  it('a merch product never leaks into the food-facing /api/products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.some((p) => p.nombre.includes(TEST_PREFIX))).toBe(false);
  });
});

describe('Public shop catalog and customer checkout', () => {
  let category, product, variant;

  beforeAll(async () => {
    category = await prisma.category.create({ data: { nombre: `${TEST_PREFIX}-categoria-shop`, orden: 201 } });
    product = await prisma.product.create({ data: { nombre: `${TEST_PREFIX}-gorra`, precio: 89, categoryId: category.id, tipo: 'merch' } });
    variant = await prisma.productVariant.create({ data: { productId: product.id, nombre: 'Arena', precio: 89 } });
    await prisma.variantStock.createMany({
      data: [
        { variantId: variant.id, sucursal: 'xico', quantity: 3 },
        { variantId: variant.id, sucursal: 'coatepec', quantity: 0 },
      ],
    });
  });

  it('computes stock status per variant on the public catalog', async () => {
    const res = await request(app).get('/api/shop/products');
    expect(res.status).toBe(200);
    const found = res.body.find((p) => p.id === product.id);
    expect(found).toBeTruthy();
    const v = found.variants.find((item) => item.id === variant.id);
    expect(v.totalStock).toBe(3);
    expect(v.estado).toBe('poco');
  });

  it('rejects an unauthenticated checkout attempt', async () => {
    const res = await request(app).post('/api/customer/shop-orders').send({ sucursal: 'xico', tipoEntrega: 'recoger', items: [{ variantId: variant.id, cantidad: 1 }] });
    expect(res.status).toBe(401);
  });

  it('rejects checkout with no direccion for domicilio', async () => {
    const res = await request(app)
      .post('/api/customer/shop-orders')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ sucursal: 'xico', tipoEntrega: 'domicilio', items: [{ variantId: variant.id, cantidad: 1 }] });
    expect(res.status).toBe(400);
  });

  it('rejects checkout when the requested quantity exceeds stock', async () => {
    const res = await request(app)
      .post('/api/customer/shop-orders')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ sucursal: 'xico', tipoEntrega: 'recoger', items: [{ variantId: variant.id, cantidad: 99 }] });
    expect(res.status).toBe(400);
  });

  it('creates the order, decrements stock for the requested sucursal only, and connects it to the customer', async () => {
    const res = await request(app)
      .post('/api/customer/shop-orders')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({ sucursal: 'xico', tipoEntrega: 'recoger', items: [{ variantId: variant.id, cantidad: 2 }] });

    expect(res.status).toBe(201);
    expect(res.body.clienteId).toBe(cliente.id);
    expect(res.body.total).toBe(178);
    expect(res.body.items[0]).toMatchObject({ variantId: variant.id, cantidad: 2, subtotal: 178 });

    const stocks = await prisma.variantStock.findMany({ where: { variantId: variant.id } });
    expect(stocks.find((s) => s.sucursal === 'xico').quantity).toBe(1);
    expect(stocks.find((s) => s.sucursal === 'coatepec').quantity).toBe(0);
  });

  it('shows the order to the admin via GET /api/admin/merch/orders', async () => {
    const res = await request(app).get('/api/admin/merch/orders').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.some((o) => o.clienteId === cliente.id)).toBe(true);
  });
});

describe('Admin: editar variante y stock', () => {
  let category, product, variant;

  beforeAll(async () => {
    category = await prisma.category.create({ data: { nombre: `${TEST_PREFIX}-categoria-edit`, orden: 202 } });
    product = await prisma.product.create({ data: { nombre: `${TEST_PREFIX}-llavero`, precio: 49, categoryId: category.id, tipo: 'merch' } });
    variant = await prisma.productVariant.create({ data: { productId: product.id, nombre: 'Alita', precio: 49 } });
    await prisma.variantStock.createMany({ data: [{ variantId: variant.id, sucursal: 'xico', quantity: 0 }, { variantId: variant.id, sucursal: 'coatepec', quantity: 0 }] });
  });

  it('updates variant fields', async () => {
    const res = await request(app)
      .put(`/api/admin/variants/${variant.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ precio: 59, activo: false });
    expect(res.status).toBe(200);
    expect(res.body.precio).toBe(59);
    expect(res.body.activo).toBe(false);
  });

  it('sets stock for a sucursal', async () => {
    const res = await request(app)
      .put(`/api/admin/variants/${variant.id}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sucursal: 'xico', quantity: 12 });
    expect(res.status).toBe(200);
    expect(res.body.quantity).toBe(12);
  });

  it('rejects a negative stock quantity', async () => {
    const res = await request(app)
      .put(`/api/admin/variants/${variant.id}/stock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ sucursal: 'xico', quantity: -1 });
    expect(res.status).toBe(400);
  });
});
