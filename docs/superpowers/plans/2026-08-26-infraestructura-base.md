# Infraestructura base — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a backend (Express + Prisma + Neon Postgres) to BenditasClub with roles (cliente/empleado/cocina/admin), JWT auth for clients, PIN auth for staff, and the menu migrated from a hardcoded JS file into the database.

**Architecture:** Single Express app (`index.js`) mounted alongside the existing CRA frontend, following the exact pattern already proven in the sibling project BOOZ (`/Volumes/m/m/Work/Development | Personal/BOOZ/BOOZ/BOOZ`): Prisma Client as a `global` singleton (serverless-safe), JWT issued on login and verified via middleware, `helmet` + `cors` + `express-rate-limit` on auth routes. No frontend routes/components change in this phase.

**Tech Stack:** Express 5, Prisma 6 + `@prisma/client`, Postgres (Neon), `jsonwebtoken`, `bcryptjs`, `dotenv`, `cors`, `helmet`, `express-rate-limit`, `nodemon` (dev), `jest` + `supertest` (dev, backend tests only — separate config from CRA's `react-scripts test`).

## Global Constraints

- No push to GitHub, no deploy to Vercel — everything runs locally against a real Neon database (per spec: `docs/superpowers/specs/2026-08-26-infraestructura-base-design.md`).
- Env var names: `DATABASE_URL` (Postgres connection string) and `JWT_SECRET`. Never commit `.env`.
- Prices are whole integers (pesos, not cents) — matches the existing `productosMenu` data.
- Staff (`empleado`, `cocina`) are scoped to one `sucursal` (`xico` or `coatepec`); `admin` has no fixed sucursal (access to both). `cliente` has no sucursal.
- Staff auth uses a 4-digit PIN (hashed with bcrypt), not email/password. Client auth uses email/password (bcrypt) + JWT, same as BOOZ.
- Tests run against the real local dev database (same one `npm run server` uses), creating and cleaning up their own prefixed test data — same pattern as BOOZ's `tests/critical-flows.test.js`. No mocking Prisma.
- Follow the existing code's language convention: comments and user-facing error messages in Spanish.

---

## File Structure

- Modify `package.json` — add backend dependencies/devDependencies and scripts (`server`, `db:seed`, `postinstall`, `test:api`).
- Modify `.gitignore` — add `.env` (currently only `.env.local` variants are ignored; `.env` itself is NOT ignored, which would leak secrets).
- Create `.env.example` — documents the two required env vars, no real secrets.
- Create `prisma/schema.prisma` — `Role`, `SucursalNombre` enums; `User`, `Category`, `Product` models.
- Create `lib/prisma.js` — Prisma Client singleton (`global.prisma` pattern).
- Create `prisma/seed.js` — one-time seed of `Category`/`Product` from the current menu (snapshot of `src/components/pedido/services/pedidoServices.js`'s `productosMenu`, since that's the file every component actually imports — `productoServices.js` is dead code, unused, left untouched).
- Create `middleware/auth.js` — `verifyToken`, `requireRole(...roles)`.
- Create `index.js` — Express app: health check, client auth, staff PIN auth, products (public GET + admin CRUD), admin users (list/create staff), 404 + error handlers.
- Create `jest.config.api.js` — separate Jest config for backend tests (doesn't collide with CRA's `react-scripts test`).
- Create `tests/infra.test.js` — Supertest coverage for every endpoint above.

---

### Task 1: Dependencies, env config, and Prisma schema

**Files:**
- Modify: `package.json`
- Modify: `.gitignore`
- Create: `.env.example`
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.js`

**Interfaces:**
- Produces: `module.exports` of `lib/prisma.js` is a ready-to-use `PrismaClient` instance, imported as `const prisma = require('../lib/prisma');` by every later task.

- [ ] **Step 1: Fix `.gitignore` to actually ignore `.env`**

Edit `.gitignore`, in the misc section, change:
```
.env.local
.env.development.local
.env.test.local
.env.production.local
```
to:
```
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

- [ ] **Step 2: Create `.env.example`**

```bash
# Postgres (Neon) connection string. Get it from your Neon project dashboard.
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"

# Any long random string, used to sign JWTs. Generate one with:
#   node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
JWT_SECRET="replace-with-a-long-random-string"
```

- [ ] **Step 3: Add backend dependencies to `package.json`**

Add to `"dependencies"` (alphabetized with the existing ones):
```json
    "@prisma/client": "^6.19.0",
    "bcryptjs": "^3.0.3",
    "cors": "^2.8.5",
    "dotenv": "^17.3.1",
    "express": "^5.2.1",
    "express-rate-limit": "^8.6.2",
    "helmet": "^8.3.0",
    "jsonwebtoken": "^9.0.3",
```

Add a new `"devDependencies"` block (after `"dependencies"`, before `"scripts"`):
```json
  "devDependencies": {
    "jest": "^30.4.2",
    "nodemon": "^3.1.14",
    "prisma": "^6.19.0",
    "supertest": "^7.2.2"
  },
```

Add to `"scripts"`:
```json
    "server": "nodemon index.js",
    "postinstall": "prisma generate",
    "db:seed": "node prisma/seed.js",
    "test:api": "jest --config jest.config.api.js --runInBand"
```

- [ ] **Step 4: Install dependencies**

Run:
```bash
npm install
```
Expected: `node_modules` gets the new packages, `package-lock.json` updates, no errors.

- [ ] **Step 5: Create `prisma/schema.prisma`**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  cliente
  empleado
  cocina
  admin
}

