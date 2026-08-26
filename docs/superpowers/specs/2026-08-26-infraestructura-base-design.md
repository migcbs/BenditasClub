# Infraestructura base — BenditasClub

**Fecha:** 2026-08-26
**Estado:** Aprobado, pendiente de plan de implementación
**Fase:** 1 de N (ver roadmap completo abajo)

## Contexto

BenditasClub es hoy un front puro (Create React App) sin backend, sin base de datos y
sin autenticación. Los pedidos se arman en el cliente (`src/components/pedido/`) y se
envían por WhatsApp (`whatsappService.js`). El menú vive hardcodeado en
`src/components/pedido/services/productoServices.js` (`productosMenu`).

El objetivo de largo plazo es convertir BenditasClub en una plataforma de restaurante
completa: cuentas de cliente, toma de pedidos por empleado, pantalla de cocina en
tiempo real, panel de administración financiero/analítico, inventario, tarjeta de
fidelidad y checkout con Stripe. Ese objetivo es demasiado grande para un solo spec, así
que se decompuso en subproyectos independientes (roadmap abajo). Este documento cubre
**solo la fase 1: infraestructura base**, de la que dependen todas las demás.

Referencia de patrón: el proyecto hermano BOOZ (`/Volumes/m/m/Work/Development | Personal/BOOZ/BOOZ/BOOZ`)
ya implementa Express + Prisma + Neon + JWT + Stripe sobre un CRA, desplegado en
Vercel. BenditasClub replica ese patrón.

## Roadmap completo (para contexto, no todo se diseña ahora)

1. **Infraestructura base** — este documento.
2. Toma de pedidos (empleado / POS): pago con tarjeta (Stripe) o efectivo en sucursal.
3. Pantalla de cocina (KDS) en tiempo real.
4. Cuenta de cliente: registro/login, historial de pedidos, tarjeta de fidelidad.
5. Panel de administrador: financiero (día/semana/mes/año) + analíticos extensos.
6. Inventario conectado a empleado y toma de pedidos.
7. Shop + Stripe (checkout online o pago en sucursal).
8. Investigación de mercado (landing pages de restaurantes de alitas + software de
   restaurantes competidores) — insumo de producto, en paralelo, no bloqueante.
9. Rediseño visual (con la skill impeccable), aplicado por pantalla conforme cada flujo
   funcional exista.

Cada fase tendrá su propio ciclo diseño → plan → implementación.

## Decisiones de esta fase

- **Multi-sucursal real**: Xico y Coatepec se modelan como sucursales separadas.
  Inventario, caja y comandas de cocina son por sucursal; el admin tiene visibilidad
  consolidada o por sucursal (rol único de admin, sin "admin de sucursal" separado).
- **Menú migrado a base de datos ahora**: `productosMenu` deja de ser un archivo JS y
  pasa a ser `Category` + `Product` en Neon vía Prisma, con un seed script que carga los
  datos actuales.
- **Hosting/tiempo real**: Vercel (serverless) + Neon + Prisma, igual que BOOZ. Para la
  futura pantalla de cocina (fase 3) se usará **polling corto** (cada 3-5s) en vez de un
  servicio de pub-sub externo (Pusher/Ably) — cero infraestructura adicional, suficiente
  para el caso de uso de una cocina física.
- **Roles de staff**: `cliente`, `empleado`, `cocina`, `admin`. `empleado` y `cocina`
  están atados a una sucursal específica (`sucursal` en `User`); `admin` no tiene
  sucursal fija (acceso a ambas).
- **Login de staff con PIN**: empleados y cocina inician sesión con un PIN numérico de 4
  dígitos en una tablet compartida de la sucursal (patrón común de POS de restaurantes),
  en vez de email+contraseña. El PIN se guarda con hash (bcrypt), igual que las
  contraseñas de cliente.
- **Todo en local por ahora**: sin push a GitHub, sin deploy a Vercel. Neon es la única
  pieza "remota" (es una base de datos cloud por naturaleza), pero el flujo de trabajo
  de desarrollo y pruebas es 100% local hasta que el usuario cree una rama de test.
- **Neon**: el usuario no tiene proyecto Neon todavía; se creará guiado durante la
  implementación.

## Arquitectura

- **Frontend**: CRA actual, sin cambios de rutas/componentes en esta fase.
- **Backend**: `index.js` con Express embebido en el mismo repo (como BOOZ), Prisma
  Client como singleton global (`global.prisma`) para evitar agotar conexiones en cold
  starts serverless.
- **Base de datos**: Postgres en Neon, gestionada con Prisma (schema, migraciones,
  seed).
- **Auth**: JWT firmado con `JWT_SECRET`, middleware `verifyToken` + `requireRole`.

## Modelo de datos (Prisma)

```prisma
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
  id            String   @id @default(uuid())
  role          Role     @default(cliente)

  // clientes
  email         String?  @unique
  password      String?
  nombre        String
  telefono      String?

  // staff (empleado/cocina)
  pin           String?  // hash del PIN de 4 dígitos
  sucursal      SucursalNombre? // null para admin y clientes

  activo        Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Category {
  id        String    @id @default(uuid())
  nombre    String    @unique
  orden     Int       @default(0)
  products  Product[]
}

model Product {
  id            String    @id @default(uuid())
  nombre        String
  precio        Int
  categoryId    String
  category      Category  @relation(fields: [categoryId], references: [id])
  maxSabores    Int?
  isPromotion   Boolean   @default(false)
  activo        Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

Pendiente para el diseño de la fase de pedidos (no se resuelve aquí): modelar
`sabores` como entidad/relación propia — hoy viven embebidos en el JS del menú.

## Endpoints de esta fase

- `GET /api/health` — chequeo de conexión a DB.
- `POST /api/auth/register`, `POST /api/auth/login` — clientes, email+password → JWT.
- `POST /api/auth/staff-login` — `{ sucursal, pin }` → JWT con `role` y `sucursal`.
- `GET /api/products` — lista productos activos (público, lo consume el Shop actual).
- `POST/PUT/DELETE /api/admin/products` — CRUD de productos, solo `admin`.
- `GET /api/admin/users`, `POST /api/admin/users` — listar/crear staff, solo `admin`.

## Testing

Mismo patrón que BOOZ: Jest + Supertest contra la API. Cobertura mínima:
registro/login de cliente, login de staff con PIN, protección de rutas por rol
(`requireRole`), y CRUD de productos.

## Fuera de alcance

Toma de pedidos, cocina, inventario, financiero/analíticos, fidelidad, Stripe,
rediseño visual e investigación de mercado — cada uno se diseña en su propio spec
cuando llegue su fase.
