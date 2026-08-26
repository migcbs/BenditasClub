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
