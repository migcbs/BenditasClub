process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const TEST_PREFIX = 'jest-orders';

let empleadoXico, empleadoCoatepec, tokenXico, tokenCoatepec, productoAlitas, productoSnack;
let cocinaXico, tokenCocinaXico, cocinaCoatepec, tokenCocinaCoatepec;

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

  cocinaXico = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-cocina-xico`, role: 'cocina', sucursal: 'xico', pin: hashedPin },
  });
  tokenCocinaXico = jwt.sign(
    { id: cocinaXico.id, role: cocinaXico.role, sucursal: cocinaXico.sucursal },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  cocinaCoatepec = await prisma.user.create({
    data: { nombre: `${TEST_PREFIX}-cocina-coatepec`, role: 'cocina', sucursal: 'coatepec', pin: hashedPin },
  });
  tokenCocinaCoatepec = jwt.sign(
    { id: cocinaCoatepec.id, role: cocinaCoatepec.role, sucursal: cocinaCoatepec.sucursal },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
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

  it('marks a POS order as already received (no reception queue needed)', async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ tipo: 'mesa', mesa: '3', items: [{ productId: productoSnack.id, cantidad: 1 }] });

    expect(res.status).toBe(201);
    expect(res.body.origen).toBe('pos');
    expect(res.body.recibidoEn).not.toBeNull();
  });
});

describe('GET /api/orders', () => {
  let ordenXico;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ tipo: 'para_llevar', items: [{ productId: productoSnack.id, cantidad: 1 }] });
    ordenXico = res.body;
  });

  it('rejects a non-staff role', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(401);
  });

  it('only returns orders from the requesting employee\'s sucursal', async () => {
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${tokenXico}`);

    expect(res.status).toBe(200);
    expect(res.body.some((o) => o.id === ordenXico.id)).toBe(true);
    expect(res.body.every((o) => o.sucursal === 'xico')).toBe(true);
  });

  it('filters by estado', async () => {
    const res = await request(app).get('/api/orders?estado=pagado').set('Authorization', `Bearer ${tokenXico}`);

    expect(res.status).toBe(200);
    expect(res.body.every((o) => o.estado === 'pagado')).toBe(true);
  });

  it('also allows the cocina role to list orders for its sucursal', async () => {
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${tokenCocinaXico}`);

    expect(res.status).toBe(200);
    expect(res.body.every((o) => o.sucursal === 'xico')).toBe(true);
    expect(res.body[0]).toHaveProperty('estadoCocina');
  });
});

describe('Reception queue for online orders', () => {
  const crearPedidoOnline = async (overrides = {}) => {
    const cliente = await prisma.user.create({
      data: {
        nombre: `${TEST_PREFIX}-cliente-online`,
        email: `${TEST_PREFIX}-${Date.now()}-${Math.random()}@benditas.local`,
        password: await bcrypt.hash('ClientePass123', 10),
        role: 'cliente',
      },
    });
    const clienteToken = jwt.sign({ id: cliente.id, email: cliente.email, role: 'cliente' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const res = await request(app)
      .post('/api/customer/orders')
      .set('Authorization', `Bearer ${clienteToken}`)
      .send({
        sucursal: 'xico',
        tipo: 'para_llevar',
        items: [{ productId: productoSnack.id, cantidad: 1 }],
        ...overrides,
      });
    return { cliente, orden: res.body };
  };

  afterAll(async () => {
    await prisma.order.deleteMany({ where: { cliente: { nombre: { contains: `${TEST_PREFIX}-cliente-online` } } } });
    await prisma.user.deleteMany({ where: { nombre: { contains: `${TEST_PREFIX}-cliente-online` } } });
  });

  it('creates online orders as unreceived, hidden from the normal staff/kitchen feed', async () => {
    const { orden } = await crearPedidoOnline();
    expect(orden.origen).toBe('online');
    expect(orden.recibidoEn).toBeNull();

    const feed = await request(app).get('/api/orders').set('Authorization', `Bearer ${tokenXico}`);
    expect(feed.body.some((o) => o.id === orden.id)).toBe(false);

    const cocinaFeed = await request(app).get('/api/orders').set('Authorization', `Bearer ${tokenCocinaXico}`);
    expect(cocinaFeed.body.some((o) => o.id === orden.id)).toBe(false);
  });

  it('lists pending online orders only with ?pendientes=true, scoped by sucursal', async () => {
    const { orden } = await crearPedidoOnline();
    const pendientes = await request(app).get('/api/orders?pendientes=true').set('Authorization', `Bearer ${tokenXico}`);
    expect(pendientes.body.some((o) => o.id === orden.id)).toBe(true);

    const otraSucursal = await request(app).get('/api/orders?pendientes=true').set('Authorization', `Bearer ${tokenCoatepec}`);
    expect(otraSucursal.body.some((o) => o.id === orden.id)).toBe(false);
  });

  it('accepting a pending order marks it received and makes it visible to staff/kitchen', async () => {
    const { orden } = await crearPedidoOnline();
    const res = await request(app)
      .put(`/api/orders/${orden.id}/recepcion`)
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ aceptar: true });

    expect(res.status).toBe(200);
    expect(res.body.recibidoEn).not.toBeNull();
    expect(res.body.estado).toBe('pendiente');

    const feed = await request(app).get('/api/orders').set('Authorization', `Bearer ${tokenXico}`);
    expect(feed.body.some((o) => o.id === orden.id)).toBe(true);
  });

  it('rejects a rejection with no motivo', async () => {
    const { orden } = await crearPedidoOnline();
    const res = await request(app)
      .put(`/api/orders/${orden.id}/recepcion`)
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ aceptar: false });

    expect(res.status).toBe(400);
  });

  it('rejecting a pending order cancels it, marks it processed, and stores the motivo', async () => {
    const { orden } = await crearPedidoOnline();
    const res = await request(app)
      .put(`/api/orders/${orden.id}/recepcion`)
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ aceptar: false, motivo: 'Ya no tenemos ese producto disponible' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('cancelado');
    expect(res.body.recibidoEn).not.toBeNull();
    expect(res.body.motivoRechazo).toBe('Ya no tenemos ese producto disponible');
  });

  it('rejects processing the same order twice', async () => {
    const { orden } = await crearPedidoOnline();
    await request(app).put(`/api/orders/${orden.id}/recepcion`).set('Authorization', `Bearer ${tokenXico}`).send({ aceptar: true });
    const res = await request(app).put(`/api/orders/${orden.id}/recepcion`).set('Authorization', `Bearer ${tokenXico}`).send({ aceptar: true });

    expect(res.status).toBe(400);
  });

  it('404s when accepting an order from another sucursal', async () => {
    const { orden } = await crearPedidoOnline();
    const res = await request(app)
      .put(`/api/orders/${orden.id}/recepcion`)
      .set('Authorization', `Bearer ${tokenCoatepec}`)
      .send({ aceptar: true });

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/orders/:id/estado', () => {
  let orden;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ tipo: 'mesa', mesa: '9', items: [{ productId: productoSnack.id, cantidad: 1 }] });
    orden = res.body;
  });

  it('marks an order as pagado when metodoPago is provided', async () => {
    const res = await request(app)
      .put(`/api/orders/${orden.id}/estado`)
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ estado: 'pagado', metodoPago: 'efectivo' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('pagado');
    expect(res.body.metodoPago).toBe('efectivo');
  });

  it('rejects marking pagado without metodoPago', async () => {
    const res = await request(app)
      .put(`/api/orders/${orden.id}/estado`)
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ estado: 'pagado' });

    expect(res.status).toBe(400);
  });

  it('marks an order as cancelado', async () => {
    const res = await request(app)
      .put(`/api/orders/${orden.id}/estado`)
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ estado: 'cancelado' });

    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('cancelado');
  });

  it('404s when the order belongs to another sucursal', async () => {
    const res = await request(app)
      .put(`/api/orders/${orden.id}/estado`)
      .set('Authorization', `Bearer ${tokenCoatepec}`)
      .send({ estado: 'cancelado' });

    expect(res.status).toBe(404);
  });
});

describe('PUT /api/orders/:id/cocina', () => {
  let orden;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ tipo: 'para_llevar', items: [{ productId: productoSnack.id, cantidad: 1 }] });
    orden = res.body;
  });

  it('lets cocina advance through nueva -> en_preparacion -> lista -> entregada', async () => {
    for (const estadoCocina of ['en_preparacion', 'lista', 'entregada']) {
      const res = await request(app)
        .put(`/api/orders/${orden.id}/cocina`)
        .set('Authorization', `Bearer ${tokenCocinaXico}`)
        .send({ estadoCocina });

      expect(res.status).toBe(200);
      expect(res.body.estadoCocina).toBe(estadoCocina);
    }
  });

  it('rejects an empleado setting anything other than entregada', async () => {
    const res = await request(app)
      .put(`/api/orders/${orden.id}/cocina`)
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ estadoCocina: 'en_preparacion' });

    expect(res.status).toBe(400);
  });

  it('lets an empleado mark entregada', async () => {
    const res = await request(app)
      .put(`/api/orders/${orden.id}/cocina`)
      .set('Authorization', `Bearer ${tokenXico}`)
      .send({ estadoCocina: 'entregada' });

    expect(res.status).toBe(200);
    expect(res.body.estadoCocina).toBe('entregada');
  });

  it('404s when the order belongs to another sucursal', async () => {
    const res = await request(app)
      .put(`/api/orders/${orden.id}/cocina`)
      .set('Authorization', `Bearer ${tokenCocinaCoatepec}`)
      .send({ estadoCocina: 'en_preparacion' });

    expect(res.status).toBe(404);
  });

  it('rejects an invalid estadoCocina value', async () => {
    const res = await request(app)
      .put(`/api/orders/${orden.id}/cocina`)
      .set('Authorization', `Bearer ${tokenCocinaXico}`)
      .send({ estadoCocina: 'volando' });

    expect(res.status).toBe(400);
  });
});
