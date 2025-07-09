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
      marginRight: '8px', // Espacio entre el icono y el texto
      minWidth: size,    // Asegura que el tamaño del icono se respete
      minHeight: size,   // Asegura que el tamaño del icono se respete
    }}
  >
    <polyline points="9 18 15 12 9 6"></polyline>
  </svg>
);

// Mueve la declaración de productosMenu FUERA del componente PedidoPopup
// para que esté disponible antes de que el estado inicial de `seleccion` lo use.
const productosMenu = {
    Snacks: [
      { nombre: "Salchipulpos", precio: 30 },
      { nombre: "Salchipapas", precio: 45 },
      { nombre: "Happy Papas", precio: 60 },
      { nombre: "Nachos", precio: 35 },
      { nombre: "Happy Nachos", precio: 60 },
      { nombre: "Nuggets", precio: 50 },
      { nombre: "Dedos de Queso", precio: 50 },
      { nombre: "Aros de Cebolla", precio: 50 },
    ],
    Papas: {
      items: [
        { nombre: "Papas a la Francesa", precio: 35, maxSabores: 1 },
        { nombre: "Papas en Gajo", precio: 40, maxSabores: 1 },
      ],
      sabores: [
        "Ajo parmesano", "Pimienta limón", "Queso parmesano", "Paprika", "Naturales",
      ],
    },
    Alitas: {
      items: [
        { nombre: "8pzs (2 sabores)", precio: 72, maxSabores: 2 },
        { nombre: "16pzs (2 sabores)", precio: 139, maxSabores: 2 },
        { nombre: "25pzs (3 sabores)", precio: 209, maxSabores: 3 },
        { nombre: "50pzs (5 sabores)", precio: 399, maxSabores: 5 },
      ],
      sabores: [
        "Ajo parmesano", "Pimienta limón", "Queso parmesano", "BBQ",
        "Tamarindo", "Miel & mostaza", "Teriyaki", "Machas", "Habanero",
        "Búfalo", "Mango habanero", "Tamarindo habanero", "Habanero parmesano",
        "Sriracha", "Diabla", "Piña chipotle", "Valentina", "Pelón Pelo Rico",
        "Takis Blue", "Cheetos Flamin’ Hot", "Takis Fuego", "Doritos Cheddar"
      ],
    },
    Boneless: {
      items: [
        { nombre: "250g", precio: 99, maxSabores: 2 },
        { nombre: "500g", precio: 189, maxSabores: 2 },
        { nombre: "1kg", precio: 369, maxSabores: 4 },
      ],
      sabores: [
        "Ajo parmesano", "Pimienta limón", "Queso parmesano", "BBQ",
        "Tamarindo", "Miel & mostaza", "Teriyaki", "Machas", "Habanero",
        "Búfalo", "Mango habanero", "Tamarindo habanero", "Habanero parmesano",
        "Sriracha", "Diabla", "Piña chipotle", "Valentina", "Pelón Pelo Rico",
        "Takis Blue", "Cheetos Flamin’ Hot", "Takis Fuego", "Doritos Cheddar"
      ],
    },
    Burgys: [
      { nombre: "Burgy Res", precio: 89 },
      { nombre: "Burgy Pollo", precio: 89 },
      { nombre: "Burgy West", precio: 89 },
      { nombre: "Bonely", precio: 89 },
      { nombre: "Burgy Mexa", precio: 109 },
      { nombre: "Burgy Cheesy", precio: 109 },
      { nombre: "Mega Res", precio: 109 },
      { nombre: "Mega Pollo", precio: 109 },
      { nombre: "Mega West", precio: 109 },
    ],
    Doggys: [
      { nombre: "Doggy Club", precio: 99 },
      { nombre: "Doggy", precio: 89 },
      { nombre: "Doggy Wacamole", precio: 109 },
    ],
    "Paquetes de Alitas": [
      {
        nombre: "Paquete 1 Alitas (12 alitas + papas)",
        precio: 139,
        configurableItems: [
          { type: "Alitas", quantity: "12pzs", maxSabores: 2 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre) // Usa una función para acceder lazy-load
          },
        ],
      },
      {
        nombre: "Paquete 2 Alitas (30 alitas + papas)",
        precio: 289,
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
        nombre: "Paquete Kids (Escoge 8 Nuggets, 6 Alitas o Mini Burgy)", // Mantener nombre completo para las claves
        precio: 99,
        description: "Incluye: Papas a la Francesa (1 sabor), Jugo de Naranja y Paleta Payaso Mini.", // Descripción para el usuario
        configurableItems: [
          { type: "KidsMainOption", quantity: "Option", options: ["8 Nuggets", "6 Alitas", "Mini Burgy"] }, // Opción principal
          {
            type: "Papas",
            quantity: "Papas a la Francesa", // Tipo de papa fijo en paquete Kids
            maxSabores: 1,
            isGeneric: true,
            options: () => ["Papas a la Francesa"] // Solo Francesa para Kids
          },
          // Jugo y Postre ya NO son configurables aquí, se asumen incluidos
        ],
      },
      {
        nombre: "Boneless Box (500gr boneless + papas + dedos de queso + aros cebolla)",
        precio: 349,
        configurableItems: [
          { type: "Boneless", quantity: "500g", maxSabores: 2 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
        ],
      },
      {
        nombre: "Box Club (5 alitas + 5 boneless + 4 mini burgys + 4 aros cebolla + 4 dedos queso + papas)",
        precio: 249,
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
        configurableItems: [
          { type: "Alitas", quantity: "35pzs", maxSabores: 3 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
        ],
      },
      {
        nombre: "Burgy/Doggy Box (2 burgy/doggy + 10 alitas + 250gr papas)",
        precio: 289,
        configurableItems: [
          { type: "Alitas", quantity: "10pzs", maxSabores: 2 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
        ],
      },
    ],
    Postres: [
      { nombre: "Pan de Elote", precio: 30 },
      { nombre: "Chocoflan", precio: 40 },
      { nombre: "Elotty", precio: 50 },
      { nombre: "Bruce Cake", precio: 50 },
      { nombre: "Cookie Club", precio: 50 },
    ],
    Promociones: [
      {
        nombre: "Lunes: 10 Alitas + Papas + Bebida",
        precio: 149,
        dia: "Lunes",
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
        isDiscount: true,
        description: "Compra un DOGGY o BURGY y llévate un SHAKE por solo $49 (se aplica en tienda)",
      },
      {
        nombre: "Miércoles: 250gr Boneless + Papas + Bebida",
        precio: 159,
        dia: "Miércoles",
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
        isDiscount: true,
      },
      {
        nombre: "Viernes: MICHELADA 1 LITRO $70",
        precio: 70,
        dia: "Viernes",
        options: ["Con Clamato", "Sin Clamato"],
        isSpecialOffer: true,
      },
      {
        nombre: "Viernes: HAPPY HOUR DE SNACKS",
        precio: 0,
        dia: "Viernes",
        isDiscount: true,
        timeSensitive: true,
        description: "10% DESCUENTO de 3pm a 5pm",
      },
      {
        nombre: "Sábado: 20 Alitas + 2 Bebidas",
        precio: 209,
        dia: "Sábado",
        configurableItems: [
          { type: "Alitas", quantity: "20pzs", maxSabores: 2 },
          { type: "Bebida", quantity: "2 Bebidas", options: ["Agua de Jamaica", "Agua de Horchata", "Agua de Tamarindo", "Refresco"] } // Refresco 600ml
        ],
      },
      {
        nombre: "Sábado: 30 Alitas + Papas + Refresco 2L",
        precio: 329,
        dia: "Sábado",
        configurableItems: [
          { type: "Alitas", quantity: "30pzs", maxSabores: 3 },
          { type: "Papas", quantity: "Papas", maxSabores: 1, isGeneric: true,
            options: () => productosMenu.Papas.items.map(p => p.nombre)
          },
          { type: "Bebida", quantity: "Refresco 2L", options: ["Coca Cola", "Pepsi", "Sprite", "Fanta"] } // Opciones de refresco 2L
        ],
      },
    ],
    Bebidas: [
      { nombre: "Agua Natural", precio: 20 },
      { nombre: "Agua de Jamaica", precio: 25 },
      { nombre: "Agua de Horchata", precio: 25 },
      { nombre: "Agua de Tamarindo", precio: 25 },
      { nombre: "Agua de Maracuya", precio: 25 },
      { nombre: "Refresco", precio: 30 },
      { nombre: "Limonada Natural", precio: 30 },
      { nombre: "Limonada Mineral", precio: 35 },
      { nombre: "Naranjada Natural", precio: 30 },
      { nombre: "Naranjada Mineral", precio: 35 },
      { nombre: "Michelada Sin Alcohol", precio: 40 },
    ],
    "Shakes (Malteadas)": [
      { nombre: "Chocolate", precio: 55 },
      { nombre: "Fresa", precio: 55 },
      { nombre: "Vainilla", precio: 55 },
      { nombre: "De Temporada", precio: 60 },
    ],
    "Vino(187ml)": [
      { nombre: "Riunite Lambrussco", precio: 89 },
    ],
    Drinks: [
      { nombre: "Michelada 1L", precio: 80, options: ["Con Clamato", "Sin Clamato"] },
      { nombre: "Michelada 500ml", precio: 50, options: ["Con Clamato", "Sin Clamato"] },
      { nombre: "Blue Drink 1L", precio: 80 },
      { nombre: "Blue Drink 500ml", precio: 50 },
      { nombre: "Pinky Drink 1L", precio: 80 },
      { nombre: "Pinky Drink 500ml", precio: 50 },
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

  // Estado para manejar las selecciones configurables de productos y paquetes.
  // Las claves son dinámicas para soportar opciones dentro de diferentes paquetes.
  const [seleccion, setSeleccion] = useState({
    alitasPiezas: "",
    alitasSabores: [],
    bonelessGramaje: "",
    bonelessSabores: [],
    papasPiezas: "", // Esto es para papas INDIVIDUALES
    papasSabores: [], // Esto es para papas INDIVIDUALES
    // Adecuaciones para selecciones de paquetes/cajas específicas,
    // usando el nombre completo del producto como prefijo para la clave.
    'Paquete 1 Alitas (12 alitas + papas)_alitasSabores': [],
    'Paquete 1 Alitas (12 alitas + papas)_papasTipo': '', // Nuevo para tipo de papa
    'Paquete 1 Alitas (12 alitas + papas)_papasSabores': [],
    'Paquete 2 Alitas (30 alitas + papas)_alitasSabores': [],
    'Paquete 2 Alitas (30 alitas + papas)_papasTipo': '', // Nuevo para tipo de papa
    'Paquete 2 Alitas (30 alitas + papas)_papasSabores': [],
    'Paquete 3 Alitas (50 alitas + papas + dedos de queso)_alitasSabores': [],
    'Paquete 3 Alitas (50 alitas + papas + dedos de queso)_papasTipo': '', // Nuevo para tipo de papa
    'Paquete 3 Alitas (50 alitas + papas + dedos de queso)_papasSabores': [],
    'Paquete 1 Boneless (250gr + papas)_bonelessSabores': [],
    'Paquete 1 Boneless (250gr + papas)_papasTipo': '', // Nuevo para tipo de papa
    'Paquete 1 Boneless (250gr + papas)_papasSabores': [],
    'Paquete 2 Boneless (500gr + papas)_bonelessSabores': [],
    'Paquete 2 Boneless (500gr + papas)_papasTipo': '', // Nuevo para tipo de papa
    'Paquete 2 Boneless (500gr + papas)_papasSabores': [],
    'Paquete 3 Boneless (1.5kg + papas + dedos de queso)_bonelessSabores': [],
    'Paquete 3 Boneless (1.5kg + papas + dedos de queso)_papasTipo': '', // Nuevo para tipo de papa
    'Paquete 3 Boneless (1.5kg + papas + dedos de queso)_papasSabores': [],
    'Boneless Box (500gr boneless + papas + dedos de queso + aros cebolla)_bonelessSabores': [],
    'Boneless Box (500gr boneless + papas + dedos de queso + aros cebolla)_papasTipo': '', // Nuevo para tipo de papa
    'Boneless Box (500gr boneless + papas + dedos de queso + aros cebolla)_papasSabores': [],
    'Box Club (5 alitas + 5 boneless + 4 mini burgys + 4 aros cebolla + 4 dedos queso + papas)_alitasSabores': [],
    'Box Club (5 alitas + 5 boneless + 4 mini burgys + 4 aros cebolla + 4 dedos queso + papas)_bonelessSabores': [],
    'Box Club (5 alitas + 5 boneless + 4 mini burgys + 4 aros cebolla + 4 dedos queso + papas)_papasTipo': '', // Nuevo para tipo de papa
    'Box Club (5 alitas + 5 boneless + 4 mini burgys + 4 aros cebolla + 4 dedos queso + papas)_papasSabores': [],
    'Bendito Box (35 alitas + nuggets + papas + dedos queso + nachos)_alitasSabores': [],
    'Bendito Box (35 alitas + nuggets + papas + dedos queso + nachos)_papasTipo': '', // Nuevo para tipo de papa
    'Bendito Box (35 alitas + nuggets + papas + dedos queso + nachos)_papasSabores': [],
    'Burgy/Doggy Box (2 burgy/doggy + 10 alitas + 250gr papas)_alitasSabores': [],
    'Burgy/Doggy Box (2 burgy/doggy + 10 alitas + 250gr papas)_papasTipo': '', // Nuevo para tipo de papa
    'Burgy/Doggy Box (2 burgy/doggy + 10 alitas + 250gr papas)_papasSabores': [],
    // Nuevas promociones configurables
    'Lunes: 10 Alitas + Papas + Bebida_alitasSabores': [],
    'Lunes: 10 Alitas + Papas + Bebida_papasTipo': '', // Nuevo para tipo de papa
    'Lunes: 10 Alitas + Papas + Bebida_papasSabores': [],
    'Lunes: 10 Alitas + Papas + Bebida_bebidaBebida': [], // Para la bebida en promociones
    'Miércoles: 250gr Boneless + Papas + Bebida_bonelessSabores': [],
    'Miércoles: 250gr Boneless + Papas + Bebida_papasTipo': '', // Nuevo para tipo de papa
    'Miércoles: 250gr Boneless + Papas + Bebida_papasSabores': [],
    'Miércoles: 250gr Boneless + Papas + Bebida_bebidaBebida': [], // Para la bebida en promociones
    'Sábado: 20 Alitas + 2 Bebidas_alitasSabores': [],
    'Sábado: 20 Alitas + 2 Bebidas_bebidaBebida': [], // Para la bebida en promociones
    'Sábado: 30 Alitas + Papas + Refresco 2L_alitasSabores': [],
    'Sábado: 30 Alitas + Papas + Refresco 2L_papasTipo': '', // Nuevo para tipo de papa
    'Sábado: 30 Alitas + Papas + Refresco 2L_papasSabores': [],
    'Sábado: 30 Alitas + Papas + Refresco 2L_bebidaBebida': [], // Para la bebida en promociones

    // ADECUACIONES PARA PAQUETE KIDS: NUEVOS ESTADOS DE SELECCIÓN
    // Usamos el nombre completo del paquete para la clave
    'Paquete Kids (Escoge 8 Nuggets, 6 Alitas o Mini Burgy)_kidsMainOption': '', // Para elegir entre Nuggets, Alitas o Mini Burgy
    'Paquete Kids (Escoge 8 Nuggets, 6 Alitas o Mini Burgy)_papasTipo': '', // Para el tipo de papa de kids (siempre Francesa)
    'Paquete Kids (Escoge 8 Nuggets, 6 Alitas o Mini Burgy)_papasSabores': [], // Para los sabores de las papas de kids
    // Jugo y Postre NO están aquí porque no son seleccionables
  });

  // Estado para controlar qué categoría principal está abierta (Snacks, Papas, Paquetes, etc.)
  const [activeCategory, setActiveCategory] = useState(null);
  // Estado para controlar qué paquete específico está abierto dentro de una categoría (ej. 'Paquete 1 Alitas')
  const [activePackage, setActivePackage] = useState(null);

  const [ordenId] = useState(Math.floor(Math.random() * 100000));
  const [errors, setErrors] = useState({});
  const [micheladaOption, setMicheladaOption] = useState({}); // Para micheladas normales
  const [micheladaPromoOption, setMicheladaPromoOption] = useState({}); // Para la michelada de promo del viernes


  // Define el orden deseado de las categorías para la interfaz de usuario
  const orderedCategories = [
    "Snacks", "Papas", "Alitas", "Boneless",
    "Paquetes de Alitas", "Paquetes de Boneless", "Boxes",
    "Promociones", // La categoría de promociones se muestra aquí
    "Burgys", "Doggys", "Postres",
    "Bebidas", "Shakes (Malteadas)", "Vino(187ml)", "Drinks"
  ];

  // Función auxiliar para obtener el nombre del día actual (útil para promociones)
  const getDayName = (date) => {
    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    return days[date.getDay()];
  };

  const currentDay = getDayName(new Date());

  // Función auxiliar para obtener el número máximo de sabores según el tipo de producto y la cantidad/tamaño
  const getMaxSabores = (type, quantity) => {
    // Comprobar productos principales (Alitas, Boneless, Papas)
    if (type === "Alitas" && productosMenu.Alitas.items) {
      const item = productosMenu.Alitas.items.find(i => i.nombre === quantity);
      if (item) return item.maxSabores;
    }
    if (type === "Boneless" && productosMenu.Boneless.items) {
      const item = productosMenu.Boneless.items.find(i => i.nombre === quantity);
      if (item) return item.maxSabores;
    }
    // NOTA: Para papas, siempre es 1 sabor, pero se necesita un tipo (Francesa/Gajo)
    if (type === "Papas" && productosMenu.Papas.items) {
      const item = productosMenu.Papas.items.find(i => i.nombre === quantity);
      if (item) return item.maxSabores; // Esto siempre será 1 para Papas
    }
    // ADECUACIONES PARA PAQUETE KIDS: getMaxSabores para Papas a la Francesa del Kids
    if (type === "Papas" && quantity === "Papas a la Francesa") {
      return 1; // Papas a la francesa en paquete Kids siempre 1 sabor
    }


    // Comprobar los valores de cantidad dentro de los paquetes/cajas/promociones
    // Esto se usa cuando la 'cantidad' no es directamente el nombre de un item principal,
    // sino una descripción dentro de un paquete configurable.
    if (type === "Alitas") {
        if (quantity.includes("8pzs") || quantity.includes("16pzs") || quantity.includes("12pzs") || quantity.includes("10pzs") || quantity.includes("20pzs") || quantity.includes("6 Alitas")) return 2; // Añadido "6 Alitas" para Paquete Kids
        if (quantity.includes("25pzs") || quantity.includes("30pzs") || quantity.includes("35pzs")) return 3;
        if (quantity.includes("50pzs")) return 5;
        if (quantity.includes("5pzs")) return 1;
    }
    if (type === "Boneless") {
        if (quantity.includes("250g") || quantity.includes("500g") || quantity.includes("5pzs")) return 2;
        if (quantity.includes("1kg") || quantity.includes("1.5kg")) return 4;
    }
    if (type === "Papas") {
        return 1; // Cualquier artículo de Papas en un paquete/promo debe permitir 1 sabor
    }

    return 0; // Por defecto si no hay coincidencia específica
  };

  // Manejador para los campos de texto/selección de datos del cliente
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined })); // Limpia errores al cambiar
  };

  // Manejador para la selección de opciones de productos (sabores, bebidas, tipos de papas, opciones kids, etc.)
  const handleSeleccionChange = (itemType, tipo, valor, parentProductName = null) => {
    const keyBase = itemType.toLowerCase(); // 'alitas', 'boneless', 'papas', 'bebida', 'kidsmainoption'
    let currentSelectionStateKey; // Clave para acceder al estado `seleccion`

    setSeleccion((prev) => {
      const newSelection = { ...prev };

      if (parentProductName) {
        // Si es una selección dentro de un producto configurable de un paquete/box/promoción
        if (tipo === "Sabor") {
          currentSelectionStateKey = `${parentProductName}_${keyBase}Sabores`;
        } else if (tipo === "Bebida") {
          currentSelectionStateKey = `${parentProductName}_${keyBase}Bebida`;
        } else if (tipo === "Tipo") { // Nuevo: para seleccionar el tipo de papa
          currentSelectionStateKey = `${parentProductName}_${keyBase}Tipo`;
        }
        // ADECUACIONES PARA PAQUETE KIDS: Manejo de KidsMainOption
        else if (itemType === "KidsMainOption") {
          currentSelectionStateKey = `${parentProductName}_kidsMainOption`; // Clave para la opción principal
          newSelection[currentSelectionStateKey] = valor;
          return newSelection; // Retorna temprano para este tipo de selección única
        }
        // Jugo y Postre ya NO se gestionan aquí, son fijos en el paquete Kids
      } else if (tipo === "Sabor") {
        // Para sabores de productos principales (Alitas, Boneless, Papas)
        currentSelectionStateKey = `${keyBase}Sabores`;
      } else {
        // Para la selección inicial de cantidad/gramaje de productos principales
        currentSelectionStateKey = `${keyBase}${tipo}`; // Ej. 'alitasPiezas', 'bonelessGramaje'
      }

      if (tipo === "Piezas" || tipo === "Gramaje" || tipo === "Tipo" || itemType === "KidsMainOption") {
        newSelection[currentSelectionStateKey] = valor;
        // Si cambia el tipo de papa, se deben limpiar los sabores asociados a esa papa en el paquete.
        if (tipo === "Tipo" && parentProductName) {
            newSelection[`${parentProductName}_papasSabores`] = [];
        } else if (tipo === "Piezas" || tipo === "Gramaje") { // Para productos principales
            newSelection[`${keyBase}Sabores`] = [];
        }
      } else if (tipo === "Sabor") {
        // Lógica para añadir/quitar sabores, respetando el `maxSabores`
        let quantityForFlavor = ""; // Esta es la "cantidad" de alitas/boneless/papas para calcular el maxSabores

        if (parentProductName) {
            // Determinar la cantidad/tipo para un elemento configurable dentro de un paquete
            let parentCategoryArray = [];
            // Lógica para encontrar la configuración del paquete padre
            if (parentProductName.includes("Paquete ")) {
                if (parentProductName.includes("Alitas")) parentCategoryArray = productosMenu["Paquetes de Alitas"];
                else if (parentProductName.includes("Boneless")) parentCategoryArray = productosMenu["Paquetes de Boneless"];
            } else if (parentProductName.includes("Box")) {
                parentCategoryArray = productosMenu.Boxes;
            } else if (parentProductName.includes("Lunes:") || parentProductName.includes("Miércoles:") || parentProductName.includes("Sábado:")) {
                parentCategoryArray = productosMenu.Promociones;
            }

            const parentProduct = parentCategoryArray.find(p => p.nombre === parentProductName);

            if (parentProduct && parentProduct.configurableItems) {
                const itemConfig = parentProduct.configurableItems.find(item => item.type === itemType);
                if (itemConfig) {
                    quantityForFlavor = itemConfig.quantity; // Ej. "12pzs", "Papas"
                }
            }
        } else {
            // Para Alitas, Boneless, Papas principales, se usa la cantidad ya seleccionada
            quantityForFlavor = newSelection[`${keyBase}${itemType === "Alitas" ? "Piezas" : itemType === "Boneless" ? "Gramaje" : "Piezas"}`];
        }

        const maxSabores = getMaxSabores(itemType, quantityForFlavor);
        const currentFlavors = newSelection[currentSelectionStateKey] || []; // Usar currentSelectionStateKey
        const isSelected = currentFlavors.includes(valor);

        if (isSelected) {
          // Si ya está seleccionado, lo quita
          newSelection[currentSelectionStateKey] = currentFlavors.filter((s) => s !== valor); // Usar currentSelectionStateKey
        } else {
          // Si no está seleccionado y hay espacio, lo añade
          if (currentFlavors.length < maxSabores) {
            newSelection[currentSelectionStateKey] = [...currentFlavors, valor]; // Usar currentSelectionStateKey
          } else {
            alert(`Ya seleccionaste el máximo de ${maxSabores} sabor(es) para este producto.`);
          }
        }
      } else if (tipo === "Bebida") { // Lógica para seleccionar bebidas en promociones
        const currentBebidas = newSelection[currentSelectionStateKey] || []; // Usar currentSelectionStateKey
        const isSelected = currentBebidas.includes(valor);
        let maxBebidas = 1; // Por defecto, una bebida

        // Ajusta el máximo de bebidas si la promoción lo especifica
        if (parentProductName && (parentProductName.includes("2 Bebidas") || parentProductName.includes("Sábado: 20 Alitas"))) {
            maxBebidas = 2;
        }

        if (isSelected) {
            newSelection[currentSelectionStateKey] = currentBebidas.filter((b) => b !== valor); // Usar currentSelectionStateKey
        } else {
            if (currentBebidas.length < maxBebidas) {
                newSelection[currentSelectionStateKey] = [...currentBebidas, valor]; // Usar currentSelectionStateKey
            } else {
                alert(`Ya seleccionaste el máximo de ${maxBebidas} bebida(s) para esta promoción.`);
            }
        }
      }
      return newSelection;
    });
  };

  // Función para agregar productos "especiales" (Alitas, Boneless, Papas con selección de cantidad y sabores)
