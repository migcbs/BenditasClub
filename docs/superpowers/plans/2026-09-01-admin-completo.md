# Benditas Club Admin Completo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir un panel `/admin` mobile-first que conecte operación, personal, menú, inventario por recetas, compras, caja, finanzas y analíticos reales para Xico y Coatepec.

**Architecture:** Express conserva la frontera HTTP y delega cálculos puros a servicios de dominio en `server/`. Prisma ejecuta transacciones para compras, consumo de recetas, cancelaciones y cierres de caja. React/MUI usa un shell responsive y módulos por dominio; un cliente API único gestiona token y errores.

**Tech Stack:** React 19, React Router 6, MUI, Emotion, Framer Motion, Recharts, Express 5, Prisma 6, PostgreSQL/Neon, Jest, Supertest y React Testing Library.

**Spec:** `docs/superpowers/specs/2026-09-01-admin-completo-design.md`

## Global Constraints

- Mobile-first a 390 px; tablet y escritorio completo a 1440 px.
- MUI Material Design 3, glass solo en navegación/filtros y tarjetas de datos opacas.
- Toda ruta administrativa exige JWT con rol `admin`.
- Totales, costos, existencias y conciliaciones se calculan en servidor.
- El proyecto permanece local; no se hace push ni deploy.
- Cada comportamiento nuevo sigue RED → GREEN → REFACTOR.
- No se persisten datos de demostración.

---

### Task 1: Fundaciones, autenticación y dashboard

**Files:**
- Modify: `package.json`
- Modify: `src/App.js`
- Modify: `index.js`
- Create: `server/admin/analytics.js`
- Create: `src/admin/AdminApp.jsx`
- Create: `src/admin/AdminLogin.jsx`
- Create: `src/admin/AdminShell.jsx`
- Create: `src/admin/AdminDashboard.jsx`
- Create: `src/admin/adminApi.js`
- Create: `src/admin/adminTheme.js`
- Create: `src/admin/admin.css`
- Test: `tests/admin-dashboard.test.js`
- Test: `src/admin/AdminApp.test.jsx`

**Interfaces:**
- Produces `GET /api/admin/dashboard?branch=all|xico|coatepec&from=<ISO>&to=<ISO>`.
- Produces `summarizeOrders(orders)` con `{ sales, orders, averageTicket, cashSales, cardSales, cancelledOrders, hourlySales, topProducts, kitchenDelays }`.
- Produces `adminApi` con `loginAdmin`, `getDashboard` y manejo centralizado de `401`.

- [ ] **Step 1: Write failing API tests**

```js
it('rejects a non-admin dashboard request', async () => {
  const res = await request(app).get('/api/admin/dashboard').set('Authorization', `Bearer ${employeeToken}`);
  expect(res.status).toBe(403);
});

it('returns real sales totals scoped to xico', async () => {
  const res = await request(app).get('/api/admin/dashboard?branch=xico').set('Authorization', `Bearer ${adminToken}`);
  expect(res.status).toBe(200);
  expect(res.body.summary.sales).toBe(expectedXicoSales);
  expect(res.body.summary.orders).toBe(expectedXicoOrders);
});
```

- [ ] **Step 2: Run API test and verify RED**

Run: `npm run test:api -- --runTestsByPath tests/admin-dashboard.test.js`
Expected: 404 for `/api/admin/dashboard`.

- [ ] **Step 3: Implement analytics service and dashboard endpoint**

Validate date range and branch, query orders once with items/employee, aggregate using pure functions, and include current open cash shifts and low-stock count when those tables exist (zero until Task 3/5 migrations land).

- [ ] **Step 4: Run API test and verify GREEN**

Run: `npm run test:api -- --runTestsByPath tests/admin-dashboard.test.js`
Expected: PASS.

- [ ] **Step 5: Write failing frontend tests**

```jsx
test('admin login rejects a client account', async () => {
  render(<AdminApp api={fakeApiReturningClient} />);
  await user.type(screen.getByLabelText(/correo/i), 'cliente@test.local');
  await user.type(screen.getByLabelText(/contraseña/i), 'Password123');
  await user.click(screen.getByRole('button', { name: /entrar/i }));
  expect(await screen.findByText(/solo administradores/i)).toBeVisible();
});

test('dashboard renders live summary returned by the API', async () => {
  render(<AdminDashboard api={fakeApi} />);
  expect(await screen.findByText('$18,460')).toBeVisible();
  expect(screen.getByText('64 pedidos')).toBeVisible();
});
```

- [ ] **Step 6: Run frontend test and verify RED**

Run: `CI=true npm test -- --watchAll=false --runInBand src/admin/AdminApp.test.jsx`
Expected: module `AdminApp` not found.

- [ ] **Step 7: Install UI dependencies and implement shell**