enum SucursalNombre {
  xico
  coatepec
}

model User {
  id        String          @id @default(uuid())
  role      Role            @default(cliente)

  // clientes
  email     String?         @unique
  password  String?
  telefono  String?

  // staff (empleado/cocina)
  pin       String?
  sucursal  SucursalNombre?

  nombre    String
  activo    Boolean         @default(true)
  createdAt DateTime        @default(now())
  updatedAt DateTime        @updatedAt
}

model Category {
  id       String    @id @default(uuid())
  nombre   String    @unique
  orden    Int       @default(0)
  products Product[]
}

model Product {
  id          String   @id @default(uuid())
  nombre      String
  precio      Int
  categoryId  String
  category    Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  maxSabores  Int?
  isPromotion Boolean  @default(false)
  activo      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

- [ ] **Step 6: Create the Neon database and run the first migration**

If you don't have a Neon project yet: go to https://console.neon.tech, create a free project (any region close to Mexico, e.g. `us-east` or `aws-us-east-1`), and copy the pooled connection string it gives you into your local `.env` as `DATABASE_URL`. Also add a `JWT_SECRET` (generate one with the command in `.env.example`).

Run:
```bash
npx prisma migrate dev --name init
```
Expected: creates `prisma/migrations/`, applies the migration to Neon, prints "Your database is now in sync with your schema", and generates the Prisma Client.

- [ ] **Step 7: Create `lib/prisma.js`**

```js
// lib/prisma.js
// Cliente Prisma como singleton global — evita agotar el pool de conexiones
// en cold starts serverless. Mismo patrón que el proyecto hermano BOOZ.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

if (!global.prisma) {
  global.prisma = new PrismaClient();
}

module.exports = global.prisma;
```

- [ ] **Step 8: Verify the client works**

Run:
```bash
node -e "const prisma = require('./lib/prisma'); prisma.user.count().then(n => { console.log('OK, users:', n); process.exit(0); });"
```
Expected: prints `OK, users: 0` (empty database so far), no errors.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json .gitignore .env.example prisma/schema.prisma prisma/migrations lib/prisma.js
git commit -m "feat: add Prisma + Neon setup with User/Category/Product schema"
```

---

### Task 2: Seed script — migrate the hardcoded menu into the database

**Files:**
- Create: `prisma/seed.js`

**Interfaces:**
- Consumes: `lib/prisma.js` (default export is a `PrismaClient` instance).
- Produces: populated `Category` and `Product` rows in the database — later tasks' tests rely on there being real products to query (e.g. "Alitas" category exists with an "8 Alitas" product at 99 pesos).

- [ ] **Step 1: Create `prisma/seed.js`**

This is a snapshot of the menu currently in `src/components/pedido/services/pedidoServices.js` (`productosMenu`), trimmed to the fields the `Product` model actually stores (`nombre`, `precio`, `maxSabores`, `isPromotion`). Fields not modeled yet (`sabores`, `opciones`, `descripcion`, `nota`) are intentionally left out of this phase — they belong to the order-taking phase's design, per the infra spec.

```js
// prisma/seed.js
// Carga inicial de Category + Product a partir del menú actual (snapshot de
// src/components/pedido/services/pedidoServices.js). Es una migración de
// datos de una sola vez: a partir de ahora el menú se edita vía el CRUD de
// /api/admin/products, no editando este archivo.
const prisma = require('../lib/prisma');

const MENU = [
  {
    categoria: 'Snacks',
    items: [
      { nombre: 'Palomitas', precio: 39 },
      { nombre: 'Salchipulpos', precio: 49 },
      { nombre: 'Nachos', precio: 49 },
      { nombre: 'Salchipapas', precio: 69 },
      { nombre: 'Happy Nachos', precio: 65 },
      { nombre: 'Happy Papas', precio: 69 },
      { nombre: 'Nuggets', precio: 65 },
      { nombre: 'Dedos de Queso', precio: 65 },
      { nombre: 'Aros de Cebolla', precio: 65 },
      { nombre: 'Galleta', precio: 19 },
    ],
  },
  {
    categoria: 'Papas',
    items: [
      { nombre: 'Papas a la Francesa 225g', precio: 59, maxSabores: 1 },
      { nombre: 'Papas a la Francesa 450g', precio: 89, maxSabores: 1 },
      { nombre: 'Papas en Gajos 225g', precio: 65, maxSabores: 1 },
      { nombre: 'Papas en Gajos 450g', precio: 95, maxSabores: 1 },
    ],
  },
  {
    categoria: 'Alitas',
    items: [
      { nombre: '8 Alitas', precio: 99, maxSabores: 2 },
      { nombre: '16 Alitas', precio: 189, maxSabores: 2 },
      { nombre: '24 Alitas', precio: 279, maxSabores: 3 },
      { nombre: '50 Alitas', precio: 499, maxSabores: 5 },
      { nombre: 'Alita (pieza)', precio: 13, maxSabores: 1 },
    ],
  },
  {
    categoria: 'Boneless',
    items: [
      { nombre: 'Boneless 250g', precio: 139, maxSabores: 2 },
      { nombre: 'Boneless 500g', precio: 259, maxSabores: 2 },
      { nombre: 'Boneless 1kg', precio: 499, maxSabores: 4 },
    ],
  },
  {
    categoria: 'Papas + Boneless',
    items: [
      { nombre: 'Papas + Boneless', precio: 139, isPromotion: true },
    ],
  },
  {
    categoria: 'Boxes',
    items: [
      { nombre: 'Box #1', precio: 189 },
      { nombre: 'Box #2', precio: 389 },
      { nombre: 'Box #3', precio: 649 },
      { nombre: 'Bendito Box', precio: 599 },
      { nombre: 'Burgy / Doggy Box', precio: 399 },
      { nombre: 'Box Club', precio: 299 },
    ],
  },
  {
    categoria: 'Burgys',
    items: [
      { nombre: 'Burgy Res', precio: 129 },
      { nombre: 'Burgy Pollo', precio: 129 },
      { nombre: 'Burgy West', precio: 129 },
      { nombre: 'Burgy Wacamole', precio: 129 },
      { nombre: 'Burgy Cheesy', precio: 129 },
      { nombre: 'Bonely', precio: 129 },
      { nombre: 'Burgy Mexa', precio: 179 },
      { nombre: 'Burgy Tropical', precio: 179, isPromotion: true },
      { nombre: 'Burgy Res Supreme', precio: 179 },
      { nombre: 'Burgy Pollo Supreme', precio: 179 },
      { nombre: 'Burgy West Supreme', precio: 179 },
    ],
  },
  {
    categoria: 'Doggys',
    items: [
      { nombre: 'Doggy Club', precio: 109 },
      { nombre: 'Doggy Original', precio: 129 },
      { nombre: 'Doggy Wacamole', precio: 149 },
      { nombre: 'Doggy Tropical', precio: 149, isPromotion: true },
    ],
  },
  {
    categoria: 'Paquete Kids',
    items: [
      { nombre: 'Paquete Kids', precio: 129 },
    ],
  },
  {
    categoria: 'Postres',
    items: [
      { nombre: 'Pan de Elote', precio: 30 },
      { nombre: 'Galleta', precio: 19 },
      { nombre: 'Chocoflan', precio: 55 },
      { nombre: 'Elotty', precio: 55 },
      { nombre: 'Bruce Cake', precio: 55 },
      { nombre: 'Cookie Club', precio: 55 },
    ],
  },
  {
    categoria: 'Bebidas',
    items: [
      { nombre: 'Agua Natural', precio: 25 },
      { nombre: 'Agua de Sabor', precio: 29 },
      { nombre: 'Refresco 600ml', precio: 39 },
      { nombre: 'Refresco 2L', precio: 70 },
      { nombre: 'Arizona', precio: 35 },
      { nombre: 'Limonada Natural', precio: 40 },
      { nombre: 'Limonada Mineral', precio: 40 },
      { nombre: 'Naranjada Natural', precio: 40 },
      { nombre: 'Naranjada Mineral', precio: 40 },
      { nombre: 'Michelada S/Alcohol', precio: 55 },
    ],
  },
  {
    categoria: 'Shakes',
    items: [
      { nombre: 'Malteada Chocolate', precio: 69 },
      { nombre: 'Malteada Vainilla', precio: 69 },
      { nombre: 'Malteada Fresa', precio: 69 },
      { nombre: 'Malteada Temporada', precio: 69 },
    ],
  },
  {
    categoria: 'Vino',
    items: [
      { nombre: 'Riunite Lambrusco 187ml', precio: 99 },
    ],
  },
  {
    categoria: 'Cerveza',
    items: [
      { nombre: 'Indio Media', precio: 39 },
      { nombre: 'Indio Caguama', precio: 75 },
      { nombre: 'Tecate Media', precio: 39 },
      { nombre: 'Tecate Caguama', precio: 75 },
      { nombre: 'XX Lager Media', precio: 42 },
      { nombre: 'XX Lager Caguama', precio: 80 },
      { nombre: 'Heineken Caguama', precio: 80 },
      { nombre: 'Tritón 3L', precio: 189 },
      { nombre: 'Tritón 5L', precio: 299 },
      { nombre: 'Michelada 1L', precio: 90 },
    ],
  },
  {
    categoria: 'Drinks',
    items: [
      { nombre: 'Blue Drink 500ml', precio: 55 },
      { nombre: 'Blue Drink 1L', precio: 90 },
      { nombre: 'Pinky Drink 500ml', precio: 55 },
      { nombre: 'Pinky Drink 1L', precio: 90 },
      { nombre: 'Michelada en Bolsita 500ml', precio: 55 },
      { nombre: 'Michelada en Bolsita 1L', precio: 90 },
    ],
  },
  {
    categoria: 'Preparados',
    items: [
      { nombre: 'Preparado Chelada', precio: 15 },
      { nombre: 'Preparado Michelada', precio: 22 },
      { nombre: 'Preparado Con Clamato', precio: 29 },
      { nombre: 'Preparado Con Tamarindo', precio: 29 },
      { nombre: 'Preparado Con Mango', precio: 29 },
      { nombre: 'Preparado Con Pelón Pelo Rico', precio: 29 },
    ],
  },
  {
    categoria: 'Aderezos',
    items: [
      { nombre: 'Aderezo Ranch (2oz)', precio: 20 },
      { nombre: 'Mayonesa Chipotle (2oz)', precio: 20 },
      { nombre: 'Queso Amarillo (2oz)', precio: 20 },
      { nombre: 'Salsa Extra (2oz)', precio: 20 },
      { nombre: 'Sabor extra Alitas o Boneless', precio: 5 },
    ],
  },
];

async function main() {
  for (let i = 0; i < MENU.length; i++) {
    const { categoria, items } = MENU[i];

    const category = await prisma.category.upsert({
      where: { nombre: categoria },
      update: { orden: i },
      create: { nombre: categoria, orden: i },
    });

    for (const item of items) {
      const existing = await prisma.product.findFirst({
        where: { nombre: item.nombre, categoryId: category.id },
      });
      if (existing) continue;

      await prisma.product.create({
        data: {
          nombre: item.nombre,
          precio: item.precio,
          maxSabores: item.maxSabores ?? null,
          isPromotion: item.isPromotion ?? false,
          categoryId: category.id,
        },
      });
    }
  }

  const total = await prisma.product.count();
  console.log(`✅ Seed completo. ${MENU.length} categorías, ${total} productos.`);
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run the seed**

```bash
npm run db:seed
```
Expected: prints `✅ Seed completo. 17 categorías, <N> productos.` with no errors. Running it a second time should print the same counts (idempotent — `upsert` for categories, existence check for products) instead of creating duplicates.

- [ ] **Step 3: Verify with Prisma Studio (optional but recommended)**

```bash
npx prisma studio
```
Open the browser tab it points to, confirm `Category` has 17 rows and `Product` has one row per menu item (e.g. "Alitas" category has 5 products).

- [ ] **Step 4: Commit**

```bash
git add prisma/seed.js
git commit -m "feat: seed Category/Product from the existing hardcoded menu"
```

---

### Task 3: Express app skeleton, auth middleware, health check

**Files:**
- Create: `middleware/auth.js`
- Create: `index.js`
- Create: `jest.config.api.js`
- Create: `tests/infra.test.js` (health check test only in this task — more tests appended in later tasks)

**Interfaces:**
- Produces: `middleware/auth.js` exports `{ verifyToken, requireRole }`. `verifyToken` sets `req.user = { id, email, role, sucursal }` (decoded JWT payload) and calls `next()`, or responds 401/403. `requireRole(...roles)` returns Express middleware that 403s if `req.user.role` isn't in `roles`.
- Produces: `index.js` exports the Express `app` (via `module.exports = app`) for Supertest to import directly, and only calls `app.listen` when run directly outside `test`/`production`.

- [ ] **Step 1: Create `middleware/auth.js`**

```js
// middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Verifica el JWT en el header Authorization: Bearer <token>
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};

// Uso: requireRole('admin') o requireRole('empleado', 'cocina')
// Siempre debe ir DESPUÉS de verifyToken.
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}.` });
    }
    next();
  };
};

