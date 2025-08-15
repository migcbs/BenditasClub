import { useState } from "react";
import "../Styles.css";

// Componente para el icono de flecha, reutilizable y con animación
const ChevronIcon = ({ isOpen, size = 24, color = '#e78fbb' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{
      transition: 'transform 0.3s ease',
      transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
      marginRight: '8px',
      minWidth: size,
      minHeight: size,
    }}
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

const productosMenu = {
    Snacks: [
      { nombre: "Salchipulpos", precio: 30, isPromotion: false },
      { nombre: "Salchipapas", precio: 45, isPromotion: false },
      { nombre: "Happy Papas", precio: 60, isPromotion: false },
      { nombre: "Nachos", precio: 35, isPromotion: false },
      { nombre: "Happy Nachos", precio: 60, isPromotion: false },
      { nombre: "Nuggets", precio: 50, isPromotion: false },
      { nombre: "Dedos de Queso", precio: 50, isPromotion: false },
      { nombre: "Aros de Cebolla", precio: 50, isPromotion: false },
    ],
    Papas: {
      items: [
        { nombre: "Papas a la Francesa", precio: 35, maxSabores: 1, isPromotion: false },
        { nombre: "Papas en Gajo", precio: 40, maxSabores: 1, isPromotion: false },
      ],
      sabores: [
        "Ajo parmesano", "Pimienta limón", "Queso parmesano", "Paprika", "Naturales",
      ],
    },
    Alitas: {
      items: [
        { nombre: "8pzs (2 sabores)", precio: 72, maxSabores: 2, isPromotion: false },
        { nombre: "16pzs (2 sabores)", precio: 139, maxSabores: 2, isPromotion: false },
        { nombre: "25pzs (3 sabores)", precio: 209, maxSabores: 3, isPromotion: false },
        { nombre: "50pzs (5 sabores)", precio: 399, maxSabores: 5, isPromotion: false },
      ],
      sabores: [
        "Ajo parmesano", "Pimienta limón", "Queso parmesano", "BBQ",
        "Tamarindo", "Miel & mostaza", "Teriyaki", "Machas", "Habanero",
        "Búfalo", "Mango habanero", "Tamarindo habanero", "Habanero parmesano",
        "Sriracha", "Diabla", "Piña chipotle", "Valentina", "Pelón Pelo Rico",
        "Takis Blue", "Cheetos Flamin’ Hot", "Takis Fuego", "Doritos Cheddar",
        "Naturales"
      ],
    },
    Boneless: {
      items: [
        { nombre: "250g", precio: 99, maxSabores: 2, isPromotion: false },
        { nombre: "500g", precio: 189, maxSabores: 2, isPromotion: false },
        { nombre: "1kg", precio: 369, maxSabores: 4, isPromotion: false },
      ],
      sabores: [
        "Ajo parmesano", "Pimienta limón", "Queso parmesano", "BBQ",
        "Tamarindo", "Miel & mostaza", "Teriyaki", "Machas", "Habanero",
        "Búfalo", "Mango habanero", "Tamarindo habanero", "Habanero parmesano",
        "Sriracha", "Diabla", "Piña chipotle", "Valentina", "Pelón Pelo Rico",
        "Takis Blue", "Cheetos Flamin’ Hot", "Takis Fuego", "Doritos Cheddar",
        "Naturales"
      ],
    },
    Burgys: [
      {
        nombre: "Burgy Res",
        precio: 89,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
      {
        nombre: "Burgy Pollo",
        precio: 89,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
      {
        nombre: "Burgy West",
        precio: 89,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
      {
        nombre: "Bonely",
        precio: 89,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
      {
        nombre: "Burgy Mexa",
        precio: 109,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
      {
        nombre: "Burgy Cheesy",
        precio: 109,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
      {
        nombre: "Mega Res",
        precio: 109,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
      {
        nombre: "Mega Pollo",
        precio: 109,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
      {
        nombre: "Mega West",
        precio: 109,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
    ],
    Doggys: [
      {
        nombre: "Doggy Club",
        precio: 99,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
      {
        nombre: "Doggy",
        precio: 89,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
      {
        nombre: "Doggy Wacamole",
        precio: 109,
        isPromotion: false,
        configurableItems: [
          {
            type: "Papas",
            quantity: "Papas",
            maxSabores: 1,
            isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre),
          },
        ],
      },
    ],
    "Paquetes de Alitas": [
      {
        nombre: "Paquete 1 Alitas (12 alitas + papas)",
        precio: 139,
        isPromotion: false,
        configurableItems: [
          { type: "Alitas", quantity: "12pzs", maxSabores: 2 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
        ],
      },
      {
        nombre: "Paquete 2 Alitas (30 alitas + papas)",
        precio: 289,
        isPromotion: false,
        configurableItems: [
          { type: "Alitas", quantity: "30pzs", maxSabores: 3 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
        ],
      },
      {
        nombre: "Paquete 3 Alitas (50 alitas + papas + dedos de queso)",
        precio: 499,
        isPromotion: false,
        configurableItems: [
          { type: "Alitas", quantity: "50pzs", maxSabores: 5 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
        ],
      },
    ],
    "Paquetes de Boneless": [
      {
        nombre: "Paquete 1 Boneless (250gr + papas)",
        precio: 129,
        isPromotion: false,
        configurableItems: [
          { type: "Boneless", quantity: "250g", maxSabores: 2 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
        ],
      },
      {
        nombre: "Paquete 2 Boneless (500gr + papas)",
        precio: 219,
        isPromotion: false,
        configurableItems: [
          { type: "Boneless", quantity: "500g", maxSabores: 2 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
        ],
      },
      {
        nombre: "Paquete 3 Boneless (1.5kg + papas + dedos de queso)",
        precio: 649,
        isPromotion: false,
        configurableItems: [
          { type: "Boneless", quantity: "1.5kg", maxSabores: 4 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
        ],
      },
    ],
    Boxes: [
      {
        nombre: "Paquete Kids (Escoge 8 Nuggets, 6 Alitas o Mini Burgy)",
        precio: 99,
        isPromotion: false,
        description: "Incluye: Papas a la Francesa (1 sabor), Jugo de Naranja y Paleta Payaso Mini.",
        configurableItems: [
          { type: "KidsMainOption", quantity: "Option", options: ["8 Nuggets", "6 Alitas", "Mini Burgy"] },
          {
            type: "Papas",
            quantity: "Papas a la Francesa",
            maxSabores: 1,
            isGeneric: true,
            options: () => ["Papas a la Francesa"]
          },
        ],
      },
      {
        nombre: "Boneless Box (500gr boneless + papas + dedos de queso + aros cebolla)",
        precio: 349,
        isPromotion: false,
        configurableItems: [
          { type: "Boneless", quantity: "500g", maxSabores: 2 },
          {
            type: "Papas",
            quantity: "Papas a la Francesa",
            maxSabores: 1,
            isGeneric: true,
            options: () => ["Papas a la Francesa"]
          },
          {
            type: "Papas",
            quantity: "Papas en Gajo",
            maxSabores: 1,
            isGeneric: true,
            options: () => ["Papas en Gajo"]
          },
        ],
      },
      {
        nombre: "Box Club (5 alitas + 5 boneless + 4 mini burgys + 4 aros cebolla + 4 dedos queso + papas)",
        precio: 249,
        isPromotion: false,
        configurableItems: [
          { type: "Alitas", quantity: "5pzs", maxSabores: 1 },
          { type: "Boneless", quantity: "5pzs", maxSabores: 1 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
        ],
      },
      {
        nombre: "Bendito Box (35 alitas + nuggets + papas + dedos queso + nachos)",
        precio: 469,
        isPromotion: false,
        configurableItems: [
          { type: "Alitas", quantity: "35pzs", maxSabores: 3 },
          {
            type: "Papas",
            quantity: "Papas a la Francesa",
            maxSabores: 1,
            isGeneric: true,
            options: () => ["Papas a la Francesa"]
          },
          {
            type: "Papas",
            quantity: "Papas en Gajo",
            maxSabores: 1,
            isGeneric: true,
            options: () => ["Papas en Gajo"]
          },
        ],
      },
      {
        nombre: "Burgy/Doggy Box (2 burgy/doggy + 10 alitas + 250gr papas)",
        precio: 289,
        isPromotion: false,
        configurableItems: [
          { type: "Alitas", quantity: "10pzs", maxSabores: 2 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
        ],
      },
    ],
    Postres: [
      { nombre: "Pan de Elote", precio: 30, isPromotion: false },
      { nombre: "Chocoflan", precio: 40, isPromotion: false },
      { nombre: "Elotty", precio: 50, isPromotion: false },
      { nombre: "Bruce Cake", precio: 50, isPromotion: false },
      { nombre: "Cookie Club", precio: 50, isPromotion: false },
    ],
    Promociones: [
      {
        nombre: "Lunes: 10 Alitas + Papas + Bebida",
        precio: 149,
        dia: "Lunes",
        isPromotion: true,
        configurableItems: [
          { type: "Alitas", quantity: "10pzs", maxSabores: 2 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
          { type: "Bebida", quantity: "Bebida", options: ["Agua de Jamaica", "Agua de Horchata", "Agua de Tamarindo", "Refresco", "Limonada Natural", "Limonada Mineral", "Naranjada Natural", "Naranjada Mineral"] }
        ],
      },
      {
        nombre: "Martes: 10% Descuento BURGY & DOGGY",
        precio: 0,
        dia: "Martes",
        isPromotion: true,
        isDiscount: true,
        description: "Compra un DOGGY o BURGY y llévate un SHAKE por solo $49 (se aplica en tienda)",
      },
      {
        nombre: "Miércoles: 250gr Boneless + Papas + Bebida",
        precio: 159,
        dia: "Miércoles",
        isPromotion: true,
        configurableItems: [
          { type: "Boneless", quantity: "250g", maxSabores: 2 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
          { type: "Bebida", quantity: "Bebida", options: ["Agua de Jamaica", "Agua de Horchata", "Agua de Tamarindo", "Refresco", "Limonada Natural", "Limonada Mineral", "Naranjada Natural", "Naranjada Mineral"] }
        ],
      },
      {
        nombre: "Jueves: 10% Descuento en cualquier BOX FAMILIAR",
        precio: 0,
        dia: "Jueves",
        isPromotion: true,
        isDiscount: true,
      },
      {
        nombre: "Viernes: MICHELADA 1 LITRO $70",
        precio: 70,
        dia: "Viernes",
        isPromotion: true,
        options: ["Con Clamato", "Sin Clamato"],
        beerOptions: ["Indio", "Tecate", "XX lager"],
        isSpecialOffer: true,
      },
      {
        nombre: "Viernes: HAPPY HOUR DE SNACKS",
        precio: 0,
        dia: "Viernes",
        isPromotion: true,
        isDiscount: true,
        timeSensitive: true,
        description: "10% DESCUENTO de 3pm a 5pm",
      },
      {
        nombre: "Sábado: 20 Alitas + 2 Bebidas",
        precio: 209,
        dia: "Sábado",
        isPromotion: true,
        configurableItems: [
          { type: "Alitas", quantity: "20pzs", maxSabores: 2 },
          { type: "Bebida", quantity: "2 Bebidas", options: ["Agua de Jamaica", "Agua de Horchata", "Agua de Tamarindo", "Refresco"] }
        ],
      },
      {
        nombre: "Sábado: 30 Alitas + Papas + Refresco 2L",
        precio: 329,
        dia: "Sábado",
        isPromotion: true,
        configurableItems: [
          { type: "Alitas", quantity: "30pzs", maxSabores: 3 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
          { type: "Bebida", quantity: "Refresco 2L", options: ["Coca Cola", "Pepsi", "Sprite", "Fanta"] }
        ],
      },
    ],
    Bebidas: [
      { nombre: "Agua Natural", precio: 20, isPromotion: false },
      { nombre: "Agua de Jamaica", precio: 25, isPromotion: false },
      { nombre: "Agua de Horchata", precio: 25, isPromotion: false },
      { nombre: "Agua de Tamarindo", precio: 25, isPromotion: false },
      { nombre: "Agua de Maracuya", precio: 25, isPromotion: false },
      { nombre: "Refresco", precio: 30, isPromotion: false },
      { nombre: "Limonada Natural", precio: 30, isPromotion: false },
      { nombre: "Limonada Mineral", precio: 35, isPromotion: false },
      { nombre: "Naranjada Natural", precio: 30, isPromotion: false },
      { nombre: "Naranjada Mineral", precio: 35, isPromotion: false },
      { nombre: "Michelada Sin Alcohol", precio: 40, isPromotion: false },
    ],
    "Shakes (Malteadas)": [
      { nombre: "Malteada de Chocolate", precio: 55, isPromotion: false },
      { nombre: "Malteada de Fresa", precio: 55, isPromotion: false },
      { nombre: "Malteada de Vainilla", precio: 55, isPromotion: false },
      { nombre: "Malteada de Temporada", precio: 60, isPromotion: false },
    ],
    "Vino(187ml)": [
      { nombre: "Riunite Lambrussco", precio: 89, isPromotion: false },
    ],
    Drinks: [
      { nombre: "Michelada 1L", precio: 80, options: ["Con Clamato", "Sin Clamato"], beerOptions: ["Indio", "Tecate", "XX lager"], isPromotion: false },
      { nombre: "Michelada 500ml", precio: 50, options: ["Con Clamato", "Sin Clamato"], beerOptions: ["Indio", "Tecate", "XX lager"], isPromotion: false },
      { nombre: "Blue Drink 1L", precio: 80, isPromotion: false },
      { nombre: "Blue Drink 500ml", precio: 50, isPromotion: false },
      { nombre: "Pinky Drink 1L", precio: 80, isPromotion: false },
      { nombre: "Pinky Drink 500ml", precio: 50, isPromotion: false },
    ],
};

const PedidoPopup = ({ onClose }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    nombre: "",
    telefono: "",
    direccion: "",
    sucursal: "domicilio",
    tienda: "xico",
    productos: [],
    comentario: "",
  });

  const [seleccion, setSeleccion] = useState({
    alitasPiezas: "",
    alitasSabores: [],
    bonelessGramaje: "",
    bonelessSabores: [],
    papasPiezas: "",
    papasSabores: [],
    'Paquete 1 Alitas (12 alitas + papas)_alitasSabores': [],
    'Paquete 1 Alitas (12 alitas + papas)_papasTipo': '',
    'Paquete 1 Alitas (12 alitas + papas)_papasSabores': [],
    'Paquete 2 Alitas (30 alitas + papas)_alitasSabores': [],
    'Paquete 2 Alitas (30 alitas + papas)_papasTipo': '',
    'Paquete 2 Alitas (30 alitas + papas)_papasSabores': [],
    'Paquete 3 Alitas (50 alitas + papas + dedos de queso)_alitasSabores': [],
    'Paquete 3 Alitas (50 alitas + papas + dedos de queso)_papasTipo': '',
    'Paquete 3 Alitas (50 alitas + papas + dedos de queso)_papasSabores': [],
    'Paquete 1 Boneless (250gr + papas)_bonelessSabores': [],
    'Paquete 1 Boneless (250gr + papas)_papasTipo': '',
    'Paquete 1 Boneless (250gr + papas)_papasSabores': [],
    'Paquete 2 Boneless (500gr + papas)_bonelessSabores': [],
    'Paquete 2 Boneless (500gr + papas)_papasTipo': '',
    'Paquete 2 Boneless (500gr + papas)_papasSabores': [],
    'Paquete 3 Boneless (1.5kg + papas + dedos de queso)_bonelessSabores': [],
    'Paquete 3 Boneless (1.5kg + papas + dedos de queso)_papasTipo': '',
    'Paquete 3 Boneless (1.5kg + papas + dedos de queso)_papasSabores': [],
    'Boneless Box (500gr boneless + papas + dedos de queso + aros cebolla)_bonelessSabores': [],
    'Boneless Box (500gr boneless + papas + dedos de queso + aros cebolla)_papasFrancesaSabores': [],
    'Boneless Box (500gr boneless + papas + dedos de queso + aros cebolla)_papasGajoSabores': [],
    'Box Club (5 alitas + 5 boneless + 4 mini burgys + 4 aros cebolla + 4 dedos queso + papas)_alitasSabores': [],
    'Box Club (5 alitas + 5 boneless + 4 mini burgys + 4 aros cebolla + 4 dedos queso + papas)_bonelessSabores': [],
    'Box Club (5 alitas + 5 boneless + 4 mini burgys + 4 aros cebolla + 4 dedos queso + papas)_papasTipo': '',
    'Box Club (5 alitas + 5 boneless + 4 mini burgys + 4 aros cebolla + 4 dedos queso + papas)_papasSabores': [],
    'Bendito Box (35 alitas + nuggets + papas + dedos queso + nachos)_alitasSabores': [],
    'Bendito Box (35 alitas + nuggets + papas + dedos queso + nachos)_papasFrancesaSabores': [],
    'Bendito Box (35 alitas + nuggets + papas + dedos queso + nachos)_papasGajoSabores': [],
    'Burgy/Doggy Box (2 burgy/doggy + 10 alitas + 250gr papas)_alitasSabores': [],
    'Burgy/Doggy Box (2 burgy/doggy + 10 alitas + 250gr papas)_papasTipo': '',
    'Burgy/Doggy Box (2 burgy/doggy + 10 alitas + 250gr papas)_papasSabores': [],
    'Lunes: 10 Alitas + Papas + Bebida_alitasSabores': [],
    'Lunes: 10 Alitas + Papas + Bebida_papasTipo': '',
    'Lunes: 10 Alitas + Papas + Bebida_papasSabores': [],
    'Lunes: 10 Alitas + Papas + Bebida_bebidaBebida': [],
    'Miércoles: 250gr Boneless + Papas + Bebida_bonelessSabores': [],
    'Miércoles: 250gr Boneless + Papas + Bebida_papasTipo': '',
    'Miércoles: 250gr Boneless + Papas + Bebida_papasSabores': [],
    'Miércoles: 250gr Boneless + Papas + Bebida_bebidaBebida': [],
    'Sábado: 20 Alitas + 2 Bebidas_alitasSabores': [],
    'Sábado: 20 Alitas + 2 Bebidas_bebidaBebida': [],
    'Sábado: 30 Alitas + Papas + Refresco 2L_alitasSabores': [],
    'Sábado: 30 Alitas + Papas + Refresco 2L_papasTipo': '',
    'Sábado: 30 Alitas + Papas + Refresco 2L_papasSabores': [],
    'Sábado: 30 Alitas + Papas + Refresco 2L_bebidaBebida': [],
    'Paquete Kids (Escoge 8 Nuggets, 6 Alitas o Mini Burgy)_kidsMainOption': '',
    'Paquete Kids (Escoge 8 Nuggets, 6 Alitas o Mini Burgy)_papasTipo': '',
    'Paquete Kids (Escoge 8 Nuggets, 6 Alitas o Mini Burgy)_papasSabores': [],
    'Burgy Res_papasTipo': '',
    'Burgy Res_papasSabores': [],
    'Burgy Pollo_papasTipo': '',
    'Burgy Pollo_papasSabores': [],
    'Burgy West_papasTipo': '',
    'Burgy West_papasSabores': [],
    'Bonely_papasTipo': '',
    'Bonely_papasSabores': [],
    'Burgy Mexa_papasTipo': '',
    'Burgy Mexa_papasSabores': [],
    'Burgy Cheesy_papasTipo': '',
    'Burgy Cheesy_papasSabores': [],
    'Mega Res_papasTipo': '',
    'Mega Res_papasSabores': [],
    'Mega Pollo_papasTipo': '',
    'Mega Pollo_papasSabores': [],
    'Mega West_papasTipo': '',
    'Mega West_papasSabores': [],
    'Doggy Club_papasTipo': '',
    'Doggy Club_papasSabores': [],
    'Doggy_papasTipo': '',
    'Doggy_papasSabores': [],
    'Doggy Wacamole_papasTipo': '',
    'Doggy Wacamole_papasSabores': [],
  });

  const [activeCategory, setActiveCategory] = useState(null);
  const [activePackage, setActivePackage] = useState(null);

  const [ordenId] = useState(Math.floor(Math.random() * 100000));
  const [errors, setErrors] = useState({});

  const [micheladaClamatoOption, setMicheladaClamatoOption] = useState({});
  const [micheladaBeerOption, setMicheladaBeerOption] = useState({});
  const [micheladaPromoClamatoOption, setMicheladaPromoClamatoOption] = useState({});
  const [micheladaPromoBeerOption, setMicheladaPromoBeerOption] = useState({});


  const orderedCategories = [
    "Snacks", "Papas", "Alitas", "Boneless",
    "Paquetes de Alitas", "Paquetes de Boneless", "Boxes",
    "Promociones",
    "Burgys", "Doggys", "Postres",
    "Bebidas", "Shakes (Malteadas)", "Vino(187ml)", "Drinks"
  ];

  const getDayName = (date) => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[date.getDay()];
  };

  const currentDay = getDayName(new Date());

  const getMaxSabores = (type, quantity) => {
    if (type === "Alitas" && productosMenu.Alitas.items) {
      const item = productosMenu.Alitas.items.find(i => i.nombre === quantity);
      if (item) return item.maxSabores;
    }
    if (type === "Boneless" && productosMenu.Boneless.items) {
      const item = productosMenu.Boneless.items.find(i => i.nombre === quantity);
      if (item) return item.maxSabores;
    }
    if (type === "Papas" && productosMenu.Papas.items) {
      const item = productosMenu.Papas.items.find(i => i.nombre === quantity);
      if (item) return item.maxSabores;
    }
    if (type === "Papas" && quantity === "Papas a la Francesa") {
      return 1;
    }
    if (type === "Papas" && quantity === "Papas en Gajo") {
      return 1;
    }
    if (type === "Alitas") {
        if (quantity.includes("8pzs") || quantity.includes("16pzs") || quantity.includes("12pzs") || quantity.includes("10pzs") || quantity.includes("20pzs") || quantity.includes("6 Alitas")) return 2;
        if (quantity.includes("25pzs") || quantity.includes("30pzs") || quantity.includes("35pzs")) return 3;
        if (quantity.includes("50pzs")) return 5;
        if (quantity.includes("5pzs")) return 1;
    }
    if (type === "Boneless") {
        if (quantity.includes("250g") || quantity.includes("500g") || quantity.includes("5pzs")) return 2;
        if (quantity.includes("1kg") || quantity.includes("1.5kg")) return 4;
    }
    if (type === "Papas") {
        return 1;
    }
    return 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSeleccionChange = (itemType, tipo, valor, parentProductName = null, configurableItemIndex = null) => {
    const keyBase = itemType.toLowerCase();
    let currentSelectionStateKey;

    setSeleccion((prev) => {
      const newSelection = { ...prev };

      if (parentProductName) {
        if (tipo === "Sabor") {
            currentSelectionStateKey = `${parentProductName}_${keyBase}Sabores`;
            if (configurableItemIndex !== null && itemType === "Papas") {
                const papasType = productosMenu.Boxes.find(p => p.nombre === parentProductName).configurableItems[configurableItemIndex].quantity;
                const papasKey = papasType.includes("Francesa") ? "papasFrancesaSabores" : "papasGajoSabores";
                currentSelectionStateKey = `${parentProductName}_${papasKey}`;
            }
        } else if (tipo === "Bebida") {
            currentSelectionStateKey = `${parentProductName}_${keyBase}Bebida`;
        } else if (tipo === "Tipo") {
            currentSelectionStateKey = `${parentProductName}_papasTipo`;
        } else if (itemType === "KidsMainOption") {
            currentSelectionStateKey = `${parentProductName}_kidsMainOption`;
            newSelection[currentSelectionStateKey] = valor;
            return newSelection;
        }
      } else if (tipo === "Sabor") {
        currentSelectionStateKey = `${keyBase}Sabores`;
      } else {
        currentSelectionStateKey = `${keyBase}${tipo}`;
      }

      if (tipo === "Piezas" || tipo === "Gramaje" || tipo === "Tipo" || itemType === "KidsMainOption") {
        newSelection[currentSelectionStateKey] = valor;
        if (tipo === "Tipo" && parentProductName) {
            newSelection[`${parentProductName}_papasSabores`] = [];
        } else if (tipo === "Piezas" || tipo === "Gramaje") {
            newSelection[`${keyBase}Sabores`] = [];
        }
      } else if (tipo === "Sabor") {
        let quantityForFlavor = "";

        if (parentProductName) {
            let parentCategoryArray = [];
            if (parentProductName.includes("Paquete ")) {
                if (parentProductName.includes("Alitas")) parentCategoryArray = productosMenu["Paquetes de Alitas"];
                else if (parentProductName.includes("Boneless")) parentCategoryArray = productosMenu["Paquetes de Boneless"];
            } else if (parentProductName.includes("Box")) {
                parentCategoryArray = productosMenu.Boxes;
            } else if (parentProductName.includes("Lunes:") || parentProductName.includes("Miércoles:") || parentProductName.includes("Sábado:")) {
                parentCategoryArray = productosMenu.Promociones;
            } else if (productosMenu.Burgys.find(p => p.nombre === parentProductName)) {
                parentCategoryArray = productosMenu.Burgys;
            } else if (productosMenu.Doggys.find(p => p.nombre === parentProductName)) {
                parentCategoryArray = productosMenu.Doggys;
            }

            const parentProduct = parentCategoryArray.find(p => p.nombre === parentProductName);

            if (parentProduct && parentProduct.configurableItems) {
                const itemConfig = parentProduct.configurableItems.find(item => item.type === itemType && (itemType !== "Papas" || item.quantity === productosMenu.Papas.items.find(p => p.nombre === (configurableItemIndex === 0 ? "Papas a la Francesa" : "Papas en Gajo"))?.nombre));
                if (itemConfig) {
                    quantityForFlavor = itemConfig.quantity;
                }
            }
        } else {
            quantityForFlavor = newSelection[`${keyBase}${itemType === "Alitas" ? "Piezas" : itemType === "Boneless" ? "Gramaje" : "Piezas"}`];
        }

        const maxSabores = getMaxSabores(itemType, quantityForFlavor);
        const currentFlavors = newSelection[currentSelectionStateKey] || [];
        const isSelected = currentFlavors.includes(valor);

        if (isSelected) {
          newSelection[currentSelectionStateKey] = currentFlavors.filter((s) => s !== valor);
        } else {
          if (currentFlavors.length < maxSabores) {
            newSelection[currentSelectionStateKey] = [...currentFlavors, valor];
          } else {
            alert(`Ya seleccionaste el máximo de ${maxSabores} sabor(es) para este producto.`);
          }
        }
      } else if (tipo === "Bebida") {
        const currentBebidas = newSelection[currentSelectionStateKey] || [];
        const isSelected = currentBebidas.includes(valor);
        let maxBebidas = 1;

        if (parentProductName && (parentProductName.includes("2 Bebidas") || parentProductName.includes("Sábado: 20 Alitas"))) {
            maxBebidas = 2;
        }

        if (isSelected) {
            newSelection[currentSelectionStateKey] = currentBebidas.filter((b) => b !== valor);
        } else {
            if (currentBebidas.length < maxBebidas) {
                newSelection[currentSelectionStateKey] = [...currentBebidas, valor];
            } else {
                alert(`Ya seleccionaste el máximo de ${maxBebidas} bebida(s) para esta promoción.`);
            }
        }
      }
      return newSelection;
    });
  };

  const agregarProductoEspecial = (categoria) => {
    const keyBase = categoria.toLowerCase();
    let cantidadNombre = "";
    let precio = 0;
    let sabores = [];
    let medidaTipo = "";
    let isPromotion = false;

    if (categoria === "Boneless") {
      cantidadNombre = seleccion.bonelessGramaje;
      const item = productosMenu.Boneless.items.find(g => g.nombre === cantidadNombre);
      if (item) {
        precio = item.precio;
        isPromotion = item.isPromotion;
      }
      sabores = seleccion.bonelessSabores;
      medidaTipo = "Gramaje";
    } else if (categoria === "Alitas") {
      cantidadNombre = seleccion.alitasPiezas;
      const item = productosMenu.Alitas.items.find(g => g.nombre === cantidadNombre);
      if (item) {
        precio = item.precio;
        isPromotion = item.isPromotion;
      }
      sabores = seleccion.alitasSabores;
      medidaTipo = "Piezas";
    } else if (categoria === "Papas") {
      cantidadNombre = seleccion.papasPiezas;
      const item = productosMenu.Papas.items.find(g => g.nombre === cantidadNombre);
      if (item) {
        precio = item.precio;
        isPromotion = item.isPromotion;
      }
      sabores = seleccion.papasSabores;
      medidaTipo = "Piezas";
    }

    const maxSabores = getMaxSabores(categoria, cantidadNombre);
    const isPapasButNoFlavorNeeded = categoria === "Papas" && (maxSabores === 0 || (cantidadNombre && sabores.length === 0 && maxSabores === 1 && productosMenu.Papas.sabores.includes("Naturales")));

    if (cantidadNombre && (sabores.length === maxSabores || isPapasButNoFlavorNeeded) && maxSabores >= 0) {
      const nombreCompleto = `${cantidadNombre} ${categoria}` + (sabores.length > 0 ? ` (${sabores.join(" + ")})` : "");
      setFormData((prev) => ({
        ...prev,
        productos: [...prev.productos, { nombre: nombreCompleto, precio, isPromotion }],
      }));
      setSeleccion((prev) => ({
        ...prev,
        [`${keyBase}${medidaTipo}`]: "",
        [`${keyBase}Sabores`]: [],
      }));
    } else {
        let message = "";
        if (!cantidadNombre) {
            message = `Por favor, selecciona una cantidad para ${categoria}.`;
        } else if (sabores.length < maxSabores) {
            message = `Por favor, selecciona ${maxSabores - sabores.length} sabor(es) más para ${cantidadNombre} de ${categoria}.`;
        } else if (sabores.length > maxSabores) {
            message = `Has seleccionado demasiados sabores para ${cantidadNombre} de ${categoria}. Máximo ${maxSabores}.`;
        } else if (maxSabores === 0 && sabores.length > 0) {
            message = `Este producto no requiere selección de sabores.`;
        }
        alert(message);
    }
  };

  const agregarProductoPaquete = (paqueteProducto) => {
    const { nombre, precio, configurableItems, description, isPromotion } = paqueteProducto;
    let finalProductName = nombre;
    const itemDetails = [];
    let allConfigured = true;

    if (configurableItems && configurableItems.length > 0) {
      configurableItems.forEach((itemConfig, index) => {
        const itemType = itemConfig.type;
        let selectedValueOrItems;
        let maxCount;
        
        if (itemType === "Alitas" || itemType === "Boneless") {
            const currentSelectionStateKey = `${nombre}_${itemType.toLowerCase()}Sabores`;
            selectedValueOrItems = seleccion[currentSelectionStateKey] || [];
            maxCount = getMaxSabores(itemType, itemConfig.quantity);

            if (maxCount > 0 && selectedValueOrItems.length !== maxCount) {
                allConfigured = false;
            }
            if (selectedValueOrItems.length > 0) {
                itemDetails.push(`${itemConfig.quantity} ${itemType} (${selectedValueOrItems.join(" + ")})`);
            } else if (maxCount > 0) {
                allConfigured = false;
            }
        } else if (itemType === "Papas") {
            const isTwoPapasBox = nombre.includes("Boneless Box") || nombre.includes("Bendito Box");

            if (isTwoPapasBox) {
                const papasType = itemConfig.quantity;
                const papasKey = papasType.includes("Francesa") ? "papasFrancesaSabores" : "papasGajoSabores";
                const currentSelectionStateKey = `${nombre}_${papasKey}`;
                selectedValueOrItems = seleccion[currentSelectionStateKey] || [];
                maxCount = getMaxSabores(itemType, papasType);

                if (maxCount > 0 && selectedValueOrItems.length !== maxCount) {
                    allConfigured = false;
                }
                if (selectedValueOrItems.length > 0) {
                    itemDetails.push(`${papasType} (${selectedValueOrItems.join(" + ")})`);
                } else if (maxCount > 0) {
                    allConfigured = false;
                }
            } else {
                const currentSelectionStateKey = `${nombre}_papasTipo`;
                const papaTipoSeleccionada = seleccion[currentSelectionStateKey];
                if (!papaTipoSeleccionada) {
                    allConfigured = false;
                    return;
                }
                itemDetails.push(papaTipoSeleccionada);

                const saboresDePapaKey = `${nombre}_papasSabores`;
                selectedValueOrItems = seleccion[saboresDePapaKey] || [];
                maxCount = getMaxSabores(itemType, papaTipoSeleccionada);
                if (maxCount > 0 && selectedValueOrItems.length !== maxCount) {
                    allConfigured = false;
                }
                if (selectedValueOrItems.length > 0) {
                    itemDetails.push(`(${selectedValueOrItems.join(" + ")})`);
                }
            }
        } else if (itemType === "Bebida") {
            const currentSelectionStateKey = `${nombre}_${itemType.toLowerCase()}Bebida`;
            selectedValueOrItems = seleccion[currentSelectionStateKey] || [];
            maxCount = itemConfig.quantity.includes('2 Bebidas') ? 2 : 1;
            if (selectedValueOrItems.length !== maxCount) {
                allConfigured = false;
            }
            if (selectedValueOrItems.length > 0) {
                itemDetails.push(`${itemConfig.quantity} (${selectedValueOrItems.join(" + ")})`);
            }
        }
        else if (itemType === "KidsMainOption") {
            const currentSelectionStateKey = `${nombre}_kidsMainOption`;
            selectedValueOrItems = seleccion[currentSelectionStateKey];
            if (!selectedValueOrItems) {
                allConfigured = false;
            } else {
                itemDetails.push(selectedValueOrItems);
            }
        }
      });

      if (nombre.includes("Paquete Kids")) {
        itemDetails.push("Jugo de Naranja");
        itemDetails.push("Paleta Payaso Mini");
      }

      if (itemDetails.length > 0) {
        finalProductName = `${nombre} (${itemDetails.join(" y ")})`;
      }
    }

    if (!allConfigured) {
      alert("Por favor, selecciona todas las opciones requeridas para este producto.");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      productos: [...prev.productos, { nombre: finalProductName, precio, isPromotion }],
    }));

    setSeleccion(prev => {
        const newState = { ...prev };
        if (configurableItems) {
            configurableItems.forEach(itemConfig => {
                const itemType = itemConfig.type;
                if (itemType === "Alitas" || itemType === "Boneless") {
                    newState[`${nombre}_${itemType.toLowerCase()}Sabores`] = [];
                } else if (itemType === "Papas") {
                    const isTwoPapasBox = nombre.includes("Boneless Box") || nombre.includes("Bendito Box");
                    if (isTwoPapasBox) {
                        newState[`${nombre}_papasFrancesaSabores`] = [];
                        newState[`${nombre}_papasGajoSabores`] = [];
                    } else {
                        newState[`${nombre}_papasTipo`] = '';
                        newState[`${nombre}_papasSabores`] = [];
                    }
                } else if (itemType === "Bebida") {
                    newState[`${nombre}_bebidaBebida`] = [];
                }
                else if (itemType === "KidsMainOption") {
                    newState[`${nombre}_kidsMainOption`] = '';
                }
            });
        }
        return newState;
    });
  };

  const agregarProducto = (producto) => {
    const productoConTipo = { ...producto, isPromotion: producto.isPromotion || false };
    setFormData((prev) => ({
      ...prev,
      productos: [...prev.productos, productoConTipo],
    }));
  };

  const handleEliminarProducto = (index) => {
    setFormData((prev) => {
      const productos = [...prev.productos];
      productos.splice(index, 1);
      return { ...prev, productos };
    });
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es obligatorio.";
    }
    if (!formData.telefono.trim()) {
      newErrors.telefono = "El teléfono es obligatorio.";
    } else if (!/^\d{10}$/.test(formData.telefono.trim())) {
      newErrors.telefono = "El teléfono debe ser un número de 10 dígitos.";
    }
    if (formData.sucursal === "domicilio" && !formData.direccion.trim()) {
      newErrors.direccion = "La dirección es obligatoria para pedidos a domicilio.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const generarMensaje = () => {
    const { nombre, telefono, direccion, sucursal, tienda, productos, comentario } = formData;

    const total = productos.reduce((acc, item) => acc + item.precio, 0);

    const contienePromocion = productos.some(item => item.isPromotion === true);

    const productosTexto = productos.map((p, i) =>
      `${i + 1}. ${p.nombre} - $${p.precio.toFixed(2)}`
    ).join("\n");

    let texto = `¡Hola! Soy *${nombre}*.
Tel: ${telefono}
`;

    if (sucursal === "domicilio") {
      texto += `Tipo de pedido: *A Domicilio*
Dirección: *${direccion}*
Sucursal de origen: *${tienda.toUpperCase()}*
`;
    } else {
      texto += `Tipo de pedido: *Para Recoger en Sucursal*
Sucursal: *${tienda.toUpperCase()}*
Número de orden: *#${ordenId}*
`;
    }

    texto += `\n*Mi Pedido:*\n${productosTexto || "No se han agregado productos."}\n`;

    if (comentario.trim()) {
      texto += `\n*Comentarios Adicionales:*\n${comentario.trim()}\n`;
    }

    let totalFinal = total;
    if (sucursal === "domicilio" && !contienePromocion) {
      const descuento = 0.10;
      totalFinal = total * (1 - descuento);
      texto += `\n*Total estimado con descuento del 10% (más envío - por confirmar): $${totalFinal.toFixed(2)}*`;
      texto += `\n*NO APLICAN PROMOCIONES*`;
    } else {
      texto += `\n*Total estimado (más envío - por confirmar): $${totalFinal.toFixed(2)}*`;
      texto += `\n*NO APLICAN PROMOCIONES*`;
    }

    let telefonoWhatsApp = "";
    if (tienda === "xico") telefonoWhatsApp = "522283544463";
    else if (tienda === "coatepec") telefonoWhatsApp = "522284032836";

    return `https://wa.me/${telefonoWhatsApp}?text=${encodeURIComponent(texto)}`;
  };


  return (
    <div className="pedido-overlay">
      <div className="pedido-popup">
        {/* Botón para cerrar el popup */}
        <button className="close-btn" onClick={onClose}>×</button>

        {/* --- Paso 1: Datos del cliente --- */}
        {step === 1 && (
          <div className="popup-step">
            <h2>Tus datos</h2>
            <label>Nombre</label>
            <input
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={errors.nombre ? "input-error" : ""}
            />
            {errors.nombre && <p className="error-message">{errors.nombre}</p>}

            <label>Teléfono</label>
            <input
              name="telefono"
              value={formData.telefono}
              onChange={handleInputChange}
              type="tel"
              className={errors.telefono ? "input-error" : ""}
            />
            {errors.telefono && <p className="error-message">{errors.telefono}</p>}

            <label>Tipo de pedido</label>
            <select name="sucursal" value={formData.sucursal} onChange={handleInputChange}>
              <option value="domicilio">A domicilio</option>
              <option value="sucursal">Recoger en sucursal</option>
            </select>

            <label>{formData.sucursal === "domicilio" ? "Sucursal / Zona" : "Sucursal"}</label>
            <select name="tienda" value={formData.tienda} onChange={handleInputChange}>
              <option value="xico">Xico</option>
              <option value="coatepec">Coatepec</option>
            </select>

            {formData.sucursal === "domicilio" && (
              <>
                <label>Dirección</label>
                <input
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  className={errors.direccion ? "input-error" : ""}
                />
                {errors.direccion && <p className="error-message">{errors.direccion}</p>}
              </>
            )}

            {formData.sucursal === "sucursal" && (
              <p><strong>Número de orden: #{ordenId}</strong></p>
            )}

            <div className="step-buttons">
              <button onClick={() => {
                if (validateStep1()) {
                  setStep(2);
                }
              }}>Siguiente</button>
            </div>
          </div>
        )}

        {/* --- Paso 2: Selección de productos --- */}
        {step === 2 && (
          <div className="popup-step">
            <h2>Tu pedido</h2>
            {orderedCategories.map((categoria) => {
              const datos = productosMenu[categoria];
              if (!datos) return null;

              const estaAbierta = activeCategory === categoria;

              const toggleCategoria = () => {
                setActiveCategory(activeCategory === categoria ? null : categoria);
                if (activeCategory !== categoria) {
                    setActivePackage(null);
                }
              };

              if (categoria === "Alitas" || categoria === "Boneless" || categoria === "Papas") {
                const keyBase = categoria.toLowerCase();
                const medidaTipo = categoria === "Alitas" ? "Piezas" : categoria === "Boneless" ? "Gramaje" : "Piezas";
                const cantidadSeleccionada = seleccion[`${keyBase}${medidaTipo}`];
                const saboresSeleccionados = seleccion[`${keyBase}Sabores`];
                const maxSabores = getMaxSabores(categoria, cantidadSeleccionada);
                const canAddSpecialProduct = cantidadSeleccionada && (maxSabores === 0 || saboresSeleccionados.length === maxSabores);

                return (
                  <div key={categoria} className={`categoria-productos ${estaAbierta ? 'categoria-activa' : ''}`}>
                    <h3
                      style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
                      onClick={toggleCategoria}
                    >
                      <ChevronIcon isOpen={estaAbierta} />
                      {categoria}
                    </h3>

                    {estaAbierta && (
                      <>
                        <p className="help-text">1. Elige la cantidad. {maxSabores > 0 && "2. Selecciona tus sabores."} 3. Haz clic en 'Agregar'.</p>
                        <select
                          value={cantidadSeleccionada}
                          onChange={(e) => handleSeleccionChange(categoria, medidaTipo, e.target.value)}
                        >
                          <option value="">-- Elige Cantidad --</option>
                          {datos.items.map((item) => (
                            <option key={item.nombre} value={item.nombre}>{item.nombre}</option>
                          ))}
                        </select>
                        {cantidadSeleccionada && maxSabores > 0 && (
                          <>
                            <label>
                              Selecciona Condimentos ({saboresSeleccionados.length}{" "}
                              de {maxSabores})
                            </label>
                            <div className="productos-disponibles sabores-grid">
                              {datos.sabores.map((sabor) => (
                                <button
                                  key={sabor}
                                  className={`producto-btn ${saboresSeleccionados.includes(sabor) ? "activo" : ""}`}
                                  onClick={() => handleSeleccionChange(categoria, "Sabor", sabor)}
                                  disabled={!saboresSeleccionados.includes(sabor) && saboresSeleccionados.length >= maxSabores}
                                >
                                  {sabor}
                                </button>
                              ))}
                            </div>
                            {saboresSeleccionados.length < maxSabores && (
                              <p className="error-message">Faltan {maxSabores - saboresSeleccionados.length} sabor(es).</p>
                            )}
                            {saboresSeleccionados.length > maxSabores && (
                              <p className="error-message">Has seleccionado demasiados sabores. Máximo {maxSabores}.</p>
                            )}
                          </>
                        )}
                        <button
                          className="producto-btn agregar-btn"
                          onClick={() => agregarProductoEspecial(categoria)}
                          disabled={!canAddSpecialProduct}
                        >
                          Agregar {cantidadSeleccionada || categoria}
                        </button>
                      </>
                    )}
                  </div>
                );
              }
              else if (categoria === "Drinks") {
                return (
                  <div key={categoria} className={`categoria-productos ${estaAbierta ? 'categoria-activa' : ''}`}>
                    <h3
                      style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
                      onClick={toggleCategoria}
                    >
                      <ChevronIcon isOpen={estaAbierta} />
                      {categoria}
                    </h3>

                    {estaAbierta && (
                      <div className="productos-disponibles">
                        {datos.map((producto) => (
                          <div key={producto.nombre} className="producto-item-with-options">
                            <button
                              onClick={() => {
                                if (producto.options && producto.beerOptions) {
                                  if (!micheladaClamatoOption[producto.nombre] || !micheladaBeerOption[producto.nombre]) {
                                    alert("Por favor, selecciona una opción y el tipo de cerveza.");
                                    return;
                                  }
                                  agregarProducto({
                                    nombre: `${producto.nombre} (${micheladaClamatoOption[producto.nombre]}, ${micheladaBeerOption[producto.nombre]})`,
                                    precio: producto.precio
                                  });
                                  setMicheladaClamatoOption(prev => ({ ...prev, [producto.nombre]: undefined }));
                                  setMicheladaBeerOption(prev => ({ ...prev, [producto.nombre]: undefined }));
                                } else {
                                  agregarProducto(producto);
                                }
                              }}
                              className="producto-btn"
                              disabled={(producto.options && !micheladaClamatoOption[producto.nombre]) || (producto.beerOptions && !micheladaBeerOption[producto.nombre])}
                            >
                              {producto.nombre} - ${producto.precio.toFixed(2)}
                            </button>
                            {producto.options && (
                              <div className="michelada-options">
                                <p className="help-text">Elige una opción:</p>
                                {producto.options.map(option => (
                                  <button
                                    key={`${producto.nombre}-${option}`}
                                    className={`option-btn ${micheladaClamatoOption[producto.nombre] === option ? "activo" : ""}`}
                                    onClick={() => setMicheladaClamatoOption(prev => ({ ...prev, [producto.nombre]: option }))}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            )}
                            {producto.beerOptions && (
                              <div className="michelada-options">
                                <p className="help-text">Elige el tipo de cerveza:</p>
                                {producto.beerOptions.map(option => (
                                  <button
                                    key={`${producto.nombre}-${option}`}
                                    className={`option-btn ${micheladaBeerOption[producto.nombre] === option ? "activo" : ""}`}
                                    onClick={() => setMicheladaBeerOption(prev => ({ ...prev, [producto.nombre]: option }))}
                                  >
                                    {option}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              else if (categoria.includes("Paquetes") || categoria === "Boxes" || categoria === "Burgys" || categoria === "Doggys") {
                return (
                  <div key={categoria} className={`categoria-productos ${estaAbierta ? 'categoria-activa' : ''}`}>
                    <h3
                      style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
                      onClick={toggleCategoria}
                    >
                      <ChevronIcon isOpen={estaAbierta} />
                      {categoria}
                    </h3>

                    {estaAbierta && (
                      <div className="productos-disponibles">
                        {datos.map((paqueteProducto) => {
                          const isPackageActive = activePackage === paqueteProducto.nombre;
                          return (
                          <div key={paqueteProducto.nombre} className={`producto-item-with-options ${isPackageActive ? 'activo' : ''}`}>
                            <h4
                                style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
                                onClick={() => setActivePackage(isPackageActive ? null : paqueteProducto.nombre)}
                            >
                                <ChevronIcon isOpen={isPackageActive} size={20} color='#333' />
                                {paqueteProducto.nombre} - ${paqueteProducto.precio.toFixed(2)}
                            </h4>
                            {paqueteProducto.nombre.includes("Paquete Kids") && isPackageActive && (
                                <p className="help-text" style={{margin: '0.5rem 0', fontStyle: 'italic'}}>{paqueteProducto.description}</p>
                            )}
                            {isPackageActive && (
                                <>
                                {paqueteProducto.configurableItems && paqueteProducto.configurableItems.map((itemConfig, idx) => {
                                    const itemType = itemConfig.type;
                                    let itemOptions = [];
                                    let labelText = "";
                                    let isFlavorSelection = false;
                                    let currentSelectionStateKey;
                                    let selectedItemsOrOption;
                                    let maxCount = 1;

                                    if (itemType === "Alitas" || itemType === "Boneless") {
                                      itemOptions = productosMenu[itemType]?.sabores;
                                      labelText = `${itemType} - Elige Condimentos`;
                                      isFlavorSelection = true;
                                      currentSelectionStateKey = `${paqueteProducto.nombre}_${itemType.toLowerCase()}Sabores`;
                                      selectedItemsOrOption = seleccion[currentSelectionStateKey] || [];
                                      maxCount = getMaxSabores(itemType, itemConfig.quantity);
                                    } else if (itemType === "Papas") {
                                        const isTwoPapasBox = paqueteProducto.nombre.includes("Boneless Box") || paqueteProducto.nombre.includes("Bendito Box");

                                        if (isTwoPapasBox) {
                                            const papasType = itemConfig.quantity;
                                            const papasKey = papasType.includes("Francesa") ? "papasFrancesaSabores" : "papasGajoSabores";
                                            labelText = `Condimentos para ${papasType}`;
                                            isFlavorSelection = true;
                                            itemOptions = productosMenu.Papas.sabores;
                                            currentSelectionStateKey = `${paqueteProducto.nombre}_${papasKey}`;
                                            selectedItemsOrOption = seleccion[currentSelectionStateKey] || [];
                                            maxCount = getMaxSabores(itemType, papasType);
                                        } else {
                                            itemOptions = itemConfig.options();
                                            labelText = "Tipo de Papas";
                                            currentSelectionStateKey = `${paqueteProducto.nombre}_papasTipo`;
                                            selectedItemsOrOption = seleccion[currentSelectionStateKey] || '';

                                            const papaTipoSeleccionada = seleccion[currentSelectionStateKey];
                                            const saboresDePapaKey = `${paqueteProducto.nombre}_papasSabores`;
                                            const saboresDePapaSeleccionados = seleccion[saboresDePapaKey] || [];
                                            const maxSaboresPapa = getMaxSabores(itemType, papaTipoSeleccionada);

                                            return (
                                                <div key={`${paqueteProducto.nombre}-${itemType}-${idx}`} style={{width: '100%', textAlign: 'center'}}>
                                                    <label style={{marginTop: '1rem'}}>{labelText}</label>
                                                    <div className="productos-disponibles">
                                                        {itemOptions.map(option => (
                                                            <button
                                                                key={`${paqueteProducto.nombre}-${itemType}-${option}`}
                                                                className={`producto-btn ${selectedItemsOrOption === option ? "activo" : ""}`}
                                                                onClick={() => handleSeleccionChange(itemType, "Tipo", option, paqueteProducto.nombre)}
                                                                disabled={selectedItemsOrOption && selectedItemsOrOption !== option}
                                                            >
                                                                {option}
                                                            </button>
                                                        ))}
                                                    </div>
                                                    {papaTipoSeleccionada && maxSaboresPapa > 0 && (
                                                        <>
                                                            <label style={{marginTop: '1rem'}}>
                                                                Elige Sabor Papas ({saboresDePapaSeleccionados.length} de {maxSaboresPapa})
                                                            </label>
                                                            <div className="productos-disponibles sabores-grid" style={{marginTop: '0.5rem'}}>
                                                                {productosMenu.Papas.sabores.map(sabor => (
                                                                    <button
                                                                        key={`${paqueteProducto.nombre}-${itemType}-${papaTipoSeleccionada}-${sabor}`}
                                                                        className={`producto-btn ${saboresDePapaSeleccionados.includes(sabor) ? "activo" : ""}`}
                                                                        onClick={() => handleSeleccionChange(itemType, "Sabor", sabor, paqueteProducto.nombre)}
                                                                        disabled={!saboresDePapaSeleccionados.includes(sabor) && saboresDePapaSeleccionados.length >= maxSaboresPapa}
                                                                    >
                                                                        {sabor}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                            {saboresDePapaSeleccionados.length < maxSaboresPapa && (
                                                                <p className="error-message">Faltan {maxSaboresPapa - saboresDePapaSeleccionados.length} sabor(es) para las papas.</p>
                                                            )}
                                                            {saboresDePapaSeleccionados.length > maxSaboresPapa && (
                                                                <p className="error-message">Has seleccionado demasiados sabores para las papas. Máximo {maxSaboresPapa}.</p>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        }
                                    } else if (itemType === "Bebida") {
                                      itemOptions = itemConfig.options;
                                      labelText = `${itemConfig.quantity} - Elige Bebida`;
                                      currentSelectionStateKey = `${paqueteProducto.nombre}_bebidaBebida`;
                                      selectedItemsOrOption = seleccion[currentSelectionStateKey] || [];
                                      maxCount = itemConfig.quantity.includes('2 Bebidas') ? 2 : 1;
                                    }
                                    else if (itemType === "KidsMainOption") {
                                        itemOptions = itemConfig.options;
                                        labelText = "Elige tu Opción Principal";

                                        currentSelectionStateKey = `${paqueteProducto.nombre}_kidsMainOption`;
                                        selectedItemsOrOption = seleccion[currentSelectionStateKey] || '';
                                        maxCount = 1;

                                        return (
                                            <div key={`${paqueteProducto.nombre}-${itemType}-${idx}`} style={{width: '100%', textAlign: 'center'}}>
                                                <label style={{marginTop: '1rem'}}>{labelText}</label>
                                                <div className="productos-disponibles">
                                                    {itemOptions.map(option => (
                                                        <button
                                                            key={`${paqueteProducto.nombre}-${itemType}-${option}`}
                                                            className={`producto-btn ${selectedItemsOrOption === option ? "activo" : ""}`}
                                                            onClick={() => {
                                                                if (selectedItemsOrOption === option) {
                                                                    handleSeleccionChange(itemType, itemType, '', paqueteProducto.nombre);
                                                                } else {
                                                                    handleSeleccionChange(itemType, itemType, option, paqueteProducto.nombre);
                                                                }
                                                            }}
                                                            disabled={selectedItemsOrOption !== '' && selectedItemsOrOption !== option}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                                {!selectedItemsOrOption && maxCount > 0 && (
                                                    <p className="error-message">Falta seleccionar tu opción principal.</p>
                                                )}
                                            </div>
                                        );
                                    }

                                    if (itemType === "Papas" && (paqueteProducto.nombre.includes("Boneless Box") || paqueteProducto.nombre.includes("Bendito Box"))) {
                                        const papaTipo = itemConfig.quantity;
                                        const papaKey = papaTipo.includes("Francesa") ? "papasFrancesaSabores" : "papasGajoSabores";
                                        const saboresDePapaSeleccionados = seleccion[`${paqueteProducto.nombre}_${papaKey}`] || [];
                                        const maxSaboresPapa = getMaxSabores("Papas", papaTipo);
                                        return (
                                            <div key={`${paqueteProducto.nombre}-${itemType}-${idx}`} style={{width: '100%', textAlign: 'center'}}>
                                                <label style={{marginTop: '1rem'}}>
                                                    Condimentos para {papaTipo} ({saboresDePapaSeleccionados.length} de {maxSaboresPapa})
                                                </label>
                                                <div className="productos-disponibles sabores-grid" style={{marginTop: '0.5rem'}}>
                                                    {productosMenu.Papas.sabores.map(sabor => (
                                                        <button
                                                            key={`${paqueteProducto.nombre}-${papaKey}-${sabor}`}
                                                            className={`producto-btn ${saboresDePapaSeleccionados.includes(sabor) ? "activo" : ""}`}
                                                            onClick={() => handleSeleccionChange("Papas", "Sabor", sabor, paqueteProducto.nombre, idx)}
                                                            disabled={!saboresDePapaSeleccionados.includes(sabor) && saboresDePapaSeleccionados.length >= maxSaboresPapa}
                                                        >
                                                            {sabor}
                                                        </button>
                                                    ))}
                                                </div>
                                                {saboresDePapaSeleccionados.length < maxSaboresPapa && (
                                                    <p className="error-message">Faltan {maxSaboresPapa - saboresDePapaSeleccionados.length} sabor(es) para {papaTipo}.</p>
                                                )}
                                                {saboresDePapaSeleccionados.length > maxSaboresPapa && (
                                                    <p className="error-message">Has seleccionado demasiados sabores para {papaTipo}. Máximo {maxSaboresPapa}.</p>
                                                )}
                                            </div>
                                        );
                                    }

                                    if (!itemOptions || itemOptions.length === 0 || itemType === "Papas") return null;

                                    return (
                                        <div key={`${paqueteProducto.nombre}-${itemType}-${idx}`} style={{width: '100%', textAlign: 'center'}}>
                                            <label style={{marginTop: '1rem'}}>
                                                {labelText} ({Array.isArray(selectedItemsOrOption) ? selectedItemsOrOption.length : (selectedItemsOrOption ? 1 : 0)} de {maxCount})
                                            </label>
                                            <div className="productos-disponibles sabores-grid" style={{marginTop: '0.5rem'}}>
                                                {itemOptions.map(option => (
                                                    <button
                                                        key={`${paqueteProducto.nombre}-${itemType}-${option}`}
                                                        className={`producto-btn ${
                                                            (Array.isArray(selectedItemsOrOption) && selectedItemsOrOption.includes(option)) ||
                                                            (typeof selectedItemsOrOption === 'string' && selectedItemsOrOption === option)
                                                            ? "activo" : ""}`}
                                                        onClick={() => handleSeleccionChange(itemType, isFlavorSelection ? "Sabor" : (itemType === "Bebida" ? "Bebida" : "Option"), option, paqueteProducto.nombre)}
                                                        disabled={
                                                            (Array.isArray(selectedItemsOrOption) && !selectedItemsOrOption.includes(option) && selectedItemsOrOption.length >= maxCount)
                                                            || (typeof selectedItemsOrOption === 'string' && selectedItemsOrOption && selectedItemsOrOption !== option)
                                                        }
                                                    >
                                                        {option}
                                                    </button>
                                                ))}
                                            </div>
                                            {((Array.isArray(selectedItemsOrOption) && selectedItemsOrOption.length < maxCount) || (typeof selectedItemsOrOption === 'string' && !selectedItemsOrOption && maxCount > 0)) && (
                                                <p className="error-message">Falta seleccionar {maxCount - (Array.isArray(selectedItemsOrOption) ? selectedItemsOrOption.length : (selectedItemsOrOption ? 1 : 0))} opción(es).</p>
                                            )}
                                            {Array.isArray(selectedItemsOrOption) && selectedItemsOrOption.length > maxCount && (
                                                <p className="error-message">Has seleccionado demasiadas opciones. Máximo {maxCount}.</p>
                                            )}
                                        </div>
                                    );
                                })}
                                <button
                                    className="producto-btn agregar-btn"
                                    onClick={() => agregarProductoPaquete(paqueteProducto)}
                                >
                                    Agregar {paqueteProducto.nombre}
                                </button>
                                </>
                            )}
                          </div>
                        );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              else if (categoria === "Promociones") {
                return (
                  <div key={categoria} className={`categoria-productos ${estaAbierta ? 'categoria-activa' : ''}`}>
                    <h3
                      style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
                      onClick={toggleCategoria}
                    >
                      <ChevronIcon isOpen={estaAbierta} />
                      {categoria}
                    </h3>

                    {estaAbierta && (
                      <div className="productos-disponibles">
                        {datos.map((promo) => {
                          if (promo.dia && promo.dia !== currentDay) {
                            return null;
                          }

                          if (promo.isDiscount) {
                            return (
                              <div key={promo.nombre} className="promo-info-card">
                                <h4>{promo.nombre}</h4>
                                <p>{promo.description || "Pregunta en tienda por esta promoción."}</p>
                                {promo.timeSensitive && <p className="time-info">(Solo de 3pm a 5pm)</p>}
                              </div>
                            );
                          }

                          if (promo.isSpecialOffer && promo.options) {
                            return (
                              <div key={promo.nombre} className="producto-item-with-options">
                                <button
                                  onClick={() => {
                                    if (!micheladaPromoClamatoOption[promo.nombre] || !micheladaPromoBeerOption[promo.nombre]) {
                                      alert("Por favor, selecciona una opción y el tipo de cerveza.");
                                      return;
                                    }
                                    agregarProducto({
                                      nombre: `${promo.nombre} (${micheladaPromoClamatoOption[promo.nombre]}, ${micheladaPromoBeerOption[promo.nombre]})`,
                                      precio: promo.precio
                                    });
                                    setMicheladaPromoClamatoOption(prev => ({ ...prev, [promo.nombre]: undefined }));
                                    setMicheladaPromoBeerOption(prev => ({ ...prev, [promo.nombre]: undefined }));
                                  }}
                                  className="producto-btn"
                                  disabled={!micheladaPromoClamatoOption[promo.nombre] || !micheladaPromoBeerOption[promo.nombre]}
                                >
                                  {promo.nombre} - ${promo.precio.toFixed(2)}
                                </button>
                                {promo.options && (
                                    <div className="michelada-options">
                                      <p className="help-text">Elige una opción:</p>
                                      {promo.options.map(option => (
                                        <button
                                          key={`${promo.nombre}-${option}`}
                                          className={`option-btn ${micheladaPromoClamatoOption[promo.nombre] === option ? "activo" : ""}`}
                                          onClick={() => setMicheladaPromoClamatoOption(prev => ({ ...prev, [promo.nombre]: option }))}
                                        >
                                          {option}
                                        </button>
                                      ))}
                                    </div>
                                )}
                                {promo.beerOptions && (
                                    <div className="michelada-options">
                                      <p className="help-text">Elige el tipo de cerveza:</p>
                                      {promo.beerOptions.map(option => (
                                        <button
                                          key={`${promo.nombre}-${option}`}
                                          className={`option-btn ${micheladaPromoBeerOption[promo.nombre] === option ? "activo" : ""}`}
                                          onClick={() => setMicheladaPromoBeerOption(prev => ({ ...prev, [promo.nombre]: option }))}
                                        >
                                          {option}
                                        </button>
                                      ))}
                                    </div>
                                )}
                              </div>
                            );
                            }

                          if (promo.configurableItems) {
                             const isPromoActive = activePackage === promo.nombre;
                            return (
                              <div key={promo.nombre} className={`producto-item-with-options ${isPromoActive ? 'activo' : ''}`}>
                                <h4
                                    style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
                                    onClick={() => setActivePackage(isPromoActive ? null : promo.nombre)}
                                >
                                    <ChevronIcon isOpen={isPromoActive} size={20} color='#333' />
                                    {promo.nombre} - ${promo.precio.toFixed(2)}
                                </h4>
                                {isPromoActive && (
                                    <>
                                    {promo.configurableItems.map((itemConfig, idx) => {
                                        const itemType = itemConfig.type;
                                        let itemOptions = [];
                                        let labelText = "";
                                        let isFlavorSelection = false;
                                        let currentSelectionStateKey;
                                        let selectedItemsOrOption;
                                        let maxCount = 1;

                                        if (itemType === "Alitas" || itemType === "Boneless") {
                                          itemOptions = productosMenu[itemType]?.sabores;
                                          labelText = `${itemType} - Elige Condimentos`;
                                          isFlavorSelection = true;
                                          currentSelectionStateKey = `${promo.nombre}_${itemType.toLowerCase()}Sabores`;
                                          selectedItemsOrOption = seleccion[currentSelectionStateKey] || [];
                                          maxCount = getMaxSabores(itemType, itemConfig.quantity);
                                        } else if (itemType === "Papas") {
                                          itemOptions = itemConfig.options();
                                          labelText = "Tipo de Papas";
                                          currentSelectionStateKey = `${promo.nombre}_papasTipo`;
                                          selectedItemsOrOption = seleccion[currentSelectionStateKey] || '';

                                          const papaTipoSeleccionada = seleccion[currentSelectionStateKey];
                                          const saboresDePapaKey = `${promo.nombre}_papasSabores`;
                                          const saboresDePapaSeleccionados = seleccion[saboresDePapaKey] || [];
                                          const maxSaboresPapa = getMaxSabores(itemType, papaTipoSeleccionada);

                                          return (
                                            <div key={`${promo.nombre}-${itemType}-${idx}`} style={{width: '100%', textAlign: 'center'}}>
                                                <label style={{marginTop: '1rem'}}>{labelText}</label>
                                                <div className="productos-disponibles">
                                                    {itemOptions.map(option => (
                                                        <button
                                                            key={`${promo.nombre}-${itemType}-${option}`}
                                                            className={`producto-btn ${selectedItemsOrOption === option ? "activo" : ""}`}
                                                            onClick={() => handleSeleccionChange(itemType, "Tipo", option, promo.nombre)}
                                                            disabled={selectedItemsOrOption && selectedItemsOrOption !== option}
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                                {papaTipoSeleccionada && maxSaboresPapa > 0 && (
                                                    <>
                                                        <label style={{marginTop: '1rem'}}>
                                                            Elige Sabor Papas ({saboresDePapaSeleccionados.length} de {maxSaboresPapa})
                                                        </label>
                                                        <div className="productos-disponibles sabores-grid" style={{marginTop: '0.5rem'}}>
                                                            {productosMenu.Papas.sabores.map(sabor => (
                                                                <button
                                                                    key={`${promo.nombre}-${itemType}-${papaTipoSeleccionada}-${sabor}`}
                                                                    className={`producto-btn ${saboresDePapaSeleccionados.includes(sabor) ? "activo" : ""}`}
                                                                    onClick={() => handleSeleccionChange(itemType, "Sabor", sabor, promo.nombre)}
                                                                    disabled={!saboresDePapaSeleccionados.includes(sabor) && saboresDePapaSeleccionados.length >= maxSaboresPapa}
                                                                >
                                                                    {sabor}
                                                                </button>
                                                            ))}
                                                        </div>
                                                        {saboresDePapaSeleccionados.length < maxSaboresPapa && (
                                                            <p className="error-message">Faltan {maxSaboresPapa - saboresDePapaSeleccionados.length} sabor(es) para las papas.</p>
                                                        )}
                                                        {saboresDePapaSeleccionados.length > maxSaboresPapa && (
                                                            <p className="error-message">Has seleccionado demasiados sabores para las papas. Máximo {maxSaboresPapa}.</p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                          );
                                        } else if (itemType === "Bebida") {
                                          itemOptions = itemConfig.options;
                                          labelText = `${itemConfig.quantity} - Elige Bebida`;
                                          currentSelectionStateKey = `${promo.nombre}_bebidaBebida`;
                                          selectedItemsOrOption = seleccion[currentSelectionStateKey] || [];
                                          maxCount = itemConfig.quantity.includes('2 Bebidas') ? 2 : 1;
                                        }

                                        if (!itemOptions || itemOptions.length === 0 || itemType === "Papas") return null;

                                        return (
                                            <div key={`${promo.nombre}-${itemType}-${idx}`} style={{width: '100%', textAlign: 'center'}}>
                                                <label style={{marginTop: '1rem'}}>
                                                    {labelText} ({Array.isArray(selectedItemsOrOption) ? selectedItemsOrOption.length : (selectedItemsOrOption ? 1 : 0)} de {maxCount})
                                                </label>
                                                <div className="productos-disponibles sabores-grid" style={{marginTop: '0.5rem'}}>
                                                    {itemOptions.map(option => (
                                                        <button
                                                            key={`${promo.nombre}-${itemType}-${option}`}
                                                            className={`producto-btn ${
                                                                (Array.isArray(selectedItemsOrOption) && selectedItemsOrOption.includes(option)) ||
                                                                (typeof selectedItemsOrOption === 'string' && selectedItemsOrOption === option)
                                                                ? "activo" : ""}`}
                                                            onClick={() => handleSeleccionChange(itemType, isFlavorSelection ? "Sabor" : (itemType === "Bebida" ? "Bebida" : "Option"), option, promo.nombre)}
                                                            disabled={
                                                                (Array.isArray(selectedItemsOrOption) && !selectedItemsOrOption.includes(option) && selectedItemsOrOption.length >= maxCount)
                                                                || (typeof selectedItemsOrOption === 'string' && selectedItemsOrOption && selectedItemsOrOption !== option)
                                                            }
                                                        >
                                                            {option}
                                                        </button>
                                                    ))}
                                                </div>
                                                {((Array.isArray(selectedItemsOrOption) && selectedItemsOrOption.length < maxCount) || (typeof selectedItemsOrOption === 'string' && !selectedItemsOrOption && maxCount > 0)) && (
                                                    <p className="error-message">Falta seleccionar {maxCount - (Array.isArray(selectedItemsOrOption) ? selectedItemsOrOption.length : (selectedItemsOrOption ? 1 : 0))} opción(es).</p>
                                                )}
                                                {Array.isArray(selectedItemsOrOption) && selectedItemsOrOption.length > maxCount && (
                                                    <p className="error-message">Has seleccionado demasiadas opciones. Máximo {maxCount}.</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <button
                                      className="producto-btn agregar-btn"
                                      onClick={() => agregarProductoPaquete(promo)}
                                    >
                                      Agregar {promo.nombre}
                                    </button>
                                    </>
                                )}
                              </div>
                            );
                          }

                          return (
                            <button
                              key={promo.nombre}
                              onClick={() => agregarProducto(promo)}
                              className="producto-btn"
                            >
                              {promo.nombre} - ${promo.precio.toFixed(2)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }
              else if (Array.isArray(datos)) {
                return (
                  <div key={categoria} className={`categoria-productos ${estaAbierta ? 'categoria-activa' : ''}`}>
                    <h3
                      style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
                      onClick={toggleCategoria}
                    >
                      <ChevronIcon isOpen={estaAbierta} />
                      {categoria}
                    </h3>

                    {estaAbierta && (
                      <div className="productos-disponibles">
                        {datos.map((producto) => (
                          <button
                            key={producto.nombre}
                            onClick={() => agregarProducto(producto)}
                            className="producto-btn"
                          >
                            {producto.nombre} - ${producto.precio.toFixed(2)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              } else {
                return null;
              }
            })}

            {/* --- Sección de la Comanda (Resumen del pedido) --- */}
            <div className="comanda">
              <strong>Tu comanda:</strong>
              {formData.productos.length === 0 && <p>No has agregado nada aún.</p>}
              {formData.productos.map((item, index) => (
                <div key={index} className="comanda-item">
                  <span>{index + 1}. {item.nombre} - ${item.precio.toFixed(2)}</span>
                  <button onClick={() => handleEliminarProducto(index)}>X</button>
                </div>
              ))}

              {formData.productos.length > 0 && (
                <div className="total">
                  <strong>Total: </strong>$
                  {formData.productos.reduce((acc, item) => acc + item.precio, 0).toFixed(2)}
                </div>
              )}
            </div>
            <div className="step-buttons">
              <button onClick={() => setStep(1)}>Atrás</button>
              <button onClick={() => setStep(3)}>Siguiente</button>
            </div>
          </div>
        )}

        {/* --- Paso 3: Comentarios y Envío del Pedido --- */}
        {step === 3 && (
          <div className="popup-step">
            <h2>Comentarios</h2>
            <label>Comentarios extra</label>
            <textarea
              name="comentario"
              value={formData.comentario}
              onChange={handleInputChange}
              placeholder="Ejemplo: - Burgy sin lechuga - La orden de alitas sin verdura - Mis boneless muy crujientes"
              rows="4"
            />
            <div className="step-buttons">
              <button onClick={() => setStep(2)}>Atrás</button>
              <a
                href={generarMensaje()}
                target="_blank"
                rel="noopener noreferrer"
                className="enviar-btn"
              >
                Enviar pedido por WhatsApp
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PedidoPopup;