Install `@mui/material @emotion/react @emotion/styled framer-motion recharts`. Add `/admin`, hide public chrome, validate stored admin session, add mobile bottom navigation and desktop rail. Render skeleton, empty and error states.

- [ ] **Step 8: Run frontend test and verify GREEN**

Run: `CI=true npm test -- --watchAll=false --runInBand src/admin/AdminApp.test.jsx`
Expected: PASS.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json index.js server/admin src/admin src/App.js tests/admin-dashboard.test.js
git commit -m "feat: add admin authentication shell and live dashboard"
```

### Task 2: Equipo, menú y pedidos administrativos

**Files:**
- Modify: `index.js`
- Create: `server/admin/validators.js`
- Create: `src/admin/team/TeamPage.jsx`
- Create: `src/admin/menu/MenuPage.jsx`
- Create: `src/admin/orders/AdminOrdersPage.jsx`
- Modify: `src/admin/adminApi.js`
- Test: `tests/admin-operations.test.js`
- Test: `src/admin/team/TeamPage.test.jsx`

**Interfaces:**
- `PUT /api/admin/users/:id` cambia nombre, sucursal, rol y activo.
- `PUT /api/admin/users/:id/pin` reemplaza hash y responde `{ temporaryPin }` una sola vez.
- `GET /api/admin/orders` acepta filtros de sucursal, fechas, pago, cocina y tipo.
- CRUD existente de productos se normaliza para responder categorías y validaciones consistentes.

- [ ] **Step 1: Write failing operation tests** for admin-only access, staff deactivation, PIN regeneration, product price validation and filtered order listing.
- [ ] **Step 2: Run and verify RED** with `npm run test:api -- --runTestsByPath tests/admin-operations.test.js`.
- [ ] **Step 3: Implement minimal routes and validators**; never return password or PIN hashes.
- [ ] **Step 4: Run and verify GREEN**.
- [ ] **Step 5: Write failing TeamPage interaction test** for creating staff, copying the one-time PIN and refreshing the list.
- [ ] **Step 6: Run and verify RED**.
- [ ] **Step 7: Implement Team, Menu and Orders pages** with drawers on mobile, table/detail split on desktop, filters and optimistic-disabled submit buttons.
- [ ] **Step 8: Run all UI tests and verify GREEN**.
- [ ] **Step 9: Commit** with `feat: add admin team menu and order management`.

### Task 3: Ingredientes, recetas y consumo transaccional

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260901193000_inventory_recipes/migration.sql`
- Create: `server/inventory/inventoryService.js`
- Create: `server/inventory/inventoryRoutes.js`
- Modify: `index.js`
- Create: `src/admin/inventory/InventoryPage.jsx`
- Create: `src/admin/inventory/RecipeEditor.jsx`
- Test: `tests/inventory.test.js`
- Test: `src/admin/inventory/InventoryPage.test.jsx`

**Interfaces:**
- Models: `Ingredient`, `LocationStock`, `Recipe`, `RecipeItem`, `InventoryMovement`.
- Enum `InventoryMovementType`: `purchase`, `sale`, `waste`, `adjustment`, `transfer_in`, `transfer_out`, `sale_reversal`.
- `applyOrderInventory(prismaTx, orderId)` and `reverseOrderInventory(prismaTx, orderId)` are idempotent via timestamps on `Order`.
- CRUD `/api/admin/ingredients`, `/stocks`, `/recipes`; actions `/inventory/adjust` and `/inventory/transfer`.

- [ ] **Step 1: Write failing domain tests** proving recipe cost, sale deduction, cancellation reversal, insufficient-stock warning without blocking a sale, and repeated calls remaining idempotent.
- [ ] **Step 2: Run and verify RED** because inventory models/services do not exist.
- [ ] **Step 3: Add Prisma schema and migration**, generate client and apply migration to Neon.
- [ ] **Step 4: Implement inventory service and routes**, wrapping order creation/cancellation updates in `$transaction`.
- [ ] **Step 5: Run and verify GREEN**.
- [ ] **Step 6: Write failing UI tests** for ingredient creation, physical count and recipe editing.
- [ ] **Step 7: Implement inventory and recipe UI** with unit-aware inputs, low-stock filters and cost/margin preview.
- [ ] **Step 8: Run and verify GREEN**.
- [ ] **Step 9: Commit** with `feat: add ingredient inventory recipes and automatic consumption`.

