# Pantalla de cocina en tiempo real (KDS) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an `estadoCocina` lifecycle to `Order` (nueva → en_preparacion → lista → entregada), a role-gated endpoint to move it, and a new `/cocina` board screen with 4-second polling — plus a small addition to the existing `/pos` shift list so the employee can mark an order "entregada".

**Architecture:** Backend extends `index.js`/`prisma/schema.prisma` exactly like phases 1–2. Frontend: the staff-login pieces built for `/pos` (login screen, auth hook, HTTP client) move from `src/pos/` into a shared `src/shared/` module — both `/pos` and the new `/cocina` need identical staff PIN login and the same order endpoints, so this is genuine shared infrastructure, not POS-specific code. `src/pos/` keeps only what's actually POS-specific (product grid, cart, checkout, sabores picker).

**Tech Stack:** Same as phases 1–2 (Express, Prisma, Neon, JWT, plain `fetch`).

## Global Constraints

- `Order.estadoCocina` is independent of `Order.estado` (payment) — a `pendiente`-payment order can and should progress through kitchen states.
- `PUT /api/orders/:id/cocina`: role `cocina` may set any `EstadoCocina` value; role `empleado` may only set `entregada` (400 on any other value from an `empleado`). Both scoped to `req.user.sucursal` (404 on cross-sucursal, matching the existing `PUT /api/orders/:id/estado` pattern).
- The kitchen board never shows `estado: cancelado` orders, and never shows `estadoCocina: entregada` orders — filtered in the frontend against the same `GET /api/orders` list already built in phase 2.
- Polling only — no Pusher/Ably/websockets (decided in the infra-base phase). 4 seconds, matching the spec.
- No frontend component test harness in this repo — frontend tasks are verified manually in the browser (same convention as phases 1–2).
- Tests run against the real local dev database with prefixed test data, cleaned up in `afterAll` (same pattern as `tests/orders.test.js`).

---

## File Structure

**Backend:**
- Modify `prisma/schema.prisma` — add `EstadoCocina` enum and `Order.estadoCocina` field.
- Modify `index.js` — widen `GET /api/orders` to `requireRole('empleado', 'cocina')`; add `PUT /api/orders/:id/cocina`.
- Modify `tests/orders.test.js` — add coverage for the widened role and the new endpoint.

**Frontend — move shared staff infra out of `src/pos/`:**
- Create `src/shared/staffApi.js` — `API_BASE`, `authHeader`, `handle`, `staffLogin`, `getProducts`, `createOrder`, `listOrders`, `updateOrderEstado`, `updateOrderCocina` (this absorbs everything currently in `src/pos/api.js`, plus the new `updateOrderCocina` call).
- Create `src/shared/useStaffAuth.js` — moved verbatim from `src/pos/useStaffAuth.js`, importing `staffLogin` from `./staffApi`.
- Create `src/shared/StaffLogin.jsx` — moved from `src/pos/StaffLogin.jsx`, with an added optional `title` prop (defaults to `"BenditasClub POS"` so `/pos` needs no change; `/cocina` passes `"BenditasClub Cocina"`).
- Delete `src/pos/api.js`, `src/pos/useStaffAuth.js`, `src/pos/StaffLogin.jsx`.
- Modify `src/pos/PosApp.jsx`, `src/pos/ProductGrid.jsx`, `src/pos/CheckoutPanel.jsx`, `src/pos/OrdersList.jsx` — update their imports to the new `src/shared/` paths.

**Frontend — new kitchen screen:**
- Create `src/kitchen/KitchenApp.jsx` — login gate (via `src/shared/`), 3-column board, 4s polling.
- Create `src/kitchen/kitchen.css` — styles.
- Modify `src/App.js` — add the `/cocina` route, extend the "no site chrome" check to cover it too.

**Frontend — small addition to the existing shift list:**
- Modify `src/pos/OrdersList.jsx` — show a "Marcar entregado" button when `orden.estadoCocina === 'lista'`.

---

### Task 1: Refactor — move staff auth/API to `src/shared/`

**Files:**
- Create: `src/shared/staffApi.js`, `src/shared/useStaffAuth.js`, `src/shared/StaffLogin.jsx`
- Delete: `src/pos/api.js`, `src/pos/useStaffAuth.js`, `src/pos/StaffLogin.jsx`
- Modify: `src/pos/PosApp.jsx`, `src/pos/ProductGrid.jsx`, `src/pos/CheckoutPanel.jsx`, `src/pos/OrdersList.jsx`

