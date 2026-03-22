// src/components/pedido/services/productoService.js
// ✅ Precios actualizados según menú PDF (Coatepec)
// ✅ Categorías completas: Boxes, Kids, Cerveza, Preparados, Aderezos
// ✅ Papas con dos tamaños (225g y 450g)

export const productosMenu = {

  // ─────────────────────────────────────────────
  // SNACKS
  // ─────────────────────────────────────────────
  Snacks: [
    { nombre: "Palomitas",       precio: 39,  isPromotion: false },
    { nombre: "Salchipulpos",    precio: 49,  isPromotion: false },
    { nombre: "Nachos",          precio: 49,  isPromotion: false },
    { nombre: "Salchipapas",     precio: 69,  isPromotion: false },
    { nombre: "Happy Nachos",    precio: 65,  isPromotion: false },
    { nombre: "Happy Papas",     precio: 69,  isPromotion: false },
    { nombre: "Nuggets",         precio: 65,  isPromotion: false },
    { nombre: "Dedos de Queso",  precio: 65,  isPromotion: false },
    { nombre: "Aros de Cebolla", precio: 65,  isPromotion: false },
    { nombre: "Galleta",         precio: 19,  isPromotion: false },
  ],

  // ─────────────────────────────────────────────
  // PAPAS (dos tamaños por tipo)
  // ─────────────────────────────────────────────
  Papas: {
    items: [
      { nombre: "Papas a la Francesa 225g", precio: 59,  maxSabores: 1, isPromotion: false },
      { nombre: "Papas a la Francesa 450g", precio: 89,  maxSabores: 1, isPromotion: false },
      { nombre: "Papas en Gajos 225g",      precio: 65,  maxSabores: 1, isPromotion: false },
      { nombre: "Papas en Gajos 450g",      precio: 95,  maxSabores: 1, isPromotion: false },
    ],
    sabores: [
      "Naturales",
      "Ajo parmesano",
      "Pimienta limón",
      "Queso parmesano",
      "Paprika",
    ],
  },

  // ─────────────────────────────────────────────
  // ALITAS
  // ─────────────────────────────────────────────
  Alitas: {
    items: [
      { nombre: "8 Alitas",   precio: 99,  maxSabores: 2, isPromotion: false },
      { nombre: "16 Alitas",  precio: 189, maxSabores: 2, isPromotion: false },
      { nombre: "24 Alitas",  precio: 279, maxSabores: 3, isPromotion: false },
      { nombre: "50 Alitas",  precio: 499, maxSabores: 5, isPromotion: false },
      { nombre: "Alita (pieza)", precio: 13, maxSabores: 1, isPromotion: false },
    ],
    sabores: [
      // Condimentadas
      "Ajo parmesano",
      "Pimienta limón",
      "Queso parmesano",
      // Dulces
      "BBQ",
      "Tamarindo",
      "Miel & mostaza",
      "Teriyaki",
      // Picantes
      "Machas",
      "Habanero",
      "Búfalo",
      "Mango habanero",
      "BBQ Habanero",
      "Tamarindo habanero",
      "Habanero parmesano",
      "Sriracha",
      "Diabla",
      "Piña chipotle",
      "Valentina",
      // Sabritas
      "Pelón Pelo Rico",
      "Takis Blue",
      "Cheetos Flamin' Hot",
      "Takis Fuego",
      "Doritos Cheddar",
      // Natural
      "Naturales",
    ],
  },

  // ─────────────────────────────────────────────
  // BONELESS
  // ─────────────────────────────────────────────
  Boneless: {
    items: [
      { nombre: "Boneless 250g", precio: 139, maxSabores: 2, isPromotion: false },
      { nombre: "Boneless 500g", precio: 259, maxSabores: 2, isPromotion: false },
      { nombre: "Boneless 1kg",  precio: 499, maxSabores: 4, isPromotion: false },
    ],
    sabores: [
      "Ajo parmesano",
      "Pimienta limón",
      "Queso parmesano",
      "BBQ",
      "Tamarindo",
      "Miel & mostaza",
      "Teriyaki",
      "Machas",
      "Habanero",
      "Búfalo",
      "Mango habanero",
      "BBQ Habanero",
      "Tamarindo habanero",
      "Habanero parmesano",
      "Sriracha",
      "Diabla",
      "Piña chipotle",
      "Valentina",
      "Pelón Pelo Rico",
      "Takis Blue",
      "Cheetos Flamin' Hot",
      "Takis Fuego",
      "Doritos Cheddar",
      "Naturales",
    ],
  },

  // ─────────────────────────────────────────────
  // PAPAS + BONELESS (combo NEW)
  // ─────────────────────────────────────────────
  "Papas + Boneless": [
    {
      nombre: "Papas + Boneless",
      precio: 139,
      isPromotion: true,
      descripcion: "225g de Papas + 150g de Boneless · Queso Cheddar & 3 salsas",
    },
  ],

  // ─────────────────────────────────────────────
  // BOXES
  // ─────────────────────────────────────────────
  Boxes: [
    {
      nombre: "Box #1",
      precio: 189,
      isPromotion: false,
      descripcion: "12 Alitas o 250g Boneless (2 sabores) + 225g Papas · 1 aderezo",
    },
    {
      nombre: "Box #2",
      precio: 389,
      isPromotion: false,
      descripcion: "30 Alitas o 650g Boneless (3 sabores) + 225g Papas · 2 aderezos",
    },
    {
      nombre: "Box #3",
      precio: 649,
      isPromotion: false,
      descripcion: "50 Alitas o 1kg Boneless (5 sabores) + Papas Francesa + Papas Gajos + Dedos de Queso · 4 aderezos",
    },
    {
      nombre: "Bendito Box",
      precio: 599,
      isPromotion: false,
      descripcion: "25 Alitas + 250g Boneless + Papas Francesa + Papas Gajos + Nachos + Dedos de Queso · 3 aderezos",
    },
    {
      nombre: "Burgy / Doggy Box",
      precio: 399,
      isPromotion: false,
      descripcion: "2 Burgys o 2 Doggys + 10 Alitas (2 sabores) + 225g Papas · 1 aderezo",
    },
    {
      nombre: "Box Club",
      precio: 299,
      isPromotion: false,
      descripcion: "5 Alitas + 5 Boneless + 4 Mini Burgys o 4 Doggys + 4 Aros + 4 Dedos + 225g Papas Francesa",
    },
  ],

  // ─────────────────────────────────────────────
  // BURGYS
  // ─────────────────────────────────────────────
  Burgys: {
    items: [
      // Originales $129
      { nombre: "Burgy Res",    precio: 129, variante: "Original", isPromotion: false },
      { nombre: "Burgy Pollo",  precio: 129, variante: "Original", isPromotion: false },
      { nombre: "Burgy West",   precio: 129, variante: "Original", isPromotion: false },
      { nombre: "Burgy Wacamole", precio: 129, variante: "Original", isPromotion: false },
      { nombre: "Burgy Cheesy",   precio: 129, variante: "Original", isPromotion: false },
      { nombre: "Bonely",         precio: 129, variante: "Original", isPromotion: false },
      // Especiales $179
      { nombre: "Burgy Mexa",     precio: 179, variante: "Especial", isPromotion: false },
      { nombre: "Burgy Tropical", precio: 179, variante: "Especial", isPromotion: true  },
      // Supremas (Res/Pollo/West) $179
      { nombre: "Burgy Res Supreme",  precio: 179, variante: "Supreme", isPromotion: false },
      { nombre: "Burgy Pollo Supreme",precio: 179, variante: "Supreme", isPromotion: false },
      { nombre: "Burgy West Supreme", precio: 179, variante: "Supreme", isPromotion: false },
    ],
    nota: "Incluyen 225g de Papas (Francesa o Gajos)",
    opcionesPapas: ["Papas a la Francesa 225g", "Papas en Gajos 225g"],
  },

  // ─────────────────────────────────────────────
  // DOGGYS
  // ─────────────────────────────────────────────
  Doggys: {
    items: [
      { nombre: "Doggy Club",     precio: 109, isPromotion: false },
      { nombre: "Doggy Original", precio: 129, isPromotion: false },
      { nombre: "Doggy Wacamole", precio: 149, isPromotion: false },
      { nombre: "Doggy Tropical", precio: 149, isPromotion: true  },
    ],
    nota: "Incluyen 225g de Papas (Francesa o Gajos). Elige: Salchicha de Res o Pavo",
    opcionesPapas: ["Papas a la Francesa 225g", "Papas en Gajos 225g"],
    opcionesSalchicha: ["Salchicha de Res", "Salchicha de Pavo"],
  },

  // ─────────────────────────────────────────────
  // PAQUETE KIDS
  // ─────────────────────────────────────────────
  "Paquete Kids": [
    {
      nombre: "Paquete Kids",
      precio: 129,
      isPromotion: false,
      descripcion: "6 Alitas, 8 Nuggets o 1 Mini Burgy + Papas a la Francesa + Jugo 200ml + Paleta Payaso Mini",
      opciones: ["6 Alitas", "8 Nuggets", "1 Mini Burgy"],
    },
  ],

  // ─────────────────────────────────────────────
  // POSTRES
  // ─────────────────────────────────────────────
  Postres: [
    { nombre: "Pan de Elote",  precio: 30, isPromotion: false },
    { nombre: "Galleta",       precio: 19, isPromotion: false },
    { nombre: "Chocoflan",     precio: 55, isPromotion: false },
    { nombre: "Elotty",        precio: 55, isPromotion: false },
    { nombre: "Bruce Cake",    precio: 55, isPromotion: false },
    { nombre: "Cookie Club",   precio: 55, isPromotion: false },
  ],

  // ─────────────────────────────────────────────
  // BEBIDAS
  // ─────────────────────────────────────────────
  Bebidas: [
    { nombre: "Agua Natural",         precio: 25, isPromotion: false },
    { nombre: "Agua de Sabor",        precio: 29, isPromotion: false, opciones: ["Horchata", "Jamaica", "Tamarindo", "Maracuyá"] },
    { nombre: "Refresco 600ml",       precio: 39, isPromotion: false },
    { nombre: "Refresco 2L",          precio: 70, isPromotion: false },
    { nombre: "Arizona",              precio: 35, isPromotion: false },
    { nombre: "Limonada Natural",     precio: 40, isPromotion: false },
    { nombre: "Limonada Mineral",     precio: 40, isPromotion: false },
    { nombre: "Naranjada Natural",    precio: 40, isPromotion: false },
    { nombre: "Naranjada Mineral",    precio: 40, isPromotion: false },
    { nombre: "Michelada S/Alcohol",  precio: 55, isPromotion: false, opciones: ["Con Clamato", "Sin Clamato"] },
  ],

  // ─────────────────────────────────────────────
  // SHAKES
  // ─────────────────────────────────────────────
  Shakes: [
    { nombre: "Malteada Chocolate",   precio: 69, isPromotion: false },
    { nombre: "Malteada Vainilla",    precio: 69, isPromotion: false },
    { nombre: "Malteada Fresa",       precio: 69, isPromotion: false },
    { nombre: "Malteada Temporada",   precio: 69, isPromotion: false },
  ],

  // ─────────────────────────────────────────────
  // VINO
  // ─────────────────────────────────────────────
  Vino: [
    { nombre: "Riunite Lambrusco 187ml", precio: 99, isPromotion: false },
  ],

  // ─────────────────────────────────────────────
  // CERVEZA
  // ─────────────────────────────────────────────
  Cerveza: {
    items: [
      { nombre: "Indio Media",    precio: 39, isPromotion: false },
      { nombre: "Indio Caguama",  precio: 75, isPromotion: false },
      { nombre: "Tecate Media",   precio: 39, isPromotion: false },
      { nombre: "Tecate Caguama", precio: 75, isPromotion: false },
      { nombre: "XX Lager Media", precio: 42, isPromotion: false },
      { nombre: "XX Lager Caguama",precio: 80, isPromotion: false },
      { nombre: "Heineken Caguama",precio: 80, isPromotion: false },
      { nombre: "Tritón 3L",      precio: 189, isPromotion: false },
      { nombre: "Tritón 5L",      precio: 299, isPromotion: false },
      { nombre: "Michelada 1L",   precio: 90, isPromotion: false, opciones: ["Con Clamato", "Sin Clamato"] },
    ],
  },

  // ─────────────────────────────────────────────
  // DRINKS
  // ─────────────────────────────────────────────
  Drinks: [
    { nombre: "Blue Drink 500ml",      precio: 55, isPromotion: false },
    { nombre: "Blue Drink 1L",         precio: 90, isPromotion: false },
    { nombre: "Pinky Drink 500ml",     precio: 55, isPromotion: false },
    { nombre: "Pinky Drink 1L",        precio: 90, isPromotion: false },
    { nombre: "Michelada en Bolsita",  precio: 55, isPromotion: false, opciones: ["Con Clamato", "Sin Clamato"] },
    { nombre: "Michelada Bolsita 1L",  precio: 90, isPromotion: false, opciones: ["Con Clamato", "Sin Clamato"] },
  ],

  // ─────────────────────────────────────────────
  // PREPARADOS (para acompañar cerveza)
  // ─────────────────────────────────────────────
  Preparados: [
    { nombre: "Preparado Chelada",          precio: 15, isPromotion: false },
    { nombre: "Preparado Michelada",        precio: 22, isPromotion: false },
    { nombre: "Preparado Con Clamato",      precio: 29, isPromotion: false },
    { nombre: "Preparado Con Tamarindo",    precio: 29, isPromotion: false },
    { nombre: "Preparado Con Mango",        precio: 29, isPromotion: false },
    { nombre: "Preparado Con Pelón Pelo Rico", precio: 29, isPromotion: false },
  ],

  // ─────────────────────────────────────────────
  // ADEREZOS EXTRA
  // ─────────────────────────────────────────────
  Aderezos: [
    { nombre: "Aderezo Ranch (2oz)",          precio: 20, isPromotion: false },
    { nombre: "Mayonesa Chipotle (2oz)",       precio: 20, isPromotion: false },
    { nombre: "Queso Amarillo (2oz)",          precio: 20, isPromotion: false },
    { nombre: "Salsa Extra (2oz)",             precio: 20, isPromotion: false },
    { nombre: "Sabor extra p/Alitas o Boneless", precio: 5, isPromotion: false },
  ],
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Lista de categorías en el orden del menú */
export const categorias = Object.keys(productosMenu);

/**
 * Devuelve el array de items de una categoría, sin importar si
 * la categoría es un array simple o un objeto con { items }.
 */
export const obtenerProductosPorCategoria = (categoria) => {
  const cat = productosMenu[categoria];
  if (!cat) return [];
  if (Array.isArray(cat)) return cat;
  if (cat.items) return cat.items;
  return [];
};

/**
 * Devuelve los sabores disponibles para una categoría que los tenga.
 */
export const obtenerSaboresPorCategoria = (categoria) => {
  const cat = productosMenu[categoria];
  if (!cat || !cat.sabores) return [];
  return cat.sabores;
};

/**
 * Devuelve cuántos sabores puede elegir un item dado su nombre y categoría.
 * Primero busca en los items de la categoría (fuente de verdad),
 * luego aplica reglas de fallback.
 */
export const getMaxSabores = (tipo, nombreItem) => {
  const cat = productosMenu[tipo];
  if (cat?.items) {
    const item = cat.items.find((i) => i.nombre === nombreItem);
    if (item?.maxSabores !== undefined) return item.maxSabores;
  }

  // Fallback por reglas generales (por si se llama con nombres legacy)
  if (tipo === "Alitas") {
    if (nombreItem?.includes("50")) return 5;
    if (nombreItem?.includes("24") || nombreItem?.includes("25")) return 3;
    return 2;
  }
  if (tipo === "Boneless") {
    if (nombreItem?.includes("1kg") || nombreItem?.includes("1 kg")) return 4;
    return 2;
  }
  if (tipo === "Papas") return 1;

  return 0;
};