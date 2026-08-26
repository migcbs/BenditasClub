# Toma de pedidos (empleado / POS) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `Order`/`OrderItem` data model, staff-only order endpoints, and a new `/pos` screen where a logged-in employee builds a pedido from the real product catalog, closes the sale (tarjeta/efectivo), and sees the shift's order list.

**Architecture:** Backend extends the existing `index.js` monolith with three new routes, all scoped to `req.user.sucursal` from the staff JWT (never a client-supplied sucursal). Frontend adds a self-contained `src/pos/` module (its own auth, hooks, components) wired into `App.js` at `/pos`, independent of the existing customer `Shop`/`PedidoPopup` flow, which is untouched.

**Tech Stack:** Same as phase 1 (Express, Prisma, Neon, JWT) plus plain `fetch` on the frontend (no new HTTP library — matches how the rest of the CRA app already works, it has none).

## Global Constraints

- Every order endpoint uses `verifyToken` + `requireRole('empleado')` and reads `req.user.sucursal` — never trust a sucursal from the request body/query.
- The server always recomputes `precio`/`subtotal`/`total` from the real `Product` rows — never trusts a total sent by the client.
- No Stripe integration in this phase — `metodoPago` is just a record; the physical card terminal already handles the actual charge.
- Sabores stay as a hardcoded list per category on the frontend (same data as `src/components/pedido/services/pedidoServices.js`), stored as plain `String[]` on `OrderItem`. No `Sabor` table.
- This phase only builds the sabor picker for products with `maxSabores > 0` (Alitas, Boneless, Papas per the current seed). Boxes/Burgys/Doggys/Kids are added to the POS cart with no extra configuration — full parity with the customer-facing multi-step configurator (`SelectorSabores.jsx`) is explicitly out of scope; that richness stays exclusive to the existing customer Shop flow.
- The existing customer `Shop`/`PedidoPopup`/WhatsApp flow is not modified in this phase.
- Tests run against the real local dev database, same pattern as phase 1 (`tests/infra.test.js`): prefixed test data, cleaned up in `afterAll`.
- No frontend component test harness exists in this repo (confirmed: `CI=true npm test` finds 0 test files) — frontend tasks are verified manually in the browser, not with automated tests, matching the project's existing convention.

---

## File Structure

**Backend:**
- Modify `prisma/schema.prisma` — add `TipoPedido`, `EstadoPedido`, `MetodoPago` enums and `Order`/`OrderItem` models; add back-relation fields `pedidos Order[]` on `User` and `orderItems OrderItem[]` on `Product`.
- Modify `index.js` — add `POST /api/orders`, `GET /api/orders`, `PUT /api/orders/:id/estado`.
- Create `tests/orders.test.js` — Supertest coverage for the three endpoints above.

**Frontend (`src/pos/`, new, self-contained):**
- Create `src/pos/api.js` — thin `fetch` wrappers for staff-login, products, orders, all attaching the staff JWT.
- Create `src/pos/useStaffAuth.js` — reads/writes `{ token, user }` in `localStorage` (`bc_staff_token`), exposes `login`/`logout`.
- Create `src/pos/StaffLogin.jsx` — sucursal selector + numeric PIN pad.
- Create `src/pos/usePosCarrito.js` — cart state keyed by `productId + sabores`, quantities, computed total.
- Create `src/pos/SaboresPicker.jsx` — chip multi-select capped at a product's `maxSabores`.
- Create `src/pos/ProductGrid.jsx` — category tabs + product cards, sourced from `GET /api/products`.
- Create `src/pos/OrderDetailsForm.jsx` — tipo de pedido (mesa/para_llevar/domicilio) with conditional fields.
- Create `src/pos/CheckoutPanel.jsx` — cart summary, método de pago, submit button.
- Create `src/pos/OrdersList.jsx` — shift's orders for the sucursal, mark pagado/cancelado.
- Create `src/pos/PosApp.jsx` — top-level: shows `StaffLogin` or the order-taking screen depending on `useStaffAuth`.
- Create `src/pos/pos.css` — styles for all of the above.
- Modify `src/App.js` — add the `/pos` route.

---

### Task 1: Prisma schema — Order/OrderItem

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `prisma.order` and `prisma.orderItem` Prisma Client models, used by every later backend task.

- [ ] **Step 1: Add the new enums and models to `prisma/schema.prisma`**

Add after the existing `SucursalNombre` enum:

```prisma
enum TipoPedido {
  mesa
  para_llevar
  domicilio
}

enum EstadoPedido {
  pendiente
  pagado
  cancelado
}

enum MetodoPago {
  tarjeta
  efectivo
}
```

Add `pedidos Order[]` to the `User` model (right after the `activo` field):

```prisma
  activo    Boolean         @default(true)
  pedidos   Order[]
```

Add `orderItems OrderItem[]` to the `Product` model (right after `activo`):

```prisma
  activo      Boolean  @default(true)
  orderItems  OrderItem[]
```

Add the two new models at the end of the file:

```prisma
model Order {
  id              String         @id @default(uuid())
  sucursal        SucursalNombre
  tipo            TipoPedido
  estado          EstadoPedido   @default(pendiente)
  metodoPago      MetodoPago?
  mesa            String?
  clienteNombre   String?
  clienteTelefono String?
  direccion       String?
  notas           String?
  total           Int
  empleadoId      String
  empleado        User           @relation(fields: [empleadoId], references: [id])
  items           OrderItem[]
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}

model OrderItem {
  id        String   @id @default(uuid())
  orderId   String
  order     Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  nombre    String
  precio    Int
  cantidad  Int
  sabores   String[]
  subtotal  Int
}
```

- [ ] **Step 2: Run the migration**

```bash
npx prisma migrate dev --name add_orders
```
Expected: "Your database is now in sync with your schema", Prisma Client regenerated.

- [ ] **Step 3: Verify with a quick script**

```bash
node -e "const prisma = require('./lib/prisma'); prisma.order.count().then(n => { console.log('OK, orders:', n); process.exit(0); });"
```
Expected: `OK, orders: 0`.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add Order/OrderItem schema for employee order-taking"
```

---

### Task 2: `POST /api/orders`

**Files:**
- Modify: `index.js`
- Create: `tests/orders.test.js`

**Interfaces:**
- Consumes: `verifyToken`, `requireRole('empleado')` from `middleware/auth.js`; `prisma.product`, `prisma.order`.
- Produces: `POST /api/orders` returning the created order with its items (`{ id, sucursal, tipo, estado, total, items: [...], ... }`). Later tasks' tests (Task 3, 4) create orders through this same endpoint.

- [ ] **Step 1: Write the failing tests**

```js
// tests/orders.test.js
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
```

- [ ] **Step 2: Run tests, confirm they fail**

```bash
npm run test:api
```
Expected: FAIL — `POST /api/orders` doesn't exist (404s).

- [ ] **Step 3: Implement the route in `index.js`**

Add before the 404 handler:

```js
app.post('/api/orders', verifyToken, requireRole('empleado'), async (req, res) => {
  try {
    const { tipo, mesa, clienteNombre, clienteTelefono, direccion, notas, items } = req.body;

    if (!tipo || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'tipo e items (no vacío) son obligatorios' });
    }

    const productIds = items.map((i) => i.productId);
    const products = await prisma.product.findMany({ where: { id: { in: productIds }, activo: true } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const orderItemsData = [];
    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ error: `Producto no encontrado: ${item.productId}` });
      }
      const cantidad = item.cantidad || 1;
      const sabores = Array.isArray(item.sabores) ? item.sabores : [];
      if (product.maxSabores !== null && sabores.length > product.maxSabores) {
        return res.status(400).json({ error: `${product.nombre} admite máximo ${product.maxSabores} sabores` });
      }
      const subtotal = product.precio * cantidad;
      orderItemsData.push({
        productId: product.id,
        nombre: product.nombre,
        precio: product.precio,
        cantidad,
        sabores,
        subtotal,
      });
    }

    const total = orderItemsData.reduce((acc, i) => acc + i.subtotal, 0);

    const order = await prisma.order.create({
      data: {
        sucursal: req.user.sucursal,
        tipo,
        mesa: mesa || null,
        clienteNombre: clienteNombre || null,
        clienteTelefono: clienteTelefono || null,
        direccion: direccion || null,
        notas: notas || null,
        total,
        empleadoId: req.user.id,
        items: { create: orderItemsData },
      },
      include: { items: true },
    });

    res.status(201).json(order);
  } catch (e) {
    console.error('❌ Error creando pedido:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm run test:api
```
Expected: PASS for `POST /api/orders` and the phase-1 suite (`tests/infra.test.js`) still green.

- [ ] **Step 5: Commit**

```bash
git add index.js tests/orders.test.js
git commit -m "feat: add POST /api/orders with server-side total and sabores validation"
```

---

### Task 3: `GET /api/orders`

**Files:**
- Modify: `index.js`
- Modify: `tests/orders.test.js`

**Interfaces:**
- Produces: `GET /api/orders` (optionally `?estado=`) returning the sucursal-scoped list, newest first, including `items`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/orders.test.js`:

```js
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
});
```

- [ ] **Step 2: Run tests, confirm the new ones fail**

```bash
npm run test:api
```
Expected: FAIL — 404 on `GET /api/orders`.

- [ ] **Step 3: Implement the route**

Add before the 404 handler:

```js
app.get('/api/orders', verifyToken, requireRole('empleado'), async (req, res) => {
  try {
    const { estado } = req.query;
    const orders = await prisma.order.findMany({
      where: {
        sucursal: req.user.sucursal,
        ...(estado ? { estado } : {}),
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(orders);
  } catch (e) {
    console.error('❌ Error listando pedidos:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm run test:api
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add index.js tests/orders.test.js
git commit -m "feat: add GET /api/orders scoped to employee's sucursal"
```

---

### Task 4: `PUT /api/orders/:id/estado`

**Files:**
- Modify: `index.js`
- Modify: `tests/orders.test.js`

**Interfaces:**
- Produces: `PUT /api/orders/:id/estado` — body `{ estado, metodoPago? }`, updates and returns the order. 404s (not 403) when the order belongs to a different sucursal, to avoid leaking existence across sucursales.

- [ ] **Step 1: Write the failing tests**

Append to `tests/orders.test.js`:

```js
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
```

- [ ] **Step 2: Run tests, confirm the new ones fail**

```bash
npm run test:api
```
Expected: FAIL — 404 on the route (it truly doesn't exist yet, distinguish from the intentional-404 test by reading the failure: that one expects 404 and would misleadingly "pass" — the other three fail with 404 when they expect 200).

- [ ] **Step 3: Implement the route**

Add before the 404 handler:

```js
app.put('/api/orders/:id/estado', verifyToken, requireRole('empleado'), async (req, res) => {
  try {
    const { estado, metodoPago } = req.body;
    if (!['pagado', 'cancelado'].includes(estado)) {
      return res.status(400).json({ error: 'estado debe ser pagado o cancelado' });
    }
    if (estado === 'pagado' && !metodoPago) {
      return res.status(400).json({ error: 'metodoPago es obligatorio para marcar como pagado' });
    }

    const orden = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!orden || orden.sucursal !== req.user.sucursal) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { estado, ...(metodoPago ? { metodoPago } : {}) },
      include: { items: true },
    });
    res.json(updated);
  } catch (e) {
    console.error('❌ Error actualizando estado del pedido:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm run test:api
```
Expected: PASS — full suite (`tests/infra.test.js` + `tests/orders.test.js`).

- [ ] **Step 5: Commit**

```bash
git add index.js tests/orders.test.js
git commit -m "feat: add PUT /api/orders/:id/estado to mark pagado/cancelado"
```

---

### Task 5: Frontend — staff auth (login screen)

**Files:**
- Create: `src/pos/api.js`
- Create: `src/pos/useStaffAuth.js`
- Create: `src/pos/StaffLogin.jsx`
- Create: `src/pos/PosApp.jsx`
- Create: `src/pos/pos.css`
- Modify: `src/App.js`

**Interfaces:**
- Produces: `src/pos/api.js` exports `staffLogin(sucursal, pin)`, `authHeader()` (returns `{ Authorization: 'Bearer <token>' }` or `{}`), and a shared `API_BASE` (`http://localhost:3001`, matching the port `index.js` listens on).
- Produces: `useStaffAuth()` returns `{ user, token, login, logout }`, persisted in `localStorage` under key `bc_staff_token`/`bc_staff_user`. Later tasks (6–8) call `login`/`logout`/`token` from this hook.

- [ ] **Step 1: Create `src/pos/api.js`**

```js
// src/pos/api.js
// Helpers HTTP para el POS de empleado. Habla con el backend de la fase 1/2
// (index.js), corriendo en local en el puerto 3001.
const API_BASE = 'http://localhost:3001';

export const authHeader = () => {
  const token = localStorage.getItem('bc_staff_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function handle(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Error de servidor');
  return body;
}

export const staffLogin = (sucursal, pin) =>
  fetch(`${API_BASE}/api/auth/staff-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sucursal, pin }),
  }).then(handle);