**Interfaces:**
- Produces: `src/shared/staffApi.js` exports the same names `src/pos/api.js` did (`authHeader`, `staffLogin`, `getProducts`, `createOrder`, `listOrders`, `updateOrderEstado`), plus a new `updateOrderCocina(id, estadoCocina)`. `src/shared/useStaffAuth.js` and `src/shared/StaffLogin.jsx` are drop-in replacements for the old `src/pos/` versions — this task is a pure move/rename plus one new export, no behavior change to `/pos`.

This is a pure refactor task (no new user-facing behavior on `/pos`) — its own "test" is that `/pos` still works exactly as it did at the end of phase 2, verified manually since there's no component test harness.

- [ ] **Step 1: Create `src/shared/staffApi.js`**

```js
// src/shared/staffApi.js
// Helpers HTTP compartidos por las pantallas de staff (/pos y /cocina).
// Habla con el backend de las fases 1-3 (index.js), en local en el puerto 3001.
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

export const updateOrderCocina = (id, estadoCocina) =>
  fetch(`${API_BASE}/api/orders/${id}/cocina`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ estadoCocina }),
  }).then(handle);
```

- [ ] **Step 2: Create `src/shared/useStaffAuth.js`** (identical to the old `src/pos/useStaffAuth.js`, only the import path changes)

```js
// src/shared/useStaffAuth.js
import { useState, useCallback } from 'react';
import { staffLogin } from './staffApi';

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

- [ ] **Step 3: Create `src/shared/StaffLogin.jsx`** (same as `src/pos/StaffLogin.jsx`, plus a `title` prop)

```jsx
// src/shared/StaffLogin.jsx
import React, { useState } from 'react';

const SUCURSALES = [
  { value: 'xico', label: 'Xico' },
  { value: 'coatepec', label: 'Coatepec' },
];

const StaffLogin = ({ onLogin, title = 'BenditasClub POS' }) => {
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
      <h2>{title}</h2>

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

- [ ] **Step 4: Delete the old files**

```bash
git rm src/pos/api.js src/pos/useStaffAuth.js src/pos/StaffLogin.jsx
```

- [ ] **Step 5: Update imports in `src/pos/PosApp.jsx`**

```diff
- import StaffLogin from './StaffLogin';
  import ProductGrid from './ProductGrid';
  import CheckoutPanel from './CheckoutPanel';
  import OrdersList from './OrdersList';
- import { useStaffAuth } from './useStaffAuth';
+ import StaffLogin from '../shared/StaffLogin';
+ import { useStaffAuth } from '../shared/useStaffAuth';
  import { usePosCarrito } from './usePosCarrito';
```

- [ ] **Step 6: Update the import in `src/pos/ProductGrid.jsx`**

```diff
- import { getProducts } from './api';
+ import { getProducts } from '../shared/staffApi';
```

- [ ] **Step 7: Update the import in `src/pos/CheckoutPanel.jsx`**

```diff
- import { createOrder, updateOrderEstado } from './api';
+ import { createOrder, updateOrderEstado } from '../shared/staffApi';
```

- [ ] **Step 8: Update the import in `src/pos/OrdersList.jsx`**

```diff
- import { listOrders, updateOrderEstado } from './api';
+ import { listOrders, updateOrderEstado } from '../shared/staffApi';
```

- [ ] **Step 9: Manual regression check — `/pos` still works exactly as before**

```bash
npm run server
```
In another terminal:
```bash
npm start
```
Open `/pos`, log in with an existing staff PIN, confirm: product grid loads, adding a sabores product still opens the picker, checkout still creates an order, "Pedidos del turno" still lists orders and "Marcar pagado"/"Cancelar" still work. Nothing here should look or behave differently from the end of phase 2.

- [ ] **Step 10: Commit**

```bash
git add src/shared src/pos
git commit -m "refactor: move staff auth/API to src/shared for reuse by the kitchen screen"
```

---

### Task 2: Prisma schema — `EstadoCocina`

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Produces: `Order.estadoCocina` (default `nueva`), used by every later task.

- [ ] **Step 1: Add the enum, right after `MetodoPago`**

```prisma
enum EstadoCocina {
  nueva
  en_preparacion
  lista
  entregada
}
```

- [ ] **Step 2: Add the field to `Order`, right after `estado`**

```diff
    estado          EstadoPedido   @default(pendiente)
+   estadoCocina    EstadoCocina   @default(nueva)
    metodoPago      MetodoPago?
```

- [ ] **Step 3: Run the migration**

```bash
npx prisma migrate dev --name add_estado_cocina
```
Expected: "Your database is now in sync with your schema."

- [ ] **Step 4: Verify with a quick script**

```bash
node -e "const prisma = require('./lib/prisma'); prisma.order.findFirst().then(o => { console.log(o ? o.estadoCocina : 'no orders yet, schema OK'); process.exit(0); });"
```

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add Order.estadoCocina for kitchen prep tracking"
```

---

### Task 3: Widen `GET /api/orders` to the `cocina` role

**Files:**
- Modify: `index.js`
- Modify: `tests/orders.test.js`

**Interfaces:**
- Produces: `GET /api/orders` now accepts `cocina` staff tokens too (still scoped to `req.user.sucursal`), and its response already includes `estadoCocina` once Task 2 lands.

- [ ] **Step 1: Write the failing test**

Add to `tests/orders.test.js`, inside the existing `describe('GET /api/orders', ...)` block (after the other `it(...)` calls, before its closing `});`) — this needs a `cocina` fixture, so add it to that block's own setup. First, extend the outer `beforeAll` (the one that creates `empleadoXico`/`empleadoCoatepec`) to also create a `cocina` user and token:

```diff
  productoAlitas = await prisma.product.findFirst({ where: { nombre: '8 Alitas' } });
  productoSnack = await prisma.product.findFirst({ where: { nombre: 'Palomitas' } });
