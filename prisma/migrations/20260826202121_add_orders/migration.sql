-- CreateEnum
CREATE TYPE "TipoPedido" AS ENUM ('mesa', 'para_llevar', 'domicilio');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('pendiente', 'pagado', 'cancelado');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('tarjeta', 'efectivo');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "sucursal" "SucursalNombre" NOT NULL,
    "tipo" "TipoPedido" NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'pendiente',
    "metodoPago" "MetodoPago",
    "mesa" TEXT,
    "clienteNombre" TEXT,
    "clienteTelefono" TEXT,
    "direccion" TEXT,
    "notas" TEXT,
    "total" INTEGER NOT NULL,
    "empleadoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderItem" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "precio" INTEGER NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "sabores" TEXT[],
    "subtotal" INTEGER NOT NULL,

    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_empleadoId_fkey" FOREIGN KEY ("empleadoId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
