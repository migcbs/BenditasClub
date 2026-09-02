# Benditas Club — Admin completo

Fecha: 2026-09-01

## Objetivo

Construir `/admin` como centro operativo y financiero de Benditas Club para Xico y Coatepec. Debe funcionar primero en celular, escalar a tablet y ofrecer una vista de escritorio completa. Todo indicador debe derivar de ventas, caja, inventario o movimientos persistidos; no se mostrarán datos ficticios como si fueran reales.

## Referencias de mercado

- **Toast:** supervisión móvil, datos en tiempo real, comparación por periodo y producto mix.
- **Lightspeed:** control multi-sucursal, reportes consolidados y por ubicación, desempeño por producto y empleado.
- **Square Restaurants:** apertura/cierre de caja, entradas/retiros y cierre de día.
- **MarketMan / Soft Restaurant:** insumos, presentaciones, recetas, costo teórico, merma, proveedores, compras y niveles mínimos.
- **Restaurant365:** relación directa entre ventas, costo de alimentos, gastos y rentabilidad.

Se excluyen nómina fiscal, conexión bancaria, contabilidad de partida doble e IA predictiva: requieren fuentes y obligaciones externas que aún no existen en el proyecto.

## Usuarios y permisos

### Administrador general

- Inicia sesión con email y contraseña.
- Accede a ambas sucursales y al consolidado.
- Gestiona usuarios, menú, recetas, inventario, compras, caja, gastos, pedidos y reportes.

### Staff

- `empleado` y `cocina` conservan sus accesos por PIN y sucursal.
- El admin crea, desactiva y regenera PIN de staff.
- Los PIN nunca regresan desde la API después de ser almacenados; solo se muestra el PIN nuevo durante la creación o regeneración.

## Arquitectura de información

1. **Inicio / Pulso del turno**
   - Ventas, pedidos, ticket promedio y comparación contra periodo anterior.
   - Estado de caja por sucursal.
   - Alertas accionables: inventario bajo, comandas demoradas, caja por cerrar, variaciones de efectivo y productos sin receta.
   - Productos más vendidos, margen estimado y ventas por hora.

2. **Operación**
   - Pedidos filtrables por sucursal, estado de pago, estado de cocina, tipo y periodo.
   - Detalle del pedido y empleado responsable.
   - Cancelaciones visibles en el historial; no se borran registros operativos.

3. **Finanzas**
   - Apertura y cierre de caja por turno y sucursal.
   - Efectivo inicial, ventas esperadas, entradas, retiros, gastos pagados en efectivo, efectivo esperado, efectivo contado y diferencia.
   - Gastos por categoría, proveedor, forma de pago y sucursal.
   - Resumen día/semana/mes/año: ventas, costo de insumos consumidos, gastos, utilidad bruta y utilidad operativa estimada.
   - Conciliación por efectivo y tarjeta. “Tarjeta” representa la terminal externa registrada, no conciliación bancaria automática.

4. **Inventario**
   - Insumos con unidad base, categoría, SKU opcional, stock actual, mínimo, máximo, costo promedio y valor.
   - Existencia independiente por sucursal.
   - Movimientos inmutables: compra/recepción, venta, merma, ajuste y transferencia.
   - Conteo físico genera un ajuste con responsable y nota.
   - Alertas de mínimo y sugerencia de compra basada en máximo menos existencia.

5. **Recetas y menú**
   - Cada producto puede tener una receta de insumos y subrecetas futuras.
   - Cantidad por ingrediente en su unidad base.
   - Costo de receta calculado desde costo promedio; margen y porcentaje de costo se recalculan automáticamente.
   - Un pedido creado descuenta ingredientes en una transacción de base de datos. Cancelar el pedido revierte el consumo una sola vez.
   - Productos sin receta siguen vendiéndose, pero aparecen como alerta y no reportan margen real.

6. **Proveedores y compras**
   - Proveedores con contacto y estado.
   - Órdenes de compra en borrador, solicitada, recibida o cancelada.
   - Recibir una compra actualiza stock y costo promedio, crea movimientos y registra el gasto/cuenta pendiente según la forma de pago.
   - Historial de precios por recepción.

7. **Equipo**
   - Lista por sucursal y rol.
   - Alta, activación/desactivación y cambio de PIN.
   - Ventas y pedidos por empleado en el periodo.

## Modelo de datos

### Inventario

- `Ingredient`: nombre, SKU, categoría, unidad base, activo.
- `LocationStock`: ingrediente + sucursal, existencia, mínimo, máximo, costo promedio.
- `Recipe`: producto, porciones/rendimiento y activo.
- `RecipeItem`: receta, ingrediente y cantidad base.
- `InventoryMovement`: sucursal, ingrediente, tipo, cantidad firmada, costo unitario, pedido/compra opcional, responsable, nota y fecha.
- `Supplier`: datos de contacto y activo.
- `PurchaseOrder` y `PurchaseOrderItem`: proveedor, sucursal, estado, cantidades y costos.

### Caja y gastos

- `CashShift`: sucursal, usuario de apertura/cierre, efectivo inicial/contado, estado y marcas de tiempo.
- `CashMovement`: turno, tipo entrada/retiro, monto, concepto y usuario.
- `Expense`: sucursal, categoría, proveedor opcional, monto, método de pago, turno opcional, nota y fecha.

### Pedidos

- `Order.inventoryAppliedAt` y `Order.inventoryRevertedAt` hacen idempotente el consumo/reversión.
- El total histórico permanece como snapshot; las recetas y costos se usan para análisis operativo, no reescriben ventas pasadas.

## API

- `POST /api/admin/login` o reutilización segura de `/api/auth/login` con validación de rol en frontend y backend.
- `GET /api/admin/dashboard?branch=&from=&to=`.
- `GET /api/admin/analytics?branch=&from=&to=`.
- CRUD administrativo de pedidos, productos, categorías y staff.
- CRUD de ingredientes, existencias, recetas, proveedores, compras y gastos.
- Acciones transaccionales: recibir compra, ajustar inventario, transferir stock, abrir/cerrar caja, entrada/retiro y regenerar PIN.
- Todas las rutas validan `admin` en servidor, entradas, sucursal y cantidades positivas.

## Diseño UX/UI

### Dirección: Control de turno

Modo Impeccable: **Operate**. El primer viewport responde “¿qué necesita mi atención ahora?”. El elemento distintivo es un rail vertical de eventos y alertas operativas que conserva identidad al cambiar de prioridad.

- MUI Material Design 3 como base de controles y accesibilidad.
- Paleta derivada del logo: fondo ciruela casi negro, rosa Benditas, ámbar cálido, marfil y colores semánticos moderados.
- Glassmorfismo limitado a app bar, selector global y navegación; las tarjetas de datos son opacas para mantener contraste.
- Tarjetas de 16–20 px de radio, números tabulares y jerarquía compacta.
- Sin gradientes, tarjetas anidadas innecesarias, títulos gigantes ni “píldoras” decorativas.
- Movimiento de 150–250 ms para cambios de estado, reordenamiento de alertas y navegación. `prefers-reduced-motion` elimina desplazamientos y parallax.
- El parallax se limita al fondo atmosférico del acceso y del encabezado; nunca afecta tablas, formularios o tareas.

### Responsive

- **Móvil:** app bar compacta, selector de sucursal/periodo, contenido de una columna y navegación inferior de cinco destinos.
- **Tablet:** rail lateral colapsable y paneles de dos columnas.
- **Escritorio:** navegación lateral persistente, barra superior y rejilla de 12 columnas; tablas completas con filtros visibles.
- Objetivos táctiles de 44 px, foco visible, estados de carga con skeletons y vacíos accionables.

## Testing

- Backend con Jest/Supertest para autorización, dashboard, inventario, recetas, compras, caja y finanzas.
- Frontend con React Testing Library para login, navegación responsive por comportamiento, formularios, estados vacíos/errores y acciones críticas.
- Cada iteración sigue RED → GREEN → REFACTOR.
- Verificación final: suites de API y UI, build de producción, detector Impeccable y capturas 390 px, tablet y 1440 px.

## Entrega por iteraciones

1. Fundaciones: esquema, autenticación admin, shell responsive y dashboard real.
2. Equipo, menú y pedidos administrativos.
3. Inventario, recetas, movimientos y consumo automático.
4. Proveedores, compras y recepción.
5. Caja, gastos, conciliación y finanzas.
6. Analíticos, alertas, endurecimiento y revisión visual.

Cada iteración debe quedar funcional, probada y sin datos de demostración persistentes.
