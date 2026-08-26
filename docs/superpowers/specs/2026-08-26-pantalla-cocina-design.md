# Pantalla de cocina en tiempo real (KDS) — BenditasClub

**Fecha:** 2026-08-26
**Estado:** Aprobado, pendiente de plan de implementación
**Fase:** 3 de 9 (ver roadmap en `2026-08-26-infraestructura-base-design.md`)

## Contexto

Las fases 1 y 2 ya dejaron pedidos (`Order`/`OrderItem`) creados desde el POS del
empleado, con un `estado` de **pago** (`pendiente`/`pagado`/`cancelado`). Cocina
necesita su propio seguimiento de **preparación**, independiente del pago: un pedido a
domicilio puede estar "pendiente de pago" y aun así cocina ya debe empezar a
prepararlo.

La infraestructura base (fase 1) ya decidió el mecanismo de tiempo real: **polling
corto** (sin Pusher/Ably), por simplicidad y cero infraestructura adicional.

## Decisiones de esta fase

- **Estado de cocina independiente del pago**: nuevo campo `Order.estadoCocina` con
  flujo `nueva → en_preparacion → lista → entregada`, separado de `Order.estado`
  (pago).
- **Permisos por rol**: el rol `cocina` controla `nueva`/`en_preparacion`/`lista`/
  `entregada` sin restricción. El rol `empleado` solo puede poner `entregada` (es quien
  le entrega el pedido al cliente en mostrador/mesa).
- **Visibilidad en el tablero**: la pantalla de cocina muestra 3 columnas (Nueva / En
  preparación / Lista); los pedidos `cancelado` (estado de pago) o `entregada` (estado
  de cocina) no aparecen — se filtran en el frontend sobre la misma lista de
  `GET /api/orders` ya construida en la fase 2, que se abre también al rol `cocina`.
- **Polling cada 4 segundos**: sin servicio de terceros. Aceptable para el caso de uso
  de una cocina física (ver decisión de infraestructura base).
- **Un pedido "lista" se queda visible hasta "entregada"**: evita que se pierdan
  pedidos listos esperando a que el cliente los recoja. El empleado marca "entregada"
  desde su propia lista de pedidos del turno (fase 2, `/pos`), no desde la pantalla de
  cocina.
- **Reutilización de login de staff**: el mismo componente de PIN + sucursal que ya
  existe para `/pos` se mueve a un módulo compartido (`src/shared/`) para que `/cocina`
  lo use sin duplicar código — el backend de `staff-login` ya es agnóstico al rol.

## Modelo de datos (se agrega al schema existente)

```prisma
enum EstadoCocina {
  nueva
  en_preparacion
  lista
  entregada
}
```

`Order` gana `estadoCocina EstadoCocina @default(nueva)`.

## Endpoints

- `GET /api/orders` (fase 2, existente) — se amplía `requireRole('empleado')` a
  `requireRole('empleado', 'cocina')`. Sigue acotado a `req.user.sucursal`. La
  respuesta ya incluye `estadoCocina` en cuanto se agrega al schema.
- `PUT /api/orders/:id/cocina` (nuevo) — body `{ estadoCocina }`, `verifyToken` +
  `requireRole('empleado', 'cocina')`, acotado a la sucursal del token (404 si el
  pedido es de otra sucursal, igual que `PUT /api/orders/:id/estado`):
  - Si `req.user.role === 'cocina'`: acepta cualquier valor válido del enum.
  - Si `req.user.role === 'empleado'`: solo acepta `estadoCocina: 'entregada'`
    (rechaza cualquier otro valor con 400).

## Pantalla `/cocina` (frontend)

1. **Login de staff**: mismo flujo de PIN + sucursal ya construido (movido a
   `src/shared/`), sin cambios de comportamiento.
2. **Tablero de 3 columnas**: Nueva / En preparación / Lista. Cada tarjeta muestra
   tipo de pedido (mesa/número, para llevar, domicilio+nombre), los items con
   cantidad y sabores, y un botón para avanzar a la siguiente columna.
3. **Polling**: refresca la lista completa cada 4 segundos mientras la pantalla está
   abierta.

## Cambio en `/pos` (fase 2, pequeño ajuste)

En la lista de pedidos del turno, cuando `estadoCocina === 'lista'`, se muestra un
botón "Marcar entregado" que llama a `PUT /api/orders/:id/cocina` con
`{ estadoCocina: 'entregada' }`. Al hacerlo, el pedido desaparece del tablero de
cocina.

## Testing

Mismo patrón que fases 1 y 2: Jest + Supertest contra la API real, datos de prueba
prefijados, limpieza en `afterAll`. Cobertura mínima: cocina puede mover un pedido por
las 4 transiciones; empleado solo puede marcar `entregada` (rechaza otros valores);
`GET /api/orders` acepta también el rol `cocina`; un pedido no puede cambiar de estado
de cocina si pertenece a otra sucursal (404).

## Fuera de alcance

Notificaciones push/sonido en la pantalla de cocina, reordenar o priorizar pedidos
manualmente, tiempos estimados de preparación, impresión de comandas, inventario
(fase 6), analíticos (fase 5).
