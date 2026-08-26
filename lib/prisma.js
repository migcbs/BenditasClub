// lib/prisma.js
// Cliente Prisma como singleton global — evita agotar el pool de conexiones
// en cold starts serverless. Mismo patrón que el proyecto hermano BOOZ.
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

if (!global.prisma) {
  global.prisma = new PrismaClient();
}

module.exports = global.prisma;
