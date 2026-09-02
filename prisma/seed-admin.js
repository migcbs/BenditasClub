require('dotenv').config();
const bcrypt = require('bcryptjs');
const prisma = require('../lib/prisma');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

const INGREDIENTS = [
  { nombre: 'Alita de pollo', sku: 'POL-ALITA', unit: 'kg', costPerUnit: 92, reorderPoint: 12, xico: 22, coatepec: 18 },
  { nombre: 'Pechuga para boneless', sku: 'POL-PECH', unit: 'kg', costPerUnit: 108, reorderPoint: 10, xico: 16, coatepec: 13 },
  { nombre: 'Papa francesa', sku: 'PAP-FRA', unit: 'kg', costPerUnit: 46, reorderPoint: 15, xico: 28, coatepec: 21 },
  { nombre: 'Aceite vegetal', sku: 'ACE-VEG', unit: 'l', costPerUnit: 41, reorderPoint: 10, xico: 17, coatepec: 14 },
  { nombre: 'Salsa mango habanero', sku: 'SAL-MH', unit: 'l', costPerUnit: 84, reorderPoint: 4, xico: 3.2, coatepec: 5 },
  { nombre: 'Aderezo ranch', sku: 'ADE-RAN', unit: 'l', costPerUnit: 79, reorderPoint: 4, xico: 6, coatepec: 4.5 },
  { nombre: 'Empanizador', sku: 'SEC-EMP', unit: 'kg', costPerUnit: 53, reorderPoint: 5, xico: 8, coatepec: 7 },
  { nombre: 'Contenedor para llevar', sku: 'EMP-CTN', unit: 'pz', costPerUnit: 6.5, reorderPoint: 80, xico: 150, coatepec: 110 },
];

async function main() {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
    throw new Error('Define ADMIN_EMAIL y ADMIN_PASSWORD (mínimo 12 caracteres) para crear el acceso administrativo.');
  }
  const password = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { nombre: 'Administrador Benditas', password, role: 'admin', activo: true },
    create: { nombre: 'Administrador Benditas', email: ADMIN_EMAIL, password, role: 'admin' },
  });

  const ingredientMap = new Map();
  for (const item of INGREDIENTS) {
    const ingredient = await prisma.ingredient.upsert({
      where: { nombre: item.nombre },
      update: { sku: item.sku, unit: item.unit, costPerUnit: item.costPerUnit, reorderPoint: item.reorderPoint, activo: true },
      create: { nombre: item.nombre, sku: item.sku, unit: item.unit, costPerUnit: item.costPerUnit, reorderPoint: item.reorderPoint },
    });
    ingredientMap.set(item.nombre, ingredient);
    for (const sucursal of ['xico', 'coatepec']) {
      await prisma.locationStock.upsert({
        where: { ingredientId_sucursal: { ingredientId: ingredient.id, sucursal } },
        update: {},
        create: { ingredientId: ingredient.id, sucursal, quantity: item[sucursal] },
      });
    }
  }

  const recipes = [
    { product: '8 Alitas', items: [['Alita de pollo', .8], ['Aceite vegetal', .12], ['Salsa mango habanero', .12], ['Aderezo ranch', .06]] },
    { product: '16 Alitas', items: [['Alita de pollo', 1.6], ['Aceite vegetal', .22], ['Salsa mango habanero', .22], ['Aderezo ranch', .1]] },
    { product: 'Boneless 250g', items: [['Pechuga para boneless', .25], ['Empanizador', .08], ['Aceite vegetal', .1], ['Salsa mango habanero', .1]] },
    { product: 'Papas a la Francesa 225g', items: [['Papa francesa', .225], ['Aceite vegetal', .06]] },
  ];
  for (const definition of recipes) {
    const product = await prisma.product.findFirst({ where: { nombre: definition.product } });
    if (!product) continue;
    const recipe = await prisma.recipe.upsert({ where: { productId: product.id }, update: { yield: 1 }, create: { productId: product.id, yield: 1 } });
    await prisma.recipeItem.deleteMany({ where: { recipeId: recipe.id } });
    await prisma.recipeItem.createMany({ data: definition.items.map(([nombre, quantity]) => ({ recipeId: recipe.id, ingredientId: ingredientMap.get(nombre).id, quantity })) });
  }

  await prisma.supplier.upsert({
    where: { id: '00000000-0000-0000-0000-000000000101' },
    update: { nombre: 'Distribuidora Avícola Veracruz', activo: true },
    create: { id: '00000000-0000-0000-0000-000000000101', nombre: 'Distribuidora Avícola Veracruz', contacto: 'Ventas', telefono: '228 000 0000', paymentTerms: 'Crédito 7 días' },
  });

  console.log(`Administrador listo: ${ADMIN_EMAIL}`);
  console.log(`Contraseña local: ${ADMIN_PASSWORD}`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