module.exports = { verifyToken, requireRole };
```

- [ ] **Step 2: Create `jest.config.api.js`**

```js
// Config separada de react-scripts test — solo corre los tests de backend en tests/.
module.exports = {
  testEnvironment: 'node',
  testRegex: 'tests/.*\\.test\\.js$',
  testPathIgnorePatterns: ['/node_modules/', '/\\._'],
  setupFiles: ['dotenv/config'],
  testTimeout: 20000,
};
```

- [ ] **Step 3: Write the failing health check test**

```js
// tests/infra.test.js
process.env.NODE_ENV = 'test';

const request = require('supertest');
const app = require('../index');

describe('GET /api/health', () => {
  it('responds with ok status and confirms the DB connection', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
```

- [ ] **Step 4: Run it and confirm it fails**

```bash
npm run test:api
```
Expected: FAIL — `Cannot find module '../index'` (it doesn't exist yet).

- [ ] **Step 5: Create `index.js`**

```js
// index.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const prisma = require('./lib/prisma');
const { verifyToken, requireRole } = require('./middleware/auth');

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// Todo corre en local por ahora: aceptamos cualquier puerto de localhost.
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl / tests sin Origin
    if (/^http:\/\/localhost:\d+$/.test(origin)) return callback(null, true);
    callback(new Error('No permitido por CORS'));
  },
  credentials: true,
}));

