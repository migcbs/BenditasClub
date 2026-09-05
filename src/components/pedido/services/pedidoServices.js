// src/components/pedido/services/pedidoService.js
// Archivo unificado — contiene helpers de cálculo Y datos del menú.
// Todos los imports deben apuntar a este archivo.

import { getProducts } from "../../../shared/staffApi";
import { customerApi } from "../../../customer/customerApi";

// Ver adminApi.js — mismo criterio: relativo en producción, localhost:3001 en dev.
const API_BASE = process.env.REACT_APP_API_BASE ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

/**
 * Datos bancarios (CLABE) de la sucursal para pago por transferencia —
 * ruta pública, editable por el admin (ver /api/admin/branch-settings).
 */
export async function getBranchSettings(sucursal) {
  const res = await fetch(`${API_BASE}/api/branch-settings/${sucursal}`);
  if (!res.ok) throw new Error("No se pudieron obtener los datos de transferencia");
  return res.json();
}

// ─────────────────────────────────────────────────────────────
// DATOS DEL MENÚ
// ─────────────────────────────────────────────────────────────

export const productosMenu = {

  Snacks: [
    { nombre: "Palomitas",       precio: 39, isPromotion: false },
    { nombre: "Salchipulpos",    precio: 49, isPromotion: false },
    { nombre: "Nachos",          precio: 49, isPromotion: false },
    { nombre: "Salchipapas",     precio: 69, isPromotion: false },
    { nombre: "Happy Nachos",    precio: 65, isPromotion: false },
    { nombre: "Happy Papas",     precio: 69, isPromotion: false },
    { nombre: "Nuggets",         precio: 65, isPromotion: false },
    { nombre: "Dedos de Queso",  precio: 65, isPromotion: false },
    { nombre: "Aros de Cebolla", precio: 65, isPromotion: false },
    { nombre: "Galleta",         precio: 19, isPromotion: false },
  ],

  Papas: {
    items: [
      { nombre: "Papas a la Francesa 225g", precio: 59,  maxSabores: 1 },
      { nombre: "Papas a la Francesa 450g", precio: 89,  maxSabores: 1 },
      { nombre: "Papas en Gajos 225g",      precio: 65,  maxSabores: 1 },
      { nombre: "Papas en Gajos 450g",      precio: 95,  maxSabores: 1 },
    ],
    sabores: ["Naturales","Ajo parmesano","Pimienta limón","Queso parmesano","Paprika"],
  },

  Alitas: {
    items: [
      { nombre: "8 Alitas",      precio: 99,  maxSabores: 2 },
      { nombre: "16 Alitas",     precio: 189, maxSabores: 2 },
      { nombre: "24 Alitas",     precio: 279, maxSabores: 3 },
      { nombre: "50 Alitas",     precio: 499, maxSabores: 5 },
      { nombre: "Alita (pieza)", precio: 13,  maxSabores: 1 },
    ],
    sabores: [
      "Ajo parmesano","Pimienta limón","Queso parmesano",
      "BBQ","Tamarindo","Miel & mostaza","Teriyaki",
      "Machas","Habanero","Búfalo","Mango habanero",
      "BBQ Habanero","Tamarindo habanero","Habanero parmesano",
      "Sriracha","Diabla","Piña chipotle","Valentina",
      "Pelón Pelo Rico","Takis Blue","Cheetos Flamin' Hot",
      "Takis Fuego","Doritos Cheddar","Naturales",
    ],
  },

  Boneless: {
    items: [
      { nombre: "Boneless 250g", precio: 139, maxSabores: 2 },
      { nombre: "Boneless 500g", precio: 259, maxSabores: 2 },
      { nombre: "Boneless 1kg",  precio: 499, maxSabores: 4 },
    ],
    sabores: [
      "Ajo parmesano","Pimienta limón","Queso parmesano",
      "BBQ","Tamarindo","Miel & mostaza","Teriyaki",
      "Machas","Habanero","Búfalo","Mango habanero",
      "BBQ Habanero","Tamarindo habanero","Habanero parmesano",
      "Sriracha","Diabla","Piña chipotle","Valentina",
      "Pelón Pelo Rico","Takis Blue","Cheetos Flamin' Hot",
      "Takis Fuego","Doritos Cheddar","Naturales",
    ],
  },

  "Papas + Boneless": [
    {
      nombre: "Papas + Boneless",
      precio: 139,
      isPromotion: true,
      descripcion: "225g Papas + 150g Boneless · Queso Cheddar & 3 salsas",
    },
  ],

  Boxes: [
    { nombre: "Box #1",          precio: 189, descripcion: "12 Alitas O 250g Boneless (2 sabores) + 225g Papas · 1 aderezo" },
    { nombre: "Box #2",          precio: 389, descripcion: "30 Alitas O 650g Boneless (3 sabores) + 225g Papas · 2 aderezos" },
    { nombre: "Box #3",          precio: 649, descripcion: "50 Alitas O 1kg Boneless (5 sabores) + Papas Francesa + Papas Gajos + Dedos de Queso · 4 aderezos" },
    { nombre: "Bendito Box",     precio: 599, descripcion: "25 Alitas + 250g Boneless + Papas Francesa + Papas Gajos + Nachos + Dedos de Queso · 3 aderezos" },
    { nombre: "Burgy / Doggy Box",precio: 399, descripcion: "2 Burgys o 2 Doggys + 10 Alitas (2 sabores) + 225g Papas · 1 aderezo" },
    { nombre: "Box Club",        precio: 299, descripcion: "5 Alitas + 5 Boneless + 4 Mini Burgys o 4 Doggys + 4 Aros + 4 Dedos + 225g Papas Francesa" },
  ],

  Burgys: {
    items: [
      { nombre: "Burgy Res",           precio: 129 },
      { nombre: "Burgy Pollo",          precio: 129 },
      { nombre: "Burgy West",           precio: 129 },
      { nombre: "Burgy Wacamole",       precio: 129 },
      { nombre: "Burgy Cheesy",         precio: 129 },
      { nombre: "Bonely",               precio: 129 },
      { nombre: "Burgy Mexa",           precio: 179 },
      { nombre: "Burgy Tropical",       precio: 179, isPromotion: true },
      { nombre: "Burgy Res Supreme",    precio: 179 },
      { nombre: "Burgy Pollo Supreme",  precio: 179 },
      { nombre: "Burgy West Supreme",   precio: 179 },
    ],
    nota: "Incluyen 225g de Papas (Francesa o Gajos)",
  },

  Doggys: {
    items: [
      { nombre: "Doggy Club",     precio: 109, descripcion: "3 Hot dogs · sin papas extra" },
      { nombre: "Doggy Original", precio: 129 },
      { nombre: "Doggy Wacamole", precio: 149 },
      { nombre: "Doggy Tropical", precio: 149, isPromotion: true },
    ],
    nota: "Incluyen 225g de Papas. Elige: Salchicha de Res o Pavo",
  },

  "Paquete Kids": [
    {
      nombre: "Paquete Kids",
      precio: 129,
      descripcion: "Elige: 6 Alitas, 8 Nuggets o 1 Mini Burgy + Papas + Jugo + Paleta",
    },
  ],

  Postres: [
    { nombre: "Pan de Elote", precio: 30 },
    { nombre: "Galleta",      precio: 19 },
    { nombre: "Chocoflan",    precio: 55 },
    { nombre: "Elotty",       precio: 55 },
    { nombre: "Bruce Cake",   precio: 55 },
    { nombre: "Cookie Club",  precio: 55 },
  ],

  Bebidas: [
    { nombre: "Agua Natural",      precio: 25 },
    { nombre: "Agua de Sabor",     precio: 29, opciones: ["Horchata","Jamaica","Tamarindo","Maracuyá"] },
    { nombre: "Refresco 600ml",    precio: 39 },
    { nombre: "Refresco 2L",       precio: 70 },
    { nombre: "Arizona",           precio: 35 },
    { nombre: "Limonada Natural",  precio: 40 },
    { nombre: "Limonada Mineral",  precio: 40 },
    { nombre: "Naranjada Natural", precio: 40 },
    { nombre: "Naranjada Mineral", precio: 40 },
    { nombre: "Michelada S/Alcohol", precio: 55, opciones: ["Con Clamato","Sin Clamato"] },
  ],

  Shakes: [
    { nombre: "Malteada Chocolate", precio: 69 },
    { nombre: "Malteada Vainilla",  precio: 69 },
    { nombre: "Malteada Fresa",     precio: 69 },
    { nombre: "Malteada Temporada", precio: 69 },
  ],

  Vino: [
    { nombre: "Riunite Lambrusco 187ml", precio: 99 },
  ],

  Cerveza: {
    items: [
      { nombre: "Indio Media",      precio: 39  },
      { nombre: "Indio Caguama",    precio: 75  },
      { nombre: "Tecate Media",     precio: 39  },
      { nombre: "Tecate Caguama",   precio: 75  },
      { nombre: "XX Lager Media",   precio: 42  },
      { nombre: "XX Lager Caguama", precio: 80  },
      { nombre: "Heineken Caguama", precio: 80  },
      { nombre: "Tritón 3L",        precio: 189 },
      { nombre: "Tritón 5L",        precio: 299 },
      { nombre: "Michelada 1L",     precio: 90, opciones: ["Con Clamato","Sin Clamato"] },
    ],
  },

  Drinks: [
    { nombre: "Blue Drink 500ml",          precio: 55 },
    { nombre: "Blue Drink 1L",             precio: 90 },
    { nombre: "Pinky Drink 500ml",         precio: 55 },
    { nombre: "Pinky Drink 1L",            precio: 90 },
    { nombre: "Michelada en Bolsita 500ml",precio: 55, opciones: ["Con Clamato","Sin Clamato"] },
    { nombre: "Michelada en Bolsita 1L",   precio: 90, opciones: ["Con Clamato","Sin Clamato"] },
  ],

  Preparados: [
    { nombre: "Preparado Chelada",              precio: 15 },
    { nombre: "Preparado Michelada",            precio: 22 },
    { nombre: "Preparado Con Clamato",          precio: 29 },
    { nombre: "Preparado Con Tamarindo",        precio: 29 },
    { nombre: "Preparado Con Mango",            precio: 29 },
    { nombre: "Preparado Con Pelón Pelo Rico",  precio: 29 },
  ],

  Aderezos: [
    { nombre: "Aderezo Ranch (2oz)",           precio: 20 },
    { nombre: "Mayonesa Chipotle (2oz)",        precio: 20 },
    { nombre: "Queso Amarillo (2oz)",           precio: 20 },
    { nombre: "Salsa Extra (2oz)",              precio: 20 },
    { nombre: "Sabor extra Alitas o Boneless",  precio:  5 },
  ],
};

