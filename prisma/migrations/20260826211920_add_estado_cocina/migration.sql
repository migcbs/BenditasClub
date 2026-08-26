-- CreateEnum
CREATE TYPE "EstadoCocina" AS ENUM ('nueva', 'en_preparacion', 'lista', 'entregada');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "estadoCocina" "EstadoCocina" NOT NULL DEFAULT 'nueva';