// Función para agregar productos "especiales" (Alitas, Boneless, Papas con selección de cantidad y sabores)
  const agregarProductoEspecial = (categoria) => {
    const keyBase = categoria.toLowerCase();
    let cantidadNombre = "";
    let precio = 0;
    let sabores = [];
    let medidaTipo = ""; // <--- ¡Declarar medidaTipo aquí!

    // Determina la cantidad seleccionada y el precio basado en la categoría
    if (categoria === "Boneless") {
      cantidadNombre = seleccion.bonelessGramaje;
      const item = productosMenu.Boneless.items.find(g => g.nombre === cantidadNombre);
      if (item) precio = item.precio;
      sabores = seleccion.bonelessSabores;
      medidaTipo = "Gramaje"; // Asignar aquí
    } else if (categoria === "Alitas") {
      cantidadNombre = seleccion.alitasPiezas;
      const item = productosMenu.Alitas.items.find(g => g.nombre === cantidadNombre);
      if (item) precio = item.precio;
      sabores = seleccion.alitasSabores;
      medidaTipo = "Piezas"; // Asignar aquí
    } else if (categoria === "Papas") {
      cantidadNombre = seleccion.papasPiezas; // Esto es para Papas INDIVIDUALES
      const item = productosMenu.Papas.items.find(g => g.nombre === cantidadNombre);
      if (item) precio = item.precio;
      sabores = seleccion.papasSabores;
      medidaTipo = "Piezas"; // Asignar aquí (o "Tipo" si se quisiera especificar más, pero Piezas es consistente con el estado)
    }

    const maxSabores = getMaxSabores(categoria, cantidadNombre);

    // Valida que se haya seleccionado una cantidad y el número correcto de sabores
    // Para Papas individuales, siempre es 1 sabor, o ninguno si es "Naturales" o similar que no requiere selección.
    const isPapasButNoFlavorNeeded = categoria === "Papas" && (maxSabores === 0 || (cantidadNombre && sabores.length === 0 && maxSabores === 1 && productosMenu.Papas.sabores.includes("Naturales")));

    if (cantidadNombre && (sabores.length === maxSabores || isPapasButNoFlavorNeeded) && maxSabores >= 0) {
      const nombreCompleto = `${cantidadNombre} ${categoria}` + (sabores.length > 0 ? ` (${sabores.join(" + ")})` : "");
      setFormData((prev) => ({
        ...prev,
        productos: [...prev.productos, { nombre: nombreCompleto, precio }],
      }));
      // Restablece la selección después de agregar
      setSeleccion((prev) => ({
        ...prev,
        [`${keyBase}${medidaTipo}`]: "", // Ahora medidaTipo está definida
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

  // Función para agregar un producto de tipo "paquete" o "box" con ítems configurables
  const agregarProductoPaquete = (paqueteProducto) => {
    const { nombre, precio, configurableItems, description } = paqueteProducto; // Obtener también la descripción
    let finalProductName = nombre;
    const itemDetails = [];
    let allConfigured = true; // Flag para verificar si todas las opciones están seleccionadas

    if (configurableItems && configurableItems.length > 0) {
      configurableItems.forEach(itemConfig => {
        const itemType = itemConfig.type;
        let currentSelectionStateKey;
        let selectedValueOrItems; // Usaremos esto para cualquier tipo de selección
        let maxCount;

        if (itemType === "Alitas" || itemType === "Boneless" || itemType === "Papas") {
            // ADECUACIONES PARA PAQUETE KIDS: Manejo de Papas dentro de Kids
            if (nombre.includes("Paquete Kids") && itemType === "Papas") {
                currentSelectionStateKey = `${nombre}_papasTipo`;
                const papaTipoSeleccionada = seleccion[currentSelectionStateKey];
                if (!papaTipoSeleccionada) {
                    allConfigured = false;
                    return;
                }
                itemDetails.push(papaTipoSeleccionada); // Agrega el tipo de papa al nombre final

                // Luego, verifica los sabores si aplica al tipo de papa
                currentSelectionStateKey = `${nombre}_papasSabores`; // Cambia la key para los sabores de papas
                selectedValueOrItems = seleccion[currentSelectionStateKey] || [];
                maxCount = getMaxSabores(itemType, papaTipoSeleccionada); // Obtiene maxSabores para el tipo de papa elegido
                if (maxCount > 0 && selectedValueOrItems.length !== maxCount) {
                    allConfigured = false;
                }
                if (selectedValueOrItems.length > 0) {
                    itemDetails.push(`(${selectedValueOrItems.join(" + ")})`);
                }

            } else { // Alitas, Boneless, o Papas en otros paquetes
                currentSelectionStateKey = `${nombre}_${itemType.toLowerCase()}${itemType === "Papas" ? 'Tipo' : 'Sabores'}`; // Papas tienen Tipo y luego Sabores

                if (itemType === "Papas") {
                    const papaTipoSeleccionada = seleccion[currentSelectionStateKey];
                    if (!papaTipoSeleccionada) {
                        allConfigured = false;
                        return;
                    }
                    itemDetails.push(papaTipoSeleccionada);

                    currentSelectionStateKey = `${nombre}_papasSabores`;
                    selectedValueOrItems = seleccion[currentSelectionStateKey] || [];
                    maxCount = getMaxSabores(itemType, papaTipoSeleccionada);
                    if (maxCount > 0 && selectedValueOrItems.length !== maxCount) {
                        allConfigured = false;
                    }
                    if (selectedValueOrItems.length > 0) {
                        itemDetails.push(`(${selectedValueOrItems.join(" + ")})`);
                    }
                } else { // Alitas o Boneless
                    selectedValueOrItems = seleccion[currentSelectionStateKey] || [];
                    maxCount = getMaxSabores(itemType, itemConfig.quantity);
                    if (maxCount > 0 && selectedValueOrItems.length !== maxCount) {
                        allConfigured = false;
                    }
                    if (selectedValueOrItems.length > 0) {
                        itemDetails.push(`${itemType} (${selectedValueOrItems.join(" + ")})`);
                    }
                }
            }
        } else if (itemType === "Bebida") {
            currentSelectionStateKey = `${nombre}_${itemType.toLowerCase()}Bebida`;
            selectedValueOrItems = seleccion[currentSelectionStateKey] || [];
            maxCount = itemConfig.quantity.includes('2 Bebidas') ? 2 : 1;
            if (selectedValueOrItems.length !== maxCount) {
                allConfigured = false;
            }
            if (selectedValueOrItems.length > 0) {
                itemDetails.push(`${itemConfig.quantity} (${selectedValueOrItems.join(" + ")})`);
            }
        }
        // ADECUACIONES PARA PAQUETE KIDS: Validaciones para KidsMainOption
        else if (itemType === "KidsMainOption") {
            currentSelectionStateKey = `${nombre}_kidsMainOption`;
            selectedValueOrItems = seleccion[currentSelectionStateKey];
            if (!selectedValueOrItems) { // Si no se ha seleccionado la opción principal, no está configurado
                allConfigured = false;
            } else {
                itemDetails.push(selectedValueOrItems);
            }
        }
        // Jugo y Postre YA NO se gestionan aquí, son fijos en la descripción.
      });

      // ADECUACIONES PARA PAQUETE KIDS: Añadir los elementos fijos a los detalles del nombre del producto
      if (nombre.includes("Paquete Kids")) {
        itemDetails.push("Jugo de Naranja");
        itemDetails.push("Paleta Payaso Mini");
        // La descripción completa (el campo `description` del objeto `productosMenu`) NO se concatena aquí
        // Su propósito es solo informativo en la vista de selección.
      }

      // Construye el nombre final del producto incluyendo las opciones seleccionadas
      if (itemDetails.length > 0) {
        finalProductName = `${nombre} (${itemDetails.join(" y ")})`;
      }
    }

    // Si no todas las opciones configurables están seleccionadas, muestra una alerta y no agrega el producto
    if (!allConfigured) {
      alert("Por favor, selecciona todas las opciones requeridas para este producto.");
      return;
    }

    // Agrega el producto al pedido
    setFormData((prev) => ({
      ...prev,
      productos: [...prev.productos, { nombre: finalProductName, precio }],
    }));

    // Restablece las selecciones para el paquete que acaba de ser agregado
    setSeleccion(prev => {
        const newState = { ...prev };
        if (configurableItems) {
            configurableItems.forEach(itemConfig => {
                const itemType = itemConfig.type;
                if (itemType === "Alitas" || itemType === "Boneless") {
                    newState[`${nombre}_${itemType.toLowerCase()}Sabores`] = [];
                } else if (itemType === "Papas") {
                    newState[`${nombre}_papasTipo`] = ''; // Limpia el tipo de papa
                    newState[`${nombre}_papasSabores`] = []; // Limpia los sabores de papa
                } else if (itemType === "Bebida") {
                    newState[`${nombre}_bebidaBebida`] = [];
                }
                // ADECUACIONES PARA PAQUETE KIDS: Limpia solo la opción principal de Kids
                else if (itemType === "KidsMainOption") {
                    newState[`${nombre}_kidsMainOption`] = '';
                }
                // Jugo y Postre ya no necesitan ser limpiados porque no son seleccionables
            });
        }
        return newState;
    });
  };

  // Función genérica para agregar productos simples (sin opciones configurables)
  const agregarProducto = (producto) => {
    setFormData((prev) => ({
      ...prev,
      productos: [...prev.productos, producto],
    }));
  };

  // Elimina un producto del resumen del pedido
  const handleEliminarProducto = (index) => {
    setFormData((prev) => {
      const productos = [...prev.productos];
      productos.splice(index, 1);
      return { ...prev, productos };
    });
  };

  // Valida los campos del primer paso del formulario (datos del cliente)
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
    return Object.keys(newErrors).length === 0; // Retorna true si no hay errores
  };

  // Genera el mensaje de WhatsApp con el resumen del pedido
  const generarMensaje = () => {
    const { nombre, telefono, direccion, sucursal, tienda, productos, comentario } = formData;

    const total = productos.reduce((acc, item) => acc + item.precio, 0).toFixed(2);

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

    texto += `\n*Total estimado: $${total}*`;
    texto += `\n\n¡Gracias por tu pedido!`;

    // Define el número de WhatsApp según la sucursal
    let telefonoWhatsApp = "";
    if (tienda === "xico") telefonoWhatsApp = "522283544463"; // Número de Xico
    else if (tienda === "coatepec") telefonoWhatsApp = "522284032836"; // Número de Coatepec

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
            <h2>1. Tus datos</h2>
            <label>Nombre</label>
            <input
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              className={errors.nombre ? "input-error" : ""} // Aplica clase para error
            />
            {errors.nombre && <p className="error-message">{errors.nombre}</p>} {/* Muestra mensaje de error */}

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
                if (validateStep1()) { // Valida el paso antes de avanzar
                  setStep(2);
                }
              }}>Siguiente</button>
            </div>
          </div>
        )}

        {/* --- Paso 2: Selección de productos --- */}
        {step === 2 && (
          <div className="popup-step">
            <h2>2. Tu pedido</h2>
            {/* Mapea y renderiza las categorías en el orden definido en `orderedCategories` */}
            {orderedCategories.map((categoria) => {
              const datos = productosMenu[categoria];
              if (!datos) return null; // No renderiza si la categoría no existe en el menú

              // Determina si la categoría actual debe estar abierta (usando activeCategory del estado)
              const estaAbierta = activeCategory === categoria;

              // Función para alternar la visibilidad de la categoría al hacer clic en su encabezado
              const toggleCategoria = () => {
                setActiveCategory(activeCategory === categoria ? null : categoria);
                // Si la categoría que se está cerrando es diferente a la que se abre,
                // asegura que ningún paquete interno quede abierto por error.
                if (activeCategory !== categoria) {
                    setActivePackage(null);
                }
              };

              // --- Manejador para las secciones principales de Alitas, Boneless, Papas (con selección de cantidad y sabores) ---
              if (categoria === "Alitas" || categoria === "Boneless" || categoria === "Papas") {
                const keyBase = categoria.toLowerCase(); // 'alitas', 'boneless', 'papas'
                // Determina la clave de estado para la cantidad (Piezas o Gramaje)
                const medidaTipo = categoria === "Alitas" ? "Piezas" : categoria === "Boneless" ? "Gramaje" : "Piezas";
                const cantidadSeleccionada = seleccion[`${keyBase}${medidaTipo}`]; // Valor de la cantidad seleccionada
                const saboresSeleccionados = seleccion[`${keyBase}Sabores`]; // Array de sabores seleccionados
                const maxSabores = getMaxSabores(categoria, cantidadSeleccionada); // Máximo de sabores permitidos
                // Condición para habilitar el botón "Agregar"
                const canAddSpecialProduct = cantidadSeleccionada && (maxSabores === 0 || saboresSeleccionados.length === maxSabores);

                return (
                  <div key={categoria} className={`categoria-productos ${estaAbierta ? 'categoria-activa' : ''}`}>
                    <h3
                      style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
                      onClick={toggleCategoria}
                    >
                      <ChevronIcon isOpen={estaAbierta} /> {/* Icono de flecha */}
                      {categoria}
                    </h3>

                    {estaAbierta && ( // Muestra el contenido solo si la categoría está activa
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
                        {cantidadSeleccionada && maxSabores > 0 && ( // Muestra selección de sabores si hay cantidad y sabores requeridos
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
                                  // Deshabilita el botón si ya se alcanzó el máximo de sabores y este no está seleccionado
                                  disabled={!saboresSeleccionados.includes(sabor) && saboresSeleccionados.length >= maxSabores}
                                >
                                  {sabor}
                                </button>
                              ))}
                            </div>
                            {/* Mensajes de error/ayuda para la selección de sabores */}
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
                          disabled={!canAddSpecialProduct} // Deshabilita si no se cumplen las condiciones
                        >
                          Agregar {cantidadSeleccionada || categoria}
                        </button>
                      </>
                    )}
                  </div>
                );
              }
              // --- Manejador para bebidas con opciones (ej. Micheladas normales) ---
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
                            {/* Botón principal del producto */}
                            <button
                              onClick={() => {
                                // Si no tiene opciones, se agrega directamente
                                if (!producto.options) {
                                  agregarProducto(producto);
                                }
                              }}
                              className="producto-btn"
                              // Si tiene opciones, se deshabilita hasta que se elija una
                              disabled={producto.options && !micheladaOption[producto.nombre]}
                            >
                              {producto.nombre} - ${producto.precio.toFixed(2)}
                            </button>
                            {producto.options && ( // Muestra las opciones si existen
                              <div className="michelada-options">
                                <p className="help-text">Elige una opción:</p>
                                {producto.options.map(option => (
                                  <button
                                    key={`${producto.nombre}-${option}`}
                                    className={`option-btn ${micheladaOption[producto.nombre] === option ? "activo" : ""}`}
                                    onClick={() => {
                                      setMicheladaOption(prev => ({ ...prev, [producto.nombre]: option }));
                                      // Agrega el producto directamente al seleccionar la opción
                                      if (producto.nombre.includes("Michelada")) {
                                        agregarProducto({
                                          nombre: `${producto.nombre} (${option})`,
                                          precio: producto.precio
                                        });
                                        setMicheladaOption(prev => ({ ...prev, [producto.nombre]: undefined })); // Limpia la opción después de agregar
                                      }
                                    }}
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
              // --- Manejador para Paquetes y Cajas configurables (con opciones anidadas) ---
              else if (categoria.includes("Paquetes") || categoria === "Boxes") {
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
                          // Determina si este paquete específico está abierto para mostrar sus opciones
                          const isPackageActive = activePackage === paqueteProducto.nombre;
                          return (
                          <div key={paqueteProducto.nombre} className={`producto-item-with-options ${isPackageActive ? 'activo' : ''}`}>
                            <h4
                                style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
                                onClick={() => setActivePackage(isPackageActive ? null : paqueteProducto.nombre)} // Alterna la visibilidad del paquete
                            >
                                <ChevronIcon isOpen={isPackageActive} size={20} color='#333' /> {/* Icono para paquetes */}
                                {paqueteProducto.nombre} - ${paqueteProducto.precio.toFixed(2)}
                            </h4>
                            {/* Muestra la descripción extra para el Paquete Kids */}
                            {paqueteProducto.nombre.includes("Paquete Kids") && isPackageActive && (
                                <p className="help-text" style={{margin: '0.5rem 0', fontStyle: 'italic'}}>{paqueteProducto.description}</p>
                            )}
                            {isPackageActive && ( // Muestra los ítems configurables solo si el paquete está activo
                                <>
                                {paqueteProducto.configurableItems && paqueteProducto.configurableItems.map((itemConfig, idx) => {
                                    const itemType = itemConfig.type; // Ej. 'Alitas', 'Boneless', 'Papas', 'Bebida', 'KidsMainOption'
                                    let itemOptions = [];
                                    let labelText = "";
                                    let isFlavorSelection = false;
                                    let currentSelectionStateKey; // Declarada aquí para este scope
                                    let selectedItemsOrOption; // Usado para cualquier tipo de selección: string o array
                                    let maxCount = 1; // Default para items simples o de tipo

                                    // Determina las opciones disponibles y el texto de la etiqueta
                                    if (itemType === "Alitas" || itemType === "Boneless") {
                                      itemOptions = productosMenu[itemType]?.sabores;
                                      labelText = `${itemType} - Elige Condimentos`;
                                      isFlavorSelection = true;
                                      currentSelectionStateKey = `${paqueteProducto.nombre}_${itemType.toLowerCase()}Sabores`;
                                      selectedItemsOrOption = seleccion[currentSelectionStateKey] || [];
                                      maxCount = getMaxSabores(itemType, itemConfig.quantity);
                                    } else if (itemType === "Papas") {
                                      // Para Papas, primero se elige el tipo (Francesa/Gajo)
                                      // itemConfig.options es una función, así que la llamamos
                                      itemOptions = itemConfig.options();
                                      labelText = "Tipo de Papas";
                                      currentSelectionStateKey = `${paqueteProducto.nombre}_papasTipo`;
                                      selectedItemsOrOption = seleccion[currentSelectionStateKey] || '';

                                      // Si ya se seleccionó el tipo de papa, mostrar opciones de sabor
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
                                                        disabled={selectedItemsOrOption && selectedItemsOrOption !== option} // Deshabilita si ya hay una seleccionada y no es esta
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
                                    } else if (itemType === "Bebida") {
                                      itemOptions = itemConfig.options;
                                      labelText = `${itemConfig.quantity} - Elige Bebida`;
                                      currentSelectionStateKey = `${paqueteProducto.nombre}_bebidaBebida`;
                                      selectedItemsOrOption = seleccion[currentSelectionStateKey] || [];
                                      maxCount = itemConfig.quantity.includes('2 Bebidas') ? 2 : 1;
                                    }
                                    // ADECUACIONES PARA PAQUETE KIDS: Renderizado de la opción principal de Kids
                                    else if (itemType === "KidsMainOption") {
                                        itemOptions = itemConfig.options;
                                        labelText = "Elige tu Opción Principal";

                                        currentSelectionStateKey = `${paqueteProducto.nombre}_kidsMainOption`;
                                        selectedItemsOrOption = seleccion[currentSelectionStateKey] || ''; // Es un string
                                        maxCount = 1; // Solo se puede elegir 1 opción principal

                                        return (
                                            <div key={`${paqueteProducto.nombre}-${itemType}-${idx}`} style={{width: '100%', textAlign: 'center'}}>
                                                <label style={{marginTop: '1rem'}}>{labelText}</label>
                                                <div className="productos-disponibles">
                                                    {itemOptions.map(option => (
                                                        <button
                                                            key={`${paqueteProducto.nombre}-${itemType}-${option}`}
                                                            className={`producto-btn ${selectedItemsOrOption === option ? "activo" : ""}`}
                                                            // Lógica para permitir deseleccionar
                                                            onClick={() => {
                                                                if (selectedItemsOrOption === option) {
                                                                    handleSeleccionChange(itemType, itemType, '', paqueteProducto.nombre); // Deseleccionar
                                                                } else {
                                                                    handleSeleccionChange(itemType, itemType, option, paqueteProducto.nombre); // Seleccionar
                                                                }
                                                            }}
                                                            // Deshabilita otras opciones si ya hay una seleccionada y no es la actual
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
                                    // Jugo y Postre ya no se renderizan aquí como configurables


                                    // Si no hay opciones o no está configurado, no renderiza este sub-item (excepto para Papas que ya se manejó y KidsMainOption que se manejó arriba)
                                    if (!itemOptions || itemOptions.length === 0 || itemType === "Papas" || itemType === "KidsMainOption") return null;

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
                                                        // Llama a handleSeleccionChange pasando el nombre del paquete padre
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
              // --- Manejador para Promociones (con validación de día y opciones configurables) ---
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
                          // Filtrar promociones para mostrar solo las del día actual (o sin restricción de día)
                          if (promo.dia && promo.dia !== currentDay) {
                            return null;
                          }

                          // Promociones de descuento o informativas (sin botón de agregar)
                          if (promo.isDiscount) {
                            return (
                              <div key={promo.nombre} className="promo-info-card">
                                <h4>{promo.nombre}</h4>
                                <p>{promo.description || "Pregunta en tienda por esta promoción."}</p>
                                {promo.timeSensitive && <p className="time-info">(Solo de 3pm a 5pm)</p>}
                              </div>
                            );
                          }

                          // Promociones con opciones de bebida (ej. Michelada Viernes)
                          if (promo.isSpecialOffer && promo.options) {
                            return (
                              <div key={promo.nombre} className="producto-item-with-options">
                                <button
                                  onClick={() => {
                                    if (!micheladaPromoOption[promo.nombre]) {
                                      alert("Por favor, selecciona una opción para la Michelada.");
                                      return;
                                    }
                                    agregarProducto({
                                      nombre: `${promo.nombre} (${micheladaPromoOption[promo.nombre]})`,
                                      precio: promo.precio
                                    });
                                    setMicheladaPromoOption(prev => ({ ...prev, [promo.nombre]: undefined })); // Limpiar después de agregar
                                  }}
                                  className="producto-btn"
                                  disabled={!micheladaPromoOption[promo.nombre]} // Deshabilita hasta seleccionar opción
                                >
                                  {promo.nombre} - ${promo.precio.toFixed(2)}
                                </button>
                                <div className="michelada-options">
                                  <p className="help-text">Elige una opción:</p>
                                  {promo.options.map(option => (
                                    <button
                                      key={`${promo.nombre}-${option}`}
                                      className={`option-btn ${micheladaPromoOption[promo.nombre] === option ? "activo" : ""}`}
                                      onClick={() => setMicheladaPromoOption(prev => ({ ...prev, [promo.nombre]: option }))}
                                    >
                                      {option}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            );
                            }

                          // Promociones configurables (Lunes, Miércoles, Sábado)
                          if (promo.configurableItems) {
                             const isPromoActive = activePackage === promo.nombre; // Usamos activePackage para las promos también
                            return (
                              <div key={promo.nombre} className={`producto-item-with-options ${isPromoActive ? 'activo' : ''}`}>
                                <h4
                                    style={{ cursor: "pointer", userSelect: "none", display: "flex", alignItems: "center" }}
                                    onClick={() => setActivePackage(isPromoActive ? null : promo.nombre)} // Alterna la visibilidad de la promo
                                >
                                    <ChevronIcon isOpen={isPromoActive} size={20} color='#333' /> {/* Icono para promociones */}
                                    {promo.nombre} - ${promo.precio.toFixed(2)}
                                </h4>
                                {isPromoActive && ( // Muestra los ítems configurables solo si la promo está activa
                                    <>
                                    {promo.configurableItems.map((itemConfig, idx) => {
                                        const itemType = itemConfig.type;
                                        let itemOptions = [];
                                        let labelText = "";
                                        let isFlavorSelection = false;
                                        let currentSelectionStateKey; // Declarada aquí para este scope
                                        let selectedItemsOrOption; // Usado para cualquier tipo de selección: string o array
                                        let maxCount = 1;

                                        if (itemType === "Alitas" || itemType === "Boneless") {
                                          itemOptions = productosMenu[itemType]?.sabores;
                                          labelText = `${itemType} - Elige Condimentos`;
                                          isFlavorSelection = true;
                                          currentSelectionStateKey = `${promo.nombre}_${itemType.toLowerCase()}Sabores`;
                                          selectedItemsOrOption = seleccion[currentSelectionStateKey] || [];
                                          maxCount = getMaxSabores(itemType, itemConfig.quantity);
                                        } else if (itemType === "Papas") {
                                          itemOptions = itemConfig.options(); // Llama a la función
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
                                                            // Llama a handleSeleccionChange pasando el nombre de la promo padre
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
                                      onClick={() => agregarProductoPaquete(promo)} // Usamos agregarProductoPaquete para promociones configurables
                                    >
                                      Agregar {promo.nombre}
                                    </button>
                                    </>
                                )}
                              </div>
                            );
                          }

                          // Fallback para cualquier otra promoción simple (sin opciones ni configurables)
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
              // --- Manejador por defecto para listas de productos simples (Snacks, Burgys, Doggys, Postres, etc.) ---
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
                return null; // Si no coincide con ningún tipo de categoría manejado
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
            <h2>3. Comentarios</h2>
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
                href={generarMensaje()} // Genera el enlace de WhatsApp
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