// ─────────────────────────────────────────────────────────────
// HELPERS DEL MENÚ
// ─────────────────────────────────────────────────────────────

export const categorias = Object.keys(productosMenu);

export const obtenerProductosPorCategoria = (categoria) => {
  const cat = productosMenu[categoria];
  if (!cat) return [];
  if (Array.isArray(cat)) return cat;
  if (cat.items) return cat.items;
  return [];
};

export const obtenerSaboresPorCategoria = (categoria) => {
  const cat = productosMenu[categoria];
  if (!cat?.sabores) return [];
  return cat.sabores;
};

export const getMaxSabores = (tipo, nombreItem) => {
  const cat = productosMenu[tipo];
  if (cat?.items) {
    const item = cat.items.find(i => i.nombre === nombreItem);
    if (item?.maxSabores !== undefined) return item.maxSabores;
  }
  if (tipo === "Alitas") {
    if (nombreItem?.includes("50")) return 5;
    if (nombreItem?.includes("24") || nombreItem?.includes("25")) return 3;
    return 2;
  }
  if (tipo === "Boneless") return nombreItem?.includes("1kg") ? 4 : 2;
  if (tipo === "Papas") return 1;
  return 0;
};

// ─────────────────────────────────────────────────────────────
// HELPERS DE CÁLCULO
// ─────────────────────────────────────────────────────────────

/**
 * Calcula el subtotal de un item incluyendo configurables.
 * Fuente única de verdad — no duplicar esta lógica.
 */
export const calcularSubtotalItem = (item) => {
  let precio = item.precio || 0;
  if (item.configurables) {
    item.configurables.forEach(c => {
      if (c.precio) precio += c.precio;
    });
  }
  return precio * (item.cantidad || 1);
};

/**
 * Calcula el subtotal de todo el carrito.
 */
export const calcularSubtotal = (carrito = []) => {
  return carrito.reduce((acc, item) => acc + calcularSubtotalItem(item), 0);
};

/**
 * Total con costo de envío.
 */
export const calcularTotalConEnvio = (carrito = [], costoEnvio = 0) => {
  return calcularSubtotal(carrito) + costoEnvio;
};

/**
 * Compone el string de dirección que consumen WhatsApp/ticket/comandas a
 * partir de los campos sueltos (Calle, Número, Colonia y referencias,
 * Código postal) — espejo exacto de componerDireccion() en index.js, para
 * que el cliente vea de inmediato el mismo texto que se va a guardar.
 */
export const componerDireccion = ({ calle, numero, colonia, referencias, codigoPostal } = {}) => {
  const calleNumero = [calle?.trim(), numero?.trim()].filter(Boolean).join(' #');
  const partes = [calleNumero, colonia?.trim(), codigoPostal?.trim() ? `CP ${codigoPostal.trim()}` : ''].filter(Boolean);
  let texto = partes.join(', ');
  if (referencias?.trim()) texto += (texto ? ' — ' : '') + `Ref: ${referencias.trim()}`;
  return texto;
};