export const getProducts = () =>
  fetch(`${API_BASE}/api/products`).then(handle);

export const createOrder = (payload) =>
  fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  }).then(handle);

export const listOrders = (estado) =>
  fetch(`${API_BASE}/api/orders${estado ? `?estado=${estado}` : ''}`, {
    headers: authHeader(),
  }).then(handle);

export const updateOrderEstado = (id, estado, metodoPago) =>
  fetch(`${API_BASE}/api/orders/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ estado, metodoPago }),
  }).then(handle);
```

- [ ] **Step 2: Create `src/pos/useStaffAuth.js`**

```js
// src/pos/useStaffAuth.js
import { useState, useCallback } from 'react';
import { staffLogin } from './api';

const TOKEN_KEY = 'bc_staff_token';
const USER_KEY = 'bc_staff_user';

export const useStaffAuth = () => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  });

  const login = useCallback(async (sucursal, pin) => {
    const { token: newToken, user: newUser } = await staffLogin(sucursal, pin);
    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return { token, user, login, logout };
};
```

- [ ] **Step 3: Create `src/pos/StaffLogin.jsx`**

```jsx
// src/pos/StaffLogin.jsx
import React, { useState } from 'react';

const SUCURSALES = [
  { value: 'xico', label: 'Xico' },
  { value: 'coatepec', label: 'Coatepec' },
];

const StaffLogin = ({ onLogin }) => {
  const [sucursal, setSucursal] = useState('xico');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const presionarDigito = (d) => {
    if (pin.length >= 4) return;
    setPin((prev) => prev + d);
  };

  const borrar = () => setPin((prev) => prev.slice(0, -1));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEnviando(true);
    try {
      await onLogin(sucursal, pin);
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pos-login">
      <h2>BenditasClub POS</h2>

      <label className="pos-login-label">
        Sucursal
        <select value={sucursal} onChange={(e) => setSucursal(e.target.value)}>
          {SUCURSALES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </label>

      <div className="pos-pin-display">{'•'.repeat(pin.length).padEnd(4, '○')}</div>

      <div className="pos-pin-pad">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'borrar', '0', 'ok'].map((key) => {
          if (key === 'borrar') {
            return <button type="button" key={key} onClick={borrar}>⌫</button>;
          }
          if (key === 'ok') {
            return (
              <button
                type="button"
                key={key}
                className="pos-pin-ok"
                onClick={handleSubmit}
                disabled={pin.length !== 4 || enviando}
              >
                Entrar
              </button>
            );
          }
          return (
            <button type="button" key={key} onClick={() => presionarDigito(key)}>
              {key}
            </button>
          );
        })}
      </div>

      {error && <p className="pos-error">{error}</p>}
    </div>
  );
};

export default StaffLogin;
```

- [ ] **Step 4: Create `src/pos/pos.css`**

```css
.pos-login {
  max-width: 360px;
  margin: 60px auto;
  padding: 24px;
  border-radius: 12px;
  background: #1a1a1a;
  color: #fff;
  text-align: center;
}
.pos-login-label {
  display: block;
  margin: 16px 0;
  text-align: left;
}
.pos-login-label select {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
}
.pos-pin-display {
  font-size: 28px;
  letter-spacing: 8px;
  margin: 16px 0;
}
.pos-pin-pad {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.pos-pin-pad button {
  padding: 16px;
  font-size: 18px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
}
.pos-pin-ok {
  background: #e0a800;
  font-weight: bold;
}
.pos-error {
  color: #ff6b6b;
  margin-top: 12px;
}
.pos-app {
  display: flex;
  flex-direction: column;
  height: 100vh;
}
.pos-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #1a1a1a;
  color: #fff;
}
.pos-main {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.pos-categorias {
  display: flex;
  gap: 8px;
  padding: 12px;
  overflow-x: auto;
}
.pos-categorias button {
  padding: 8px 14px;
  border-radius: 20px;
  border: 1px solid #ccc;
  background: #fff;
  cursor: pointer;
  white-space: nowrap;
}
.pos-categorias button.activa {
  background: #1a1a1a;
  color: #fff;
}
.pos-productos-grid {
  flex: 2;
  overflow-y: auto;
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  align-content: start;
}
.pos-producto-card {
  border: 1px solid #ddd;
  border-radius: 10px;
  padding: 10px;
  text-align: left;
  background: #fff;
  cursor: pointer;
}
.pos-carrito {
  flex: 1;
  min-width: 300px;
  border-left: 1px solid #ddd;
  padding: 12px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.pos-carrito-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #eee;
}
.pos-total {
  font-size: 20px;
  font-weight: bold;
  margin: 12px 0;
  display: flex;
  justify-content: space-between;
}
.pos-sabores-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}
.pos-sabores-modal {
  background: #fff;
  padding: 20px;
  border-radius: 12px;
  max-width: 400px;
  width: 90%;
}
.pos-sabores-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 12px 0;
}
.pos-sabor-chip {
  padding: 6px 12px;
  border-radius: 16px;
  border: 1px solid #ccc;
  cursor: pointer;
  background: #fff;
}
.pos-sabor-chip.seleccionado {
  background: #1a1a1a;
  color: #fff;
}
.pos-orders-list {
  padding: 12px;
  overflow-y: auto;
}
.pos-order-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 8px;
}
.pos-tabs {
  display: flex;
  gap: 8px;
  padding: 0 12px;
}
.pos-tabs button {
  padding: 8px 16px;
  border: none;
  border-bottom: 3px solid transparent;
  background: none;
  cursor: pointer;
}
.pos-tabs button.activa {
  border-bottom-color: #e0a800;
  font-weight: bold;
}
```

- [ ] **Step 5: Create a minimal `src/pos/PosApp.jsx`** (extended in later tasks)

```jsx
// src/pos/PosApp.jsx
import React from 'react';
import StaffLogin from './StaffLogin';
import { useStaffAuth } from './useStaffAuth';
import './pos.css';

const PosApp = () => {
  const { user, login, logout } = useStaffAuth();

  if (!user) {
    return <StaffLogin onLogin={login} />;
  }

  return (
    <div className="pos-app">
      <header className="pos-header">
        <span>{user.nombre} · {user.sucursal}</span>
        <button onClick={logout}>Cerrar sesión</button>
      </header>
      <main className="pos-main">
        <p style={{ padding: 20 }}>Catálogo de productos próximamente (Task 6).</p>
      </main>
    </div>
  );
};

export default PosApp;
```

- [ ] **Step 6: Wire the `/pos` route in `src/App.js`**

Add the import near the other component imports:
```js
import PosApp from './pos/PosApp';
```

Add the route inside `<Routes>`, alongside the existing `/shop` route:
```jsx
<Route path="/pos" element={<PosApp />} />
```

- [ ] **Step 7: Manual verification in the browser**

```bash
npm run server
```
In another terminal:
```bash
npm start
```
Open `http://localhost:3000/pos`. Confirm:
- The PIN pad renders, sucursal selector shows Xico/Coatepec.
- Typing a wrong PIN shows the error message from the API and clears the pad.
- Logging in with a real staff PIN (create one first via `POST /api/admin/users` with an admin token, or reuse one from a Task-2-style manual test) shows the header with the employee's name and a "Cerrar sesión" button.
- Reloading the page keeps you logged in (token persisted in `localStorage`).
- "Cerrar sesión" returns you to the PIN pad.

- [ ] **Step 8: Commit**

```bash
git add src/pos src/App.js
git commit -m "feat: add POS staff login screen and route"
```

---

### Task 6: Frontend — product grid, sabores picker, cart

**Files:**
- Create: `src/pos/usePosCarrito.js`
- Create: `src/pos/SaboresPicker.jsx`
- Create: `src/pos/ProductGrid.jsx`
- Modify: `src/pos/PosApp.jsx`

**Interfaces:**
- Consumes: `getProducts()` from `src/pos/api.js`.
- Produces: `usePosCarrito()` returns `{ items, agregarItem, quitarItem, actualizarCantidad, vaciar, total }`, where each cart item is `{ key, productId, nombre, precio, cantidad, sabores, maxSabores }` (`key` is `productId` + sorted `sabores`, so the same product with different sabores stacks separately). Task 7 (`CheckoutPanel`) consumes `items`/`total`/`vaciar` from this hook.

- [ ] **Step 1: Create `src/pos/usePosCarrito.js`**

```js
// src/pos/usePosCarrito.js
import { useState, useMemo, useCallback } from 'react';

const keyFor = (productId, sabores = []) => `${productId}|${[...sabores].sort().join(',')}`;

export const usePosCarrito = () => {
  const [items, setItems] = useState([]);

  const agregarItem = useCallback((producto, sabores = []) => {
    const key = keyFor(producto.id, sabores);
    setItems((prev) => {
      const existente = prev.find((i) => i.key === key);
      if (existente) {
        return prev.map((i) => (i.key === key ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [
        ...prev,
        {
          key,
          productId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          sabores,
        },
      ];
    });
  }, []);

  const quitarItem = useCallback((key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const actualizarCantidad = useCallback((key, cantidad) => {
    if (cantidad <= 0) return quitarItem(key);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, cantidad } : i)));
  }, [quitarItem]);

  const vaciar = useCallback(() => setItems([]), []);

  const total = useMemo(() => items.reduce((acc, i) => acc + i.precio * i.cantidad, 0), [items]);

  return { items, agregarItem, quitarItem, actualizarCantidad, vaciar, total };
};
```

- [ ] **Step 2: Create `src/pos/SaboresPicker.jsx`**

Sabores are the same fixed lists already used by the customer Shop (`SelectorSabores.jsx`), duplicated here in a simpler, single-round form (no multi-round wizard — see Global Constraints).

```jsx
// src/pos/SaboresPicker.jsx
import React, { useState } from 'react';

const SABORES_ALITAS_BONELESS = [
  'Ajo parmesano', 'Pimienta limón', 'Queso parmesano',
  'BBQ', 'Tamarindo', 'Miel & mostaza', 'Teriyaki',
  'Machas', 'Habanero', 'Búfalo', 'Mango habanero',
  'BBQ Habanero', 'Tamarindo habanero', 'Habanero parmesano',
  'Sriracha', 'Diabla', 'Piña chipotle', 'Valentina',
  'Pelón Pelo Rico', 'Takis Blue', "Cheetos Flamin' Hot",
  'Takis Fuego', 'Doritos Cheddar', 'Naturales',
];
const SABORES_PAPAS = ['Naturales', 'Ajo parmesano', 'Pimienta limón', 'Queso parmesano', 'Paprika'];

const saboresPara = (categoria) => (categoria === 'Papas' ? SABORES_PAPAS : SABORES_ALITAS_BONELESS);

const SaboresPicker = ({ producto, categoria, onConfirmar, onCancelar }) => {
  const [elegidos, setElegidos] = useState([]);
  const opciones = saboresPara(categoria);
  const max = producto.maxSabores || 1;

  const toggle = (sabor) => {
    setElegidos((prev) => {
      if (prev.includes(sabor)) return prev.filter((s) => s !== sabor);
      if (prev.length >= max) return prev;
      return [...prev, sabor];
    });
  };

  return (
    <div className="pos-sabores-overlay" onClick={(e) => e.target === e.currentTarget && onCancelar()}>
      <div className="pos-sabores-modal">
        <h3>{producto.nombre}</h3>
        <p>Elige hasta {max} sabor{max !== 1 ? 'es' : ''} ({elegidos.length}/{max})</p>
        <div className="pos-sabores-grid">
          {opciones.map((sabor) => (
            <button
              key={sabor}
              type="button"
              className={`pos-sabor-chip ${elegidos.includes(sabor) ? 'seleccionado' : ''}`}
              onClick={() => toggle(sabor)}
            >
              {sabor}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onCancelar}>Cancelar</button>
          <button type="button" onClick={() => onConfirmar(elegidos)} disabled={elegidos.length === 0}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaboresPicker;
```

- [ ] **Step 3: Create `src/pos/ProductGrid.jsx`**

```jsx
// src/pos/ProductGrid.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { getProducts } from './api';
import SaboresPicker from './SaboresPicker';

const ProductGrid = ({ onAgregar }) => {
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [productoConSabores, setProductoConSabores] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProductos(data);
        if (data.length > 0) setCategoriaActiva(data[0].category.nombre);
      })
      .catch((e) => setError(e.message));
  }, []);

  const categorias = useMemo(
    () => [...new Set(productos.map((p) => p.category.nombre))],
    [productos]
  );

  const productosVisibles = useMemo(
    () => productos.filter((p) => p.category.nombre === categoriaActiva),
    [productos, categoriaActiva]
  );

  const handleClickProducto = (producto) => {
    if (producto.maxSabores) {
      setProductoConSabores(producto);
    } else {
      onAgregar(producto, []);
    }
  };

  return (
    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {error && <p className="pos-error">{error}</p>}
      <div className="pos-categorias">
        {categorias.map((cat) => (
          <button
            key={cat}
            className={categoriaActiva === cat ? 'activa' : ''}
            onClick={() => setCategoriaActiva(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="pos-productos-grid">
        {productosVisibles.map((producto) => (
          <button
            key={producto.id}
            type="button"
            className="pos-producto-card"
            onClick={() => handleClickProducto(producto)}
          >
            <strong>{producto.nombre}</strong>
            <div>${producto.precio}</div>
          </button>
        ))}
      </div>

      {productoConSabores && (
        <SaboresPicker
          producto={productoConSabores}
          categoria={productoConSabores.category.nombre}
          onConfirmar={(sabores) => {
            onAgregar(productoConSabores, sabores);
            setProductoConSabores(null);
          }}
          onCancelar={() => setProductoConSabores(null)}
        />
      )}
    </div>
  );
};

export default ProductGrid;
```

- [ ] **Step 4: Wire `ProductGrid` + cart into `PosApp.jsx`**

Replace the placeholder `<main>` content in `src/pos/PosApp.jsx`:

```jsx
// src/pos/PosApp.jsx
import React from 'react';
import StaffLogin from './StaffLogin';
import ProductGrid from './ProductGrid';
import { useStaffAuth } from './useStaffAuth';
import { usePosCarrito } from './usePosCarrito';
import './pos.css';

const PosApp = () => {
  const { user, login, logout } = useStaffAuth();
  const carrito = usePosCarrito();

  if (!user) {
    return <StaffLogin onLogin={login} />;
  }

  return (
    <div className="pos-app">
      <header className="pos-header">
        <span>{user.nombre} · {user.sucursal}</span>
        <button onClick={logout}>Cerrar sesión</button>
      </header>
      <main className="pos-main">
        <ProductGrid onAgregar={carrito.agregarItem} />
        <div className="pos-carrito">
          <h3>Pedido actual</h3>
          {carrito.items.map((item) => (
            <div className="pos-carrito-item" key={item.key}>
              <span>
                {item.cantidad}× {item.nombre}
                {item.sabores.length > 0 && <div><small>{item.sabores.join(', ')}</small></div>}
              </span>
              <span>
                ${item.precio * item.cantidad}
                <button onClick={() => carrito.actualizarCantidad(item.key, item.cantidad - 1)}>-</button>
                <button onClick={() => carrito.actualizarCantidad(item.key, item.cantidad + 1)}>+</button>
                <button onClick={() => carrito.quitarItem(item.key)}>×</button>
              </span>
            </div>
          ))}
          <div className="pos-total">
            <span>Total</span>
            <span>${carrito.total}</span>
          </div>
          <p style={{ color: '#888' }}>Cerrar venta próximamente (Task 7).</p>
        </div>
      </main>
    </div>
  );
};

export default PosApp;
```

- [ ] **Step 5: Manual verification in the browser**

With `npm run server` and `npm start` both running, log into `/pos` and confirm:
- Category tabs show every category from the seeded menu.
- Clicking a plain product (e.g. "Palomitas") adds it directly to the cart.
- Clicking a product with sabores (e.g. "8 Alitas") opens the sabores picker, caps selection at `maxSabores`, and "Agregar" is disabled until at least one is chosen.
- The cart shows quantity controls and updates the total live.
- Adding the same product+sabores combo twice increments quantity instead of creating a duplicate row; a different sabor combo creates a separate row.

- [ ] **Step 6: Commit**

```bash
git add src/pos
git commit -m "feat: add POS product catalog, sabores picker, and cart"
```

---

### Task 7: Frontend — order details + checkout

**Files:**
- Create: `src/pos/OrderDetailsForm.jsx`
- Create: `src/pos/CheckoutPanel.jsx`
- Modify: `src/pos/PosApp.jsx`

**Interfaces:**
- Consumes: `createOrder` from `src/pos/api.js`; `carrito.items`/`total`/`vaciar` from Task 6.
- Produces: `CheckoutPanel` calls `onOrderCreated(order)` after a successful `POST /api/orders` — Task 8's `OrdersList` refresh is triggered from this callback.

- [ ] **Step 1: Create `src/pos/OrderDetailsForm.jsx`**

```jsx
// src/pos/OrderDetailsForm.jsx
import React from 'react';

const OrderDetailsForm = ({ detalles, setDetalles }) => {
  const set = (campo) => (e) => setDetalles((prev) => ({ ...prev, [campo]: e.target.value }));

  return (
    <div className="pos-order-details">
      <label>
        Tipo de pedido
        <select value={detalles.tipo} onChange={set('tipo')}>
          <option value="mesa">Mesa</option>
          <option value="para_llevar">Para llevar</option>
          <option value="domicilio">Domicilio</option>
        </select>
      </label>

      {detalles.tipo === 'mesa' && (
        <label>
          Número de mesa
          <input value={detalles.mesa} onChange={set('mesa')} />
        </label>
      )}

      {detalles.tipo === 'domicilio' && (
        <>
          <label>
            Nombre del cliente
            <input value={detalles.clienteNombre} onChange={set('clienteNombre')} />
          </label>
          <label>
            Teléfono
            <input value={detalles.clienteTelefono} onChange={set('clienteTelefono')} />
          </label>
          <label>
            Dirección
            <input value={detalles.direccion} onChange={set('direccion')} />
          </label>
        </>
      )}

      {detalles.tipo === 'para_llevar' && (
        <label>
          Nombre del cliente
          <input value={detalles.clienteNombre} onChange={set('clienteNombre')} />
        </label>
      )}

      <label>
        Notas
        <input value={detalles.notas} onChange={set('notas')} />
      </label>
    </div>
  );
};

export default OrderDetailsForm;
```

- [ ] **Step 2: Create `src/pos/CheckoutPanel.jsx`**

```jsx
// src/pos/CheckoutPanel.jsx
import React, { useState } from 'react';
import OrderDetailsForm from './OrderDetailsForm';
import { createOrder, updateOrderEstado } from './api';

const DETALLES_INICIALES = {
  tipo: 'mesa',
  mesa: '',
  clienteNombre: '',
  clienteTelefono: '',
  direccion: '',
  notas: '',
};

const CheckoutPanel = ({ carrito, onOrderCreated }) => {
  const [detalles, setDetalles] = useState(DETALLES_INICIALES);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [dejarPendiente, setDejarPendiente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const handleCerrarVenta = async () => {
    setError('');
    setEnviando(true);
    try {
      const payload = {
        tipo: detalles.tipo,
        mesa: detalles.tipo === 'mesa' ? detalles.mesa : undefined,
        clienteNombre: detalles.clienteNombre || undefined,
        clienteTelefono: detalles.clienteTelefono || undefined,
        direccion: detalles.tipo === 'domicilio' ? detalles.direccion : undefined,
        notas: detalles.notas || undefined,
        items: carrito.items.map((i) => ({
          productId: i.productId,
          cantidad: i.cantidad,
          sabores: i.sabores,
        })),
      };
      const orden = await createOrder(payload);

      if (!dejarPendiente) {
        // Cerrar la venta: la terminal física ya cobró, solo registramos el método.
        await updateOrderEstado(orden.id, 'pagado', metodoPago);
      }

      carrito.vaciar();
      setDetalles(DETALLES_INICIALES);
      onOrderCreated(orden);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pos-checkout">
      <OrderDetailsForm detalles={detalles} setDetalles={setDetalles} />

      <label>
        <input
          type="checkbox"
          checked={dejarPendiente}
          onChange={(e) => setDejarPendiente(e.target.checked)}
        />
        Cobrar al entregar (dejar pendiente)
      </label>

      {!dejarPendiente && (
        <label>
          Método de pago
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta (terminal física)</option>
          </select>
        </label>
      )}

      {error && <p className="pos-error">{error}</p>}

      <button
        className="pos-btn-cerrar-venta"
        onClick={handleCerrarVenta}
        disabled={carrito.items.length === 0 || enviando}
      >
        {dejarPendiente ? 'Guardar pedido pendiente' : 'Cerrar venta'}
      </button>
    </div>
  );
};

export default CheckoutPanel;
```

- [ ] **Step 3: Wire `CheckoutPanel` into `PosApp.jsx`**

Replace the `<p style={{ color: '#888' }}>Cerrar venta próximamente (Task 7).</p>` line in `src/pos/PosApp.jsx` with:

```jsx
<CheckoutPanel carrito={carrito} onOrderCreated={() => {}} />
```

And add the import at the top:
```js
import CheckoutPanel from './CheckoutPanel';
```

(`onOrderCreated` stays a no-op until Task 8 wires it to refresh the orders list.)

- [ ] **Step 4: Manual verification in the browser**

- Build a cart, pick "Mesa" with a table number, leave "Cobrar al entregar" unchecked, choose "Efectivo", click "Cerrar venta". Confirm the cart empties and no error shows.
- Repeat picking "Domicilio", fill name/phone/address, check "Cobrar al entregar", submit. Confirm it succeeds without asking for a método de pago.
- Check the order landed correctly:
  ```bash
  node -e "const prisma = require('./lib/prisma'); prisma.order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' }, take: 2 }).then(o => { console.log(JSON.stringify(o, null, 2)); process.exit(0); });"
  ```

- [ ] **Step 5: Commit**

```bash
git add src/pos
git commit -m "feat: add POS checkout flow (order details + cerrar venta)"
```

---

### Task 8: Frontend — orders list, final wiring

**Files:**
- Create: `src/pos/OrdersList.jsx`
- Modify: `src/pos/PosApp.jsx`

**Interfaces:**
- Consumes: `listOrders`, `updateOrderEstado` from `src/pos/api.js`.
- Produces: a tab switcher in `PosApp` between "Tomar pedido" and "Pedidos del turno"; `OrdersList` exposes a `refreshKey` prop pattern so `CheckoutPanel`'s `onOrderCreated` can force a re-fetch.

- [ ] **Step 1: Create `src/pos/OrdersList.jsx`**

```jsx
// src/pos/OrdersList.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { listOrders, updateOrderEstado } from './api';

const OrdersList = ({ refreshKey }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    listOrders()
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar, refreshKey]);

  const marcar = async (orden, estado) => {
    const metodoPago = estado === 'pagado' ? (orden.metodoPago || 'efectivo') : undefined;
    await updateOrderEstado(orden.id, estado, metodoPago);
    cargar();
  };

  return (
    <div className="pos-orders-list">
      {error && <p className="pos-error">{error}</p>}
      {orders.length === 0 && <p>No hay pedidos todavía en este turno.</p>}
      {orders.map((orden) => (
        <div className="pos-order-card" key={orden.id}>
          <strong>{orden.tipo === 'mesa' ? `Mesa ${orden.mesa}` : orden.tipo}</strong>
          {' · '}
          <span>{orden.estado}</span>
          <div>
            {orden.items.map((item) => (
              <div key={item.id}>
                {item.cantidad}× {item.nombre}
                {item.sabores.length > 0 && ` (${item.sabores.join(', ')})`}
              </div>
            ))}
          </div>
          <div>Total: ${orden.total}</div>
          {orden.estado === 'pendiente' && (
            <div>
              <button onClick={() => marcar(orden, 'pagado')}>Marcar pagado</button>
              <button onClick={() => marcar(orden, 'cancelado')}>Cancelar</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OrdersList;
```

- [ ] **Step 2: Add a tab switcher and wire everything in `PosApp.jsx`**

```jsx
// src/pos/PosApp.jsx
import React, { useState } from 'react';
import StaffLogin from './StaffLogin';
import ProductGrid from './ProductGrid';
import CheckoutPanel from './CheckoutPanel';
import OrdersList from './OrdersList';
import { useStaffAuth } from './useStaffAuth';
import { usePosCarrito } from './usePosCarrito';
import './pos.css';

const PosApp = () => {
  const { user, login, logout } = useStaffAuth();
  const carrito = usePosCarrito();
  const [tab, setTab] = useState('tomar');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) {
    return <StaffLogin onLogin={login} />;
  }

  return (
    <div className="pos-app">
      <header className="pos-header">
        <span>{user.nombre} · {user.sucursal}</span>
        <button onClick={logout}>Cerrar sesión</button>
      </header>

      <nav className="pos-tabs">
        <button className={tab === 'tomar' ? 'activa' : ''} onClick={() => setTab('tomar')}>
          Tomar pedido
        </button>
        <button className={tab === 'lista' ? 'activa' : ''} onClick={() => setTab('lista')}>
          Pedidos del turno
        </button>
      </nav>

      {tab === 'tomar' ? (
        <main className="pos-main">
          <ProductGrid onAgregar={carrito.agregarItem} />
          <div className="pos-carrito">
            <h3>Pedido actual</h3>
            {carrito.items.map((item) => (
              <div className="pos-carrito-item" key={item.key}>
                <span>
                  {item.cantidad}× {item.nombre}
                  {item.sabores.length > 0 && <div><small>{item.sabores.join(', ')}</small></div>}
                </span>
                <span>
                  ${item.precio * item.cantidad}
                  <button onClick={() => carrito.actualizarCantidad(item.key, item.cantidad - 1)}>-</button>
                  <button onClick={() => carrito.actualizarCantidad(item.key, item.cantidad + 1)}>+</button>
                  <button onClick={() => carrito.quitarItem(item.key)}>×</button>
                </span>
              </div>
            ))}
            <div className="pos-total">
              <span>Total</span>
              <span>${carrito.total}</span>
            </div>
            <CheckoutPanel
              carrito={carrito}
              onOrderCreated={() => setRefreshKey((k) => k + 1)}
            />
          </div>
        </main>
      ) : (
        <OrdersList refreshKey={refreshKey} />
      )}
    </div>
  );
};

export default PosApp;
```

- [ ] **Step 3: Full manual smoke test**

With `npm run server` and `npm start` running:
1. Log into `/pos` as an employee.
2. Take an order (a "mesa" order, efectivo, closed immediately). Confirm it disappears from the cart and no error shows.
3. Switch to "Pedidos del turno" — confirm the just-created order appears with estado `pagado`.
4. Take a second order, this time "Cobrar al entregar" checked (stays `pendiente`).
5. In "Pedidos del turno", click "Marcar pagado" on that second order — confirm it updates to `pagado` in place.
6. Log out, log back in as the *other* sucursal's employee (or create one via `POST /api/admin/users` if none exists) — confirm "Pedidos del turno" shows none of the first sucursal's orders.

- [ ] **Step 4: Run the full backend suite one more time**

```bash
npm run test:api
```
Expected: PASS — `tests/infra.test.js` and `tests/orders.test.js`, everything from phases 1 and 2.

- [ ] **Step 5: Commit**

```bash
git add src/pos
git commit -m "feat: add POS shift orders list and wire full order-taking flow"
```