app.use(express.json());

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Intenta de nuevo en unos minutos.' },
});

app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch (e) {
    console.error('❌ Error health check:', e);
    res.status(500).json({ ok: false });
  }
});

// ======================================================
// 404 y errores no capturados
// ======================================================
app.use((req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('❌ Error no capturado:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  app.listen(3001, () => console.log('✅ Servidor local en puerto 3001'));
}

module.exports = app;
```

- [ ] **Step 6: Run the test again and confirm it passes**

```bash
npm run test:api
```
Expected: PASS. (This hits the real Neon DB configured in `.env` — confirms the whole chain works: Express → Prisma → Neon.)

- [ ] **Step 7: Commit**

```bash
git add middleware/auth.js index.js jest.config.api.js tests/infra.test.js
git commit -m "feat: add Express app skeleton with health check and auth middleware"
```

---

### Task 4: Client auth — register and login

**Files:**
- Modify: `index.js`
- Modify: `tests/infra.test.js`

**Interfaces:**
- Consumes: `prisma` (from `./lib/prisma`), `bcryptjs`, `jsonwebtoken`.
- Produces: `POST /api/auth/register` and `POST /api/auth/login`, both returning `{ success: true, token, user }` where `user` never includes `password` or `pin`. Later tasks' tests use `POST /api/auth/login` to get a `cliente` token for negative-permission checks (e.g. a client hitting an admin-only route).

- [ ] **Step 1: Add bcrypt/jwt requires and `JWT_SECRET` to `index.js`**

At the top of `index.js`, after the existing requires, add:
```js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
```

- [ ] **Step 2: Write the failing tests**

Append to `tests/infra.test.js`: add these requires right after the existing `const app = require('../index');` line (bcrypt and jwt are also needed by Tasks 5–7's tests below), then add the new `describe` block at the end of the file:

```js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = new PrismaClient();

const TEST_PREFIX = 'jest-infra';

afterAll(async () => {
  await prisma.user.deleteMany({ where: { email: { contains: TEST_PREFIX } } });
  await prisma.$disconnect();
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
```

- [ ] **Step 3: Run tests, confirm the new ones fail**

```bash
npm run test:api
```
Expected: the `Client auth` tests FAIL with 404s (routes don't exist yet); the earlier health check test still passes.

- [ ] **Step 4: Implement the routes in `index.js`**

Add before the 404 handler:

```js
app.post('/api/auth/register', authLimiter, async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, email, password' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
    }

    const emailLimpio = email.toLowerCase().trim();
    const existe = await prisma.user.findUnique({ where: { email: emailLimpio } });
    if (existe) return res.status(409).json({ error: 'Ya existe una cuenta con ese email' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { nombre, email: emailLimpio, password: hashedPassword, role: 'cliente' },
    });

    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, pin: __, ...safeUser } = newUser;
    res.status(201).json({ success: true, token, user: safeUser });
  } catch (e) {
    console.error('❌ Error registro:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user || !user.password || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, pin: __, ...safeUser } = user;
    res.json({ success: true, token, user: safeUser });
  } catch (e) {
    console.error('❌ Error login:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});
```

- [ ] **Step 5: Run tests, confirm they pass**

```bash
npm run test:api
```
Expected: PASS — all `Client auth` tests plus the health check.

- [ ] **Step 6: Commit**

```bash
git add index.js tests/infra.test.js
git commit -m "feat: add client register/login endpoints with JWT"
```

---

### Task 5: Staff PIN auth

**Files:**
- Modify: `index.js`
- Modify: `tests/infra.test.js`

**Interfaces:**
- Consumes: `User.pin` (bcrypt hash), `User.sucursal`, `User.role`.
- Produces: `POST /api/auth/staff-login` returning `{ success: true, token, user }` where the JWT payload includes `sucursal`. Later tasks (admin user creation) create the staff fixtures this task's tests use.

- [ ] **Step 1: Write the failing tests**

Append to `tests/infra.test.js`, inside a new `describe` block (needs a staff fixture created directly via Prisma, since there's no admin-creation endpoint until Task 7):

```js
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
```

Also update `afterAll` to clean up staff users too — replace the existing `afterAll` block with:

```js
afterAll(async () => {
  await prisma.user.deleteMany({ where: { OR: [{ email: { contains: TEST_PREFIX } }, { nombre: { contains: TEST_PREFIX } }] } });
  await prisma.$disconnect();
});
```

- [ ] **Step 2: Run tests, confirm the new ones fail**

```bash
npm run test:api
```
Expected: `Staff PIN auth` tests FAIL with 404 (route doesn't exist).

- [ ] **Step 3: Implement `POST /api/auth/staff-login` in `index.js`**

Add before the 404 handler:

```js
app.post('/api/auth/staff-login', authLimiter, async (req, res) => {
  try {
    const { sucursal, pin } = req.body;
    if (!sucursal || !pin) {
      return res.status(400).json({ error: 'sucursal y pin son obligatorios' });
    }

    const candidatos = await prisma.user.findMany({
      where: { sucursal, role: { in: ['empleado', 'cocina'] }, activo: true },
    });

    let match = null;
    for (const candidato of candidatos) {
      if (candidato.pin && (await bcrypt.compare(pin, candidato.pin))) {
        match = candidato;
        break;
      }
    }

    if (!match) {
      return res.status(401).json({ error: 'PIN o sucursal incorrectos' });
    }

    const token = jwt.sign(
      { id: match.id, role: match.role, sucursal: match.sucursal },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    const { password: _, pin: __, ...safeUser } = match;
    res.json({ success: true, token, user: safeUser });
  } catch (e) {
    console.error('❌ Error staff-login:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm run test:api
```
Expected: PASS — all tests so far.

- [ ] **Step 5: Commit**

```bash
git add index.js tests/infra.test.js
git commit -m "feat: add staff PIN login scoped to sucursal"
```

---

### Task 6: Products — public listing + admin CRUD

**Files:**
- Modify: `index.js`
- Modify: `tests/infra.test.js`

**Interfaces:**
- Consumes: `verifyToken`, `requireRole('admin')` from `middleware/auth.js`.
- Produces: `GET /api/products` (public), `POST /api/admin/products`, `PUT /api/admin/products/:id`, `DELETE /api/admin/products/:id` (soft delete via `activo: false`) — all admin ones protected by `verifyToken` + `requireRole('admin')`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/infra.test.js`:

```js
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
```

- [ ] **Step 2: Run tests, confirm the new ones fail**

```bash
npm run test:api
```
Expected: `Products` tests FAIL with 404 (routes don't exist).

- [ ] **Step 3: Implement the routes in `index.js`**

Add before the 404 handler:

```js
app.get('/api/products', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { activo: true },
      include: { category: { select: { nombre: true, orden: true } } },
      orderBy: [{ category: { orden: 'asc' } }, { nombre: 'asc' }],
    });
    res.json(products);
  } catch (e) {
    console.error('❌ Error listando productos:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/admin/products', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, precio, categoryId, maxSabores, isPromotion } = req.body;
    if (!nombre || precio === undefined || !categoryId) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, precio, categoryId' });
    }

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) return res.status(400).json({ error: 'categoryId no existe' });

    const product = await prisma.product.create({
      data: { nombre, precio, categoryId, maxSabores: maxSabores ?? null, isPromotion: isPromotion ?? false },
    });
    res.status(201).json(product);
  } catch (e) {
    console.error('❌ Error creando producto:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.put('/api/admin/products/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, precio, categoryId, maxSabores, isPromotion, activo } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { nombre, precio, categoryId, maxSabores, isPromotion, activo },
    });
    res.json(product);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Producto no encontrado' });
    console.error('❌ Error actualizando producto:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.delete('/api/admin/products/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { activo: false },
    });
    res.json(product);
  } catch (e) {
    if (e.code === 'P2025') return res.status(404).json({ error: 'Producto no encontrado' });
    console.error('❌ Error eliminando producto:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});
```

Note: Prisma's `update` rejects `undefined` values by leaving fields unchanged (not by erroring) — that's why `PUT` can accept a partial body like `{ precio: 88 }`.

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm run test:api
```
Expected: PASS — all tests so far.

- [ ] **Step 5: Commit**

```bash
git add index.js tests/infra.test.js
git commit -m "feat: add public product listing and admin product CRUD"
```

---

### Task 7: Admin — list and create staff users

**Files:**
- Modify: `index.js`
- Modify: `tests/infra.test.js`

**Interfaces:**
- Consumes: `verifyToken`, `requireRole('admin')`.
- Produces: `GET /api/admin/users` (optionally filtered by `?sucursal=`), `POST /api/admin/users` (creates `empleado`/`cocina` with a hashed PIN) — both admin-only.

- [ ] **Step 1: Write the failing tests**

Append to `tests/infra.test.js`:

```js
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
```

- [ ] **Step 2: Run tests, confirm the new ones fail**

```bash
npm run test:api
```
Expected: FAIL with 404 (routes don't exist).

- [ ] **Step 3: Implement the routes in `index.js`**

Add before the 404 handler:

```js
app.get('/api/admin/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { sucursal } = req.query;
    const users = await prisma.user.findMany({
      where: {
        role: { in: ['empleado', 'cocina'] },
        ...(sucursal ? { sucursal } : {}),
      },
      select: { id: true, nombre: true, role: true, sucursal: true, activo: true, createdAt: true },
    });
    res.json(users);
  } catch (e) {
    console.error('❌ Error listando staff:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

app.post('/api/admin/users', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { nombre, role, sucursal, pin } = req.body;

    if (!nombre || !role || !sucursal || !pin) {
      return res.status(400).json({ error: 'Campos obligatorios: nombre, role, sucursal, pin' });
    }
    if (!['empleado', 'cocina'].includes(role)) {
      return res.status(400).json({ error: 'role debe ser empleado o cocina' });
    }
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'pin debe ser exactamente 4 dígitos' });
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    const user = await prisma.user.create({
      data: { nombre, role, sucursal, pin: hashedPin },
    });

    const { password: _, pin: __, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (e) {
    console.error('❌ Error creando staff:', e);
    res.status(500).json({ error: 'Error en servidor' });
  }
});
```

- [ ] **Step 4: Run tests, confirm they pass**

```bash
npm run test:api
```
Expected: PASS — the full suite, all tasks combined.

- [ ] **Step 5: Commit**

```bash
git add index.js tests/infra.test.js
git commit -m "feat: add admin endpoints to list and create staff with PIN"
```

---

### Task 8: Final wiring and full verification

**Files:**
- No new files — this task is a full-suite sanity check plus a manual smoke test of the running server.

- [ ] **Step 1: Run the full backend test suite one more time**

```bash
npm run test:api
```
Expected: PASS, every `describe` block from Tasks 3–7.

- [ ] **Step 2: Start the server manually and smoke-test it**

```bash
npm run server
```
In another terminal:
```bash
curl -s http://localhost:3001/api/health
curl -s http://localhost:3001/api/products | head -c 300
```
Expected: `{"ok":true}` and a JSON array of products starting with the seeded menu. Stop the server with Ctrl+C when done.

- [ ] **Step 3: Confirm the CRA frontend still starts untouched**

```bash
npm start
```
Expected: the existing site loads at `http://localhost:3000` exactly as before (no frontend files were touched in this plan). Stop it with Ctrl+C.

- [ ] **Step 4: Confirm `.env` was never staged**

```bash
git status --short
git log --all --oneline -- .env
```
Expected: `.env` doesn't appear in `git status` (untracked and ignored), and the second command prints nothing (never committed).

- [ ] **Step 5: Final commit if anything is pending**

```bash
git status
```
If everything from Tasks 1–7 is already committed, there's nothing to do here. Otherwise stage and commit any leftovers with a descriptive message.