/**
 * Estimado de envío por código postal — sin geocodificación, ver
 * server/delivery.js. Público, sin auth.
 */
export async function getDeliveryFee(sucursal, codigoPostal) {
  const res = await fetch(`${API_BASE}/api/delivery-zones/${sucursal}/${encodeURIComponent(codigoPostal)}`);
  if (!res.ok) throw new Error('No se pudo estimar el costo de envío');
  return res.json();
}

/**
 * Formatea número como moneda MXN.
 */
export const formatearMoneda = (cantidad = 0) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(cantidad);
};

// ─────────────────────────────────────────────────────────────
// GUARDAR PEDIDO EN LA CUENTA (además del envío por WhatsApp)
// ─────────────────────────────────────────────────────────────

/**
 * Además de mandar el pedido por WhatsApp, lo registra en el sistema
 * (pasa primero por la cola de Recepción del POS antes de llegar a cocina —
 * ver PUT /api/orders/:id/recepcion) — con o sin cuenta de cliente. Si hay
 * sesión iniciada (`bc_customer_token`) el pedido queda ligado a esa cuenta;
 * si es invitado, se guarda con el nombre/teléfono que ya capturó el popup
 * (mismos datos que usa el mensaje de WhatsApp).
 *
 * Es "best effort": nunca debe bloquear ni afectar el envío por WhatsApp,
 * que sigue siendo el camino principal. Si algo falla (un producto del
 * carrito no coincide con el catálogo real, no hay conexión, etc.) solo se
 * registra una advertencia en consola.
 */
export async function guardarPedidoEnCuenta(cliente, carrito) {
  const token = typeof window !== "undefined" && window.localStorage.getItem("bc_customer_token");
  if (!cliente?.sucursal || !carrito?.length) return;

  try {
    const productos = await getProducts();
    const items = [];
    for (const item of carrito) {
      const producto = productos.find((p) => p.activo && p.nombre === item.nombre);
      if (!producto) {
        console.warn(`No se pudo vincular "${item.nombre}" a un producto del catálogo — el pedido no se guardó en el sistema (el envío por WhatsApp no se vio afectado).`);
        return;
      }
      const sabores = [
        ...(item.configurables || []).flatMap((c) => (c.sabores?.length ? c.sabores : c.opcion ? [c.opcion] : [])),
        ...(item.opcionElegida ? [item.opcionElegida] : []),
      ];
      items.push({ productId: producto.id, cantidad: item.cantidad || 1, sabores });
    }

    await customerApi.createOrder({
      sucursal: cliente.sucursal,
      tipo: cliente.tipoPedido === "domicilio" ? "domicilio" : "para_llevar",
      direccion: cliente.tipoPedido === "domicilio" ? cliente.direccion : undefined,
      codigoPostal: cliente.tipoPedido === "domicilio" ? cliente.codigoPostal : undefined,
      notas: cliente.comentarios || undefined,
      nombre: cliente.nombre,
      telefono: cliente.telefono,
      items,
    }, token || undefined);
  } catch (error) {
    console.warn("No se pudo registrar el pedido en el sistema (el envío por WhatsApp no se vio afectado):", error.message);
  }
}