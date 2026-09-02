# Benditas Club

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Dueño o administrador general: opera principalmente desde celular, con una experiencia de escritorio completa para análisis y gestión prolongada.
- Empleados/meseros: toman pedidos y cobran desde celulares o tablets dentro de cada sucursal.
- Cocina: gestiona comandas desde una pantalla o tablet asignada a su sucursal.
- Clientes: hacen pedidos de comida y, en una fase posterior, administrarán su cuenta, pagos y fidelidad.

## Product Purpose

Benditas Club será la plataforma operativa y comercial de las sucursales Xico y Coatepec. Centraliza pedidos, cocina, personal, menú, inventario, caja, finanzas y analíticos para que el negocio pueda operar y tomar decisiones con datos reales.

El éxito significa que cada venta pueda seguirse desde la toma del pedido hasta su preparación, cobro, costo de ingredientes, movimiento de inventario y consolidación financiera.

## Positioning

Una plataforma propia para Benditas Club que conecta la experiencia de pedido del cliente con la operación interna del restaurante, preservando las particularidades de sus productos, sabores, sucursales y forma actual de cobro.

## Operating Context

- Dos sucursales: Xico y Coatepec.
- Personal y cocina trabajan principalmente en celulares o tablets dentro del restaurante.
- El administrador trabaja principalmente desde celular, pero necesita escritorio para reportes densos.
- Los pedidos pueden ser de mesa, para llevar o domicilio.
- Los pagos se registran como efectivo o tarjeta; la tarjeta en sucursal se procesa actualmente con una terminal física separada.
- Cocina opera con estados nueva, en preparación, lista y entregada.
- El tiempo real actual se resuelve mediante polling corto, compatible con arquitectura serverless.

## Capabilities and Constraints

- Stack existente: React, Express, Prisma y PostgreSQL en Neon.
- Roles existentes: cliente, empleado, cocina y admin.
- El administrador general accede a ambas sucursales; empleado y cocina pertenecen a una sucursal.
- El inventario se controla por ingredientes, unidades de medida y recetas. Vender un producto descuenta automáticamente sus insumos.
- Finanzas incluye apertura y cierre de caja por turno, entradas y retiros, gastos, compras a proveedores y conciliación entre efectivo, tarjeta y ventas registradas.
- Los reportes deben cubrir día, semana, mes y año, por sucursal y consolidados.
- El proyecto permanece local hasta que el usuario cree su rama de pruebas; no se despliega a GitHub sin autorización explícita.
- El panel administrativo completo se construye antes de continuar con las cuentas de cliente.

## Brand Commitments

- Nombre: Benditas Club.
- Identidad existente: irreverente, enérgica y vinculada a alitas, sabores y cultura visual del restaurante.
- El usuario pidió Material Design mediante MUI, glassmorfismo, diseño por tarjetas, animaciones y parallax.
- Las superficies operativas deben priorizar claridad y velocidad sobre decoración; el movimiento debe comunicar estado y jerarquía.

## Evidence on Hand

- Logotipo e imágenes reales en `src/assets/`.
- Menú actual migrado a Prisma/Neon mediante `prisma/seed.js`.
- Flujos reales existentes en `/pos`, `/cocina` y el pedido de comida del sitio.
- No hay testimonios, benchmarks financieros ni datos históricos suficientes que deban inventarse.

## Product Principles

1. Una venta es una sola cadena de datos: pedido, cocina, pago, inventario y finanzas deben permanecer conectados.
2. Mobile-first no significa reducido: las tareas críticas deben completarse con una mano y los análisis deben escalar al escritorio.
3. Cada sucursal conserva su operación; el administrador obtiene una vista consolidada sin perder el detalle local.
4. Los totales, costos y movimientos sensibles se calculan y validan en el servidor.
5. Cada iteración funcional debe quedar respaldada por pruebas automatizadas y una verificación visual responsive.

## Accessibility & Inclusion

- Objetivos táctiles mínimos de 44 px en superficies móviles y tablet.
- Navegación por teclado y foco visible en escritorio.
- Contraste suficiente para uso bajo iluminación variable dentro del restaurante.
- Respeto a `prefers-reduced-motion` para animaciones y parallax.
