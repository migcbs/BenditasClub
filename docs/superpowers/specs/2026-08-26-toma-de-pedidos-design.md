# Toma de pedidos (empleado / POS) — BenditasClub

**Fecha:** 2026-08-26
**Estado:** Aprobado, pendiente de plan de implementación
**Fase:** 2 de 9 (ver roadmap en `2026-08-26-infraestructura-base-design.md`)

## Contexto

La fase 1 (infraestructura base) ya dejó Neon + Prisma + Express funcionando, con
roles (`cliente`/`empleado`/`cocina`/`admin`), login de staff por PIN scoped a
sucursal, y el menú migrado a `Category`/`Product`. Esta fase construye la toma de
pedidos por parte del empleado: una pantalla nueva tipo POS, separada del popup de
carrito que ya usan los clientes en `/shop` (ese popup no se toca en esta fase, sigue
mandando por WhatsApp).

## Decisiones de esta fase

- **Pantalla nueva `/pos`**, no se reutiliza el popup de cliente. Pensada para tablet
  compartida en la sucursal, con login de staff (PIN) ya construido en fase 1.
- **Pago con tarjeta = registro, no cobro real**: la sucursal ya tiene una terminal
  física de tarjeta separada del software. El sistema solo guarda `metodoPago` como
  dato — no se integra Stripe para cobros en persona en esta fase.
- **Tipos de pedido**: `mesa`, `para_llevar`, `domicilio`. Campos condicionales según
  el tipo (número de mesa; o nombre+teléfono+dirección).
- **Sin cuenta de cliente todavía**: `clienteNombre`/`clienteTelefono` son texto libre
  en el pedido, no una relación a `User` — las cuentas de cliente llegan en la fase 4.
- **Sabores como texto simple**: se muestra al empleado la misma lista fija de sabores
  por categoría que ya existe hoy (hardcodeada), y se guardan como `String[]` en el
  `OrderItem`. No se modela una tabla `Sabor` en esta fase — eso queda para cuando el
  admin necesite editarlos (probablemente junto con la fase 5, panel admin).
- **Pedidos por turno con lista simple**: el empleado ve los pedidos `pendiente` y
  `pagado` de su propia sucursal (nunca de la otra), y puede marcar un pedido como
  pagado o cancelado.
- **Todo acotado a sucursal por el JWT**: ningún endpoint de pedidos acepta una
  sucursal distinta a la del token de staff — se lee de `req.user.sucursal`, nunca del
  body/query.
- **Precios snapshot**: `OrderItem.nombre`/`precio` se copian del `Product` al momento
  de crear el pedido, para que cambios de precio futuros no alteren pedidos históricos.

## Modelo de datos (Prisma, se agrega al schema existente)

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

`User` gana `pedidos Order[]` y `Product` gana `orderItems OrderItem[]` como
contraparte de las relaciones de arriba (requerido por Prisma).

## Endpoints

Todos requieren `verifyToken` + `requireRole('empleado')`, y usan `req.user.sucursal`
para todo (nunca un valor del body/query):

- `POST /api/orders` — crea un pedido con sus items. El servidor recalcula
  `subtotal`/`total` a partir de los precios reales de `Product` (nunca confía en el
  total que mande el cliente). Body: `{ tipo, mesa?, clienteNombre?, clienteTelefono?,
  direccion?, notas?, metodoPago?, estado?, items: [{ productId, cantidad, sabores? }] }`.
- `GET /api/orders?estado=` — lista los pedidos de la sucursal del empleado, más
  recientes primero, filtrables por `estado`.
- `PUT /api/orders/:id/estado` — cambia `estado` a `pagado` o `cancelado`. Si es
  `pagado`, requiere `metodoPago` en el body. Rechaza si el pedido no es de la
  sucursal del empleado (404, para no filtrar existencia entre sucursales).

## Pantalla `/pos` (frontend)

1. **Login de staff**: selector de sucursal + PIN numérico (usa
   `POST /api/auth/staff-login`, ya existente). Token en `localStorage` bajo una
   llave separada del futuro token de cliente (`bc_staff_token`).
2. **Armar pedido**: categorías/productos desde `GET /api/products` (ya no del JS
   hardcodeado). Selector de sabores cuando el producto tiene `maxSabores > 0`
   (lista fija por categoría, igual que hoy). Carrito con cantidades.
3. **Datos del pedido**: tipo (mesa/para llevar/domicilio) con campos condicionales,
   notas opcionales.
4. **Cerrar venta**: elegir método de pago y marcar `pagado` directamente (la
   terminal física ya cobró antes de este paso), o dejar `pendiente` para el caso de
   "cobrar al entregar" (típicamente domicilio).
5. **Lista de pedidos del turno**: pedidos `pendiente`/`pagado` de la sucursal, con
   acción para marcar pagado/cancelado.

## Testing

Mismo patrón que la fase 1: Jest + Supertest contra la API real (Neon de desarrollo),
con datos de prueba prefijados y limpieza en `afterAll`. Cobertura mínima: crear
pedido con varios items y sabores (verifica que el total se calcula en servidor,
ignorando un total falso enviado por el cliente), listar pedidos acotado a sucursal,
cambiar estado a pagado/cancelado, y que un empleado de una sucursal no pueda tocar
pedidos de la otra.

## Fuera de alcance

Cobro real con Stripe (fase 7), cuenta de cliente formal (fase 4), pantalla de cocina
en tiempo real (fase 3), edición de sabores desde el admin, tabla `Sabor` propia,
inventario (fase 6).