### Task 4: Proveedores, compras y recepción

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260901200000_suppliers_purchases/migration.sql`
- Create: `server/purchasing/purchasingService.js`
- Create: `server/purchasing/purchasingRoutes.js`
- Modify: `index.js`
- Create: `src/admin/purchasing/PurchasingPage.jsx`
- Create: `src/admin/purchasing/PurchaseEditor.jsx`
- Test: `tests/purchasing.test.js`
- Test: `src/admin/purchasing/PurchasingPage.test.jsx`

**Interfaces:**
- Models: `Supplier`, `PurchaseOrder`, `PurchaseOrderItem`.
- Enum `PurchaseOrderStatus`: `draft`, `submitted`, `received`, `cancelled`.
- `receivePurchase(prismaTx, purchaseId, adminId)` adds stock, recalculates weighted average cost, writes immutable movements and marks received once.
- Routes `/api/admin/suppliers`, `/purchases`, `/purchases/:id/receive`.

- [ ] **Step 1: Write failing API tests** for supplier CRUD, purchase totals, receiving, weighted average cost and double-receive rejection.
- [ ] **Step 2: Run and verify RED**.
- [ ] **Step 3: Add schema/migration and implement transactional service/routes**.
- [ ] **Step 4: Run and verify GREEN**.
- [ ] **Step 5: Write failing UI test** for creating and receiving a purchase from a phone-sized flow.
- [ ] **Step 6: Implement purchasing UI** with supplier catalog, line editor, status timeline and receive confirmation.
- [ ] **Step 7: Run all tests and verify GREEN**.
- [ ] **Step 8: Commit** with `feat: add suppliers purchasing and inventory receiving`.

### Task 5: Caja, gastos y conciliación

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260901203000_cash_finance/migration.sql`
- Create: `server/finance/cashService.js`
- Create: `server/finance/financeRoutes.js`
- Modify: `index.js`
- Create: `src/admin/finance/FinancePage.jsx`
- Create: `src/admin/finance/CashShiftPanel.jsx`
- Create: `src/admin/finance/ExpenseForm.jsx`
- Test: `tests/finance.test.js`
- Test: `src/admin/finance/FinancePage.test.jsx`

**Interfaces:**
- Models: `CashShift`, `CashMovement`, `Expense`.
- Enums `CashShiftStatus(open, closed)`, `CashMovementType(pay_in, pay_out)`, `ExpenseCategory` stored as validated string for extensibility.
- `calculateCashReconciliation({ openingCash, cashSales, payIns, payOuts, cashExpenses, countedCash })` returns expected and discrepancy.
- Routes to open/close shift, add movement, add/list expenses and fetch finance summary.

- [ ] **Step 1: Write failing tests** for one open shift per location, expected cash formula, discrepancy, admin authorization and immutable closed shifts.
- [ ] **Step 2: Run and verify RED**.
- [ ] **Step 3: Add schema/migration and implement cash/expense services and routes**.
- [ ] **Step 4: Run and verify GREEN**.
- [ ] **Step 5: Write failing UI tests** for opening, cash movement, expense and closing confirmation.
- [ ] **Step 6: Implement FinancePage** with current shift, reconciliation, expense breakdown and period summary.
- [ ] **Step 7: Run and verify GREEN**.
- [ ] **Step 8: Commit** with `feat: add cash shifts expenses and reconciliation`.

### Task 6: Analíticos, alertas y acabado Impeccable

**Files:**
- Modify: `server/admin/analytics.js`
- Modify: `index.js`
- Modify: `src/admin/AdminDashboard.jsx`
- Create: `src/admin/analytics/AnalyticsPage.jsx`
- Create: `src/admin/components/ShiftPulse.jsx`
- Create: `src/admin/components/PeriodBranchFilter.jsx`
- Test: `tests/admin-analytics.test.js`
- Test: `src/admin/analytics/AnalyticsPage.test.jsx`
- Create: `DESIGN.md`

**Interfaces:**
- Analytics response includes prior-period comparison, sales by hour/day/location/payment, top and low-margin products, theoretical COGS, expenses, gross profit, estimated operating profit, inventory variance and staff performance.
- Alerts are derived server-side with stable IDs and severity: low stock, missing recipe, delayed kitchen order, cash discrepancy and overdue close.

- [ ] **Step 1: Write failing analytics tests** with deterministic date fixtures and exact comparison calculations.
- [ ] **Step 2: Run and verify RED**.
- [ ] **Step 3: Implement analytics and alert derivation** using pure functions and bounded Prisma queries.
- [ ] **Step 4: Run and verify GREEN**.
- [ ] **Step 5: Write failing UI tests** for filters, chart accessible summaries, empty periods and alert navigation.
- [ ] **Step 6: Implement analytics UI and ShiftPulse**; charts include text/table equivalents for accessibility.
- [ ] **Step 7: Run full verification**:

```bash
npm run test:api
CI=true npm test -- --watchAll=false --runInBand
npm run build
```

- [ ] **Step 8: Capture and inspect** 390 px, tablet and 1440 px; settle motion before screenshots.
- [ ] **Step 9: Run Impeccable detector once** on `src/admin`, fix mechanical findings in one batch, and recapture once.
- [ ] **Step 10: Document the resulting visual system** in `DESIGN.md` from the implementation.
- [ ] **Step 11: Commit** with `feat: complete admin analytics alerts and responsive polish`.