+
+ cocinaXico = await prisma.user.create({
+   data: { nombre: `${TEST_PREFIX}-cocina-xico`, role: 'cocina', sucursal: 'xico', pin: hashedPin },
+ });
+ tokenCocinaXico = jwt.sign(
+   { id: cocinaXico.id, role: cocinaXico.role, sucursal: cocinaXico.sucursal },
+   process.env.JWT_SECRET,
+   { expiresIn: '1h' }
+ );
```

And declare the two new variables alongside the existing `let empleadoXico, ...` line at the top of the file:

```diff
-let empleadoXico, empleadoCoatepec, tokenXico, tokenCoatepec, productoAlitas, productoSnack;
+let empleadoXico, empleadoCoatepec, tokenXico, tokenCoatepec, productoAlitas, productoSnack;
+let cocinaXico, tokenCocinaXico;
```

Then add the test itself inside `describe('GET /api/orders', ...)`:

```js
  it('also allows the cocina role to list orders for its sucursal', async () => {
    const res = await request(app).get('/api/orders').set('Authorization', `Bearer ${tokenCocinaXico}`);

    expect(res.status).toBe(200);
    expect(res.body.every((o) => o.sucursal === 'xico')).toBe(true);
    expect(res.body[0]).toHaveProperty('estadoCocina');
  });
```

Also update the `afterAll` cleanup's `prisma.user.deleteMany` — it already matches on `nombre: { contains: TEST_PREFIX }`, which covers `cocinaXico` too, so no change needed there.

- [ ] **Step 2: Run tests, confirm the new one fails**

```bash
npm run test:api
```
Expected: FAIL with 403 (`requireRole('empleado')` rejects the `cocina` token).

- [ ] **Step 3: Widen the role check in `index.js`**

```diff
- app.get('/api/orders', verifyToken, requireRole('empleado'), async (req, res) => {
+ app.get('/api/orders', verifyToken, requireRole('empleado', 'cocina'), async (req, res) => {
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm run test:api
```
Expected: PASS — full suite.

- [ ] **Step 5: Commit**

```bash
git add index.js tests/orders.test.js
git commit -m "feat: allow the cocina role to read GET /api/orders"
```

---

### Task 4: `PUT /api/orders/:id/cocina`

**Files:**
- Modify: `index.js`
- Modify: `tests/orders.test.js`

**Interfaces:**
- Produces: `PUT /api/orders/:id/cocina` — body `{ estadoCocina }`. `cocina` role: any valid value. `empleado` role: only `entregada`. Scoped to sucursal (404 cross-sucursal).

- [ ] **Step 1: Write the failing tests**

Add a new `describe` block at the end of `tests/orders.test.js`:

```js
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
      .set('Authorization', `Bearer ${tokenCoatepec}`)
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
```

- [ ] **Step 2: Run tests, confirm they fail**

```bash
npm run test:api
```
Expected: FAIL — 404 on the route (it doesn't exist yet).

- [ ] **Step 3: Implement the route in `index.js`**

Add before the 404 handler:

```js
const ESTADOS_COCINA_VALIDOS = ['nueva', 'en_preparacion', 'lista', 'entregada'];

app.put('/api/orders/:id/cocina', verifyToken, requireRole('empleado', 'cocina'), async (req, res) => {
  try {
    const { estadoCocina } = req.body;
    if (!ESTADOS_COCINA_VALIDOS.includes(estadoCocina)) {
      return res.status(400).json({ error: 'estadoCocina inválido' });
    }
    if (req.user.role === 'empleado' && estadoCocina !== 'entregada') {
      return res.status(400).json({ error: 'Un empleado solo puede marcar un pedido como entregada' });
    }

    const orden = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!orden || orden.sucursal !== req.user.sucursal) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: { estadoCocina },
      include: { items: true },
    });
    res.json(updated);
  } catch (e) {
    console.error('❌ Error actualizando estado de cocina:', e);
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
git commit -m "feat: add PUT /api/orders/:id/cocina with role-based transition rules"
```

---

### Task 5: Frontend — `/cocina` board

**Files:**
- Create: `src/kitchen/KitchenApp.jsx`
- Create: `src/kitchen/kitchen.css`
- Modify: `src/App.js`

**Interfaces:**
- Consumes: `listOrders`, `updateOrderCocina`, `useStaffAuth`, `StaffLogin` from `src/shared/`.
- Produces: a working `/cocina` route.

- [ ] **Step 1: Create `src/kitchen/KitchenApp.jsx`**

```jsx
// src/kitchen/KitchenApp.jsx
import React, { useCallback, useEffect, useState } from 'react';
import StaffLogin from '../shared/StaffLogin';
import { useStaffAuth } from '../shared/useStaffAuth';
import { listOrders, updateOrderCocina } from '../shared/staffApi';
import './kitchen.css';

const COLUMNAS = [
  { estado: 'nueva', titulo: 'Nueva', siguiente: 'en_preparacion', accion: 'Empezar' },
  { estado: 'en_preparacion', titulo: 'En preparación', siguiente: 'lista', accion: 'Marcar lista' },
  { estado: 'lista', titulo: 'Lista', siguiente: null, accion: null },
];

const describirPedido = (orden) => {
  if (orden.tipo === 'mesa') return `Mesa ${orden.mesa || '-'}`;
  if (orden.tipo === 'domicilio') return `Domicilio · ${orden.clienteNombre || 'sin nombre'}`;
  return `Para llevar${orden.clienteNombre ? ` · ${orden.clienteNombre}` : ''}`;
};

const KitchenApp = () => {
  const { user, login, logout } = useStaffAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    if (!user) return;
    listOrders()
      .then((data) => setOrders(data.filter((o) => o.estado !== 'cancelado' && o.estadoCocina !== 'entregada')))
      .catch((e) => setError(e.message));
  }, [user]);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 4000);
    return () => clearInterval(interval);
  }, [cargar]);

  if (!user) {
    return <StaffLogin onLogin={login} title="BenditasClub Cocina" />;
  }

  const avanzar = async (orden, siguiente) => {
    await updateOrderCocina(orden.id, siguiente);
    cargar();
  };

  return (
    <div className="kitchen-app">
      <header className="kitchen-header">
        <span>{user.nombre} · {user.sucursal}</span>
        <button onClick={logout}>Cerrar sesión</button>
      </header>

      {error && <p className="pos-error">{error}</p>}

      <div className="kitchen-board">
        {COLUMNAS.map((col) => (
          <div className="kitchen-column" key={col.estado}>
            <h3>{col.titulo}</h3>
            {orders.filter((o) => o.estadoCocina === col.estado).map((orden) => (
              <div className="kitchen-card" key={orden.id}>
                <strong>{describirPedido(orden)}</strong>
                <ul>
                  {orden.items.map((item) => (
                    <li key={item.id}>
                      {item.cantidad}× {item.nombre}
                      {item.sabores.length > 0 && <div><small>{item.sabores.join(', ')}</small></div>}
                    </li>
                  ))}
                </ul>
                {orden.notas && <p><em>{orden.notas}</em></p>}
                {col.siguiente && (
                  <button onClick={() => avanzar(orden, col.siguiente)}>{col.accion}</button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenApp;
```

- [ ] **Step 2: Create `src/kitchen/kitchen.css`**

```css
.kitchen-app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #111;
  color: #fff;
}
.kitchen-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  background: #000;
}
.kitchen-board {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
  overflow: hidden;
}
.kitchen-column {
  background: #1c1c1c;
  border-radius: 10px;
  padding: 10px;
  overflow-y: auto;
}
.kitchen-column h3 {
  margin-top: 0;
  border-bottom: 1px solid #444;
  padding-bottom: 8px;
}
.kitchen-card {
  background: #2a2a2a;
  border-radius: 8px;
  padding: 10px;
  margin-bottom: 10px;
}
.kitchen-card ul {
  padding-left: 18px;
  margin: 6px 0;
}
.kitchen-card button {
  margin-top: 8px;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: #e0a800;
  cursor: pointer;
  font-weight: bold;
}
```

- [ ] **Step 3: Wire the `/cocina` route in `src/App.js`**

```diff
  import Shop       from './components/Shop';
  import PosApp     from './pos/PosApp';
+ import KitchenApp from './kitchen/KitchenApp';
```

```diff
  const SiteChrome = ({ children }) => {
    const location = useLocation();
-   const esPos = location.pathname.startsWith('/pos');
+   const esPantallaStaff = location.pathname.startsWith('/pos') || location.pathname.startsWith('/cocina');

-   if (esPos) return children;
+   if (esPantallaStaff) return children;
```

```diff
          <Route path="/pos" element={<PosApp />} />
+         <Route path="/cocina" element={<KitchenApp />} />
```

- [ ] **Step 4: Manual verification in the browser**

With `npm run server` and `npm start` running:
1. Open `/pos` in one tab, log in as an employee, take an order (mesa or para llevar).
2. Open `/cocina` in another tab, log in with a `cocina` PIN (create one first via `POST /api/admin/users` with `role: cocina` if none exists). Confirm the order appears in the "Nueva" column within 4 seconds.
3. Click "Empezar" — confirm it moves to "En preparación".
4. Click "Marcar lista" — confirm it moves to "Lista" and stays there (no further button).
5. Confirm a `cancelado` order never appears on the board (mark one cancelado from `/pos` and check it's absent).

- [ ] **Step 5: Commit**

```bash
git add src/kitchen src/App.js
git commit -m "feat: add /cocina kitchen board with 4s polling"
```

---

### Task 6: Frontend — "Marcar entregado" in the `/pos` shift list

**Files:**
- Modify: `src/pos/OrdersList.jsx`

**Interfaces:**
- Consumes: `updateOrderCocina` from `src/shared/staffApi.js` (added in Task 1).

- [ ] **Step 1: Add the import and the button**

```diff
- import { listOrders, updateOrderEstado } from '../shared/staffApi';
+ import { listOrders, updateOrderEstado, updateOrderCocina } from '../shared/staffApi';
```

```diff
+ const marcarEntregado = async (orden) => {
+   await updateOrderCocina(orden.id, 'entregada');
+   cargar();
+ };
+
  const marcar = async (orden, estado) => {
```

```diff
          <div>Total: ${orden.total}</div>
+         {orden.estadoCocina === 'lista' && (
+           <button onClick={() => marcarEntregado(orden)}>Marcar entregado</button>
+         )}
          {orden.estado === 'pendiente' && (
```

- [ ] **Step 2: Manual verification**

In `/pos` → "Pedidos del turno", take an order through the kitchen board to "Lista" (Task 5), then reload the "Pedidos del turno" tab and confirm the "Marcar entregado" button appears; click it and confirm the order disappears from `/cocina`'s board on its next poll.

- [ ] **Step 3: Commit**

```bash
git add src/pos/OrdersList.jsx
git commit -m "feat: let employees mark an order as entregada from the shift list"
```

---

### Task 7: Final full verification

**Files:**
- No new files — full regression pass.

- [ ] **Step 1: Run the full backend suite**

```bash
npm run test:api
```
Expected: PASS — `tests/infra.test.js` and `tests/orders.test.js`, everything from phases 1–3.

- [ ] **Step 2: End-to-end smoke test across both staff screens**

1. `/pos`: take a "mesa" order, leave it pendiente de pago (check "Cobrar al entregar").
2. `/cocina`: confirm it shows up in "Nueva" (even though its payment `estado` is still `pendiente` — kitchen status is independent), advance it to "Lista".
3. `/pos` → "Pedidos del turno": confirm both "Marcar pagado" (payment) and "Marcar entregado" (kitchen) are available and independent of each other; use both.
4. `/cocina`: confirm the order is gone from the board after "entregada".

- [ ] **Step 3: Commit if anything is pending**

```bash
git status
```
