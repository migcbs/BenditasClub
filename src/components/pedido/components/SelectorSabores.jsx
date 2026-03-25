// src/components/pedido/components/SelectorSabores.jsx

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "../styles/selectorSabores.css";

const SABORES_ALITAS = [
  "Ajo parmesano","Pimienta limón","Queso parmesano",
  "BBQ","Tamarindo","Miel & mostaza","Teriyaki",
  "Machas","Habanero","Búfalo","Mango habanero",
  "BBQ Habanero","Tamarindo habanero","Habanero parmesano",
  "Sriracha","Diabla","Piña chipotle","Valentina",
  "Pelón Pelo Rico","Takis Blue","Cheetos Flamin' Hot",
  "Takis Fuego","Doritos Cheddar","Naturales",
];
const CONDIMENTOS_PAPAS = ["Naturales","Ajo parmesano","Pimienta limón","Queso parmesano","Paprika"];
const TIPOS_PAPAS       = ["Papas a la Francesa","Papas en Gajos"];

// ── Detectar tipo de producto de forma robusta ─────────────────
const detectarTipo = (producto) => {
  const n = (producto.nombre || "").toLowerCase().trim();
  const cat = (producto.categoria || producto.category || "").toLowerCase();

  // Orden importante: más específico primero
  if (cat === "boxes" || cat.includes("box")) return "box";
  if (n === "box #1" || n === "box #2" || n === "box #3") return "box";
  if (n.includes("bendito box"))   return "box";
  if (n.includes("burgy") && n.includes("doggy")) return "burgy-doggy-box";
  if (n.includes("box club"))      return "box";
  if (n.includes("box"))           return "box";
  if (n.includes("kids"))          return "kids";
  if (n.includes("burgy") || n.includes("bonely")) return "burgy";
  if (n.includes("doggy"))         return "doggy";
  if (n.includes("alita"))         return "alitas";
  if (n.includes("boneless") && !n.includes("papas")) return "boneless";
  if (n.includes("papas") && n.includes("boneless")) return "papas-boneless";
  if (n.includes("papas") || n.includes("papa")) return "papas";
  if (producto.opciones?.length > 0) return "bebida";
  return null;
};

const construirRondas = (producto) => {
  const tipo = detectarTipo(producto);
  const n = (producto.nombre || "").toLowerCase();

  // DEBUG: log en consola para verificar detección
  console.log("[SelectorSabores] producto:", producto.nombre, "→ tipo:", tipo);

  switch (tipo) {
    case "alitas":
      return [{ id:"sabores_alitas", label:"Sabores de Alitas", tipo:"multi",
        opciones: SABORES_ALITAS, maxSabores: producto.maxSabores || 2 }];

    case "boneless":
      return [{ id:"sabores_boneless", label:"Sabores de Boneless", tipo:"multi",
        opciones: SABORES_ALITAS, maxSabores: producto.maxSabores || 2 }];

    case "papas":
      return [
        { id:"tipo_papas",       label:"Tipo de Papas",  tipo:"unico", opciones: TIPOS_PAPAS },
        { id:"condimento_papas", label:"Condimento",      tipo:"unico", opciones: CONDIMENTOS_PAPAS },
      ];

    case "papas-boneless":
      return [
        { id:"tipo_papas",       label:"Tipo de Papas",         tipo:"unico", opciones: TIPOS_PAPAS },
        { id:"condimento_papas", label:"Condimento de Papas",    tipo:"unico", opciones: CONDIMENTOS_PAPAS },
        { id:"sabores_boneless", label:"Sabores de Boneless",    tipo:"multi", opciones: SABORES_ALITAS, maxSabores:2 },
      ];

    case "burgy":
      return [
        { id:"tipo_papas",       label:"Tipo de Papas",           tipo:"unico", opciones: TIPOS_PAPAS },
        { id:"condimento_papas", label:"Condimento de las Papas", tipo:"unico", opciones: CONDIMENTOS_PAPAS },
      ];

    case "doggy": {
      const llevanPapas = !n.includes("club");
      const rondas = [
        { id:"salchicha", label:"Tipo de Salchicha", tipo:"unico",
          opciones:["Salchicha de Res","Salchicha de Pavo"] }
      ];
      if (llevanPapas) {
        rondas.push({ id:"tipo_papas",       label:"Tipo de Papas",           tipo:"unico", opciones: TIPOS_PAPAS });
        rondas.push({ id:"condimento_papas", label:"Condimento de las Papas", tipo:"unico", opciones: CONDIMENTOS_PAPAS });
      }
      return rondas;
    }

    case "burgy-doggy-box":
      return [
        { id:"tipo_proteina",    label:"¿Burgy o Doggy?",          tipo:"unico", opciones:["Burgy","Doggy"] },
        { id:"tipo_papas",       label:"Tipo de Papas",            tipo:"unico", opciones: TIPOS_PAPAS },
        { id:"condimento_papas", label:"Condimento de las Papas",  tipo:"unico", opciones: CONDIMENTOS_PAPAS },
        { id:"sabores_alitas",   label:"Sabores de las 10 Alitas", tipo:"multi", opciones: SABORES_ALITAS, maxSabores:2 },
      ];

    case "box": {
      let maxSabores = 2;
      if (n.includes("box #2")) maxSabores = 3;
      if (n.includes("box #3") || n.includes("bendito")) maxSabores = 5;
      return [
        { id:"proteina",         label:"¿Alitas o Boneless?",     tipo:"unico", opciones:["Alitas","Boneless"] },
        { id:"sabores_proteina", label:"Sabores",                  tipo:"multi", opciones: SABORES_ALITAS, maxSabores },
        { id:"tipo_papas",       label:"Tipo de Papas",           tipo:"unico", opciones: TIPOS_PAPAS },
        { id:"condimento_papas", label:"Condimento de las Papas", tipo:"unico", opciones: CONDIMENTOS_PAPAS },
      ];
    }

    case "kids":
      return [{ id:"proteina_kids", label:"Elige el alimento principal", tipo:"unico",
        opciones:["6 Alitas","8 Nuggets","1 Mini Burgy"] }];

    case "bebida":
      return [{ id:"opcion_bebida", label:"Elige una opción", tipo:"unico",
        opciones: producto.opciones }];

    default:
      console.warn("[SelectorSabores] tipo no reconocido para:", producto.nombre);
      return [];
  }
};

// ── Modal content ──────────────────────────────────────────────
const ModalContent = ({ producto, onConfirmar, onCancelar }) => {
  const rondas = construirRondas(producto);
  const [rondaActual, setRondaActual] = useState(0);
  const [selecciones, setSelecciones] = useState(rondas.map(r => ({ ...r, elegidos:[] })));

  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.width    = "100%";
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width    = "";
    };
  }, []);

  // Si no hay rondas, agregar sin configuración
  if (rondas.length === 0) {
    console.warn("[SelectorSabores] Sin rondas para:", producto.nombre);
    onConfirmar([]);
    return null;
  }

  const ronda      = selecciones[rondaActual] || rondas[rondaActual] || {};
  const elegidos   = ronda.elegidos || [];
  const esMulti    = ronda.tipo === "multi";
  const maxSabores = ronda.maxSabores || 1;
  const esUltima   = rondaActual === rondas.length - 1;

  const getLabelRonda = (r, sels) => {
    if (r.id === "sabores_proteina") {
      const prot = sels.find(s => s.id === "proteina");
      return `Sabores de ${prot?.elegidos[0] || "Proteína"}`;
    }
    return r.label;
  };

  const toggleOpcion = (opcion) => {
    setSelecciones(prev => {
      const nueva  = [...prev];
      const actual = { ...nueva[rondaActual], elegidos: [...nueva[rondaActual].elegidos] };
      if (esMulti) {
        actual.elegidos = actual.elegidos.includes(opcion)
          ? actual.elegidos.filter(s => s !== opcion)
          : actual.elegidos.length < maxSabores
            ? [...actual.elegidos, opcion]
            : actual.elegidos;
      } else {
        // Selección única — solo actualizar, sin auto-avanzar
        actual.elegidos = [opcion];
      }
      nueva[rondaActual] = actual;
      return nueva;
    });
  };

  const handleSiguiente = () => {
    if (!esUltima) {
      setRondaActual(p => p + 1);
    } else {
      const configurables = selecciones.map(r => ({
        type:    r.id,
        label:   getLabelRonda(r, selecciones),
        sabores: r.tipo === "multi" ? r.elegidos : [],
        opcion:  r.tipo === "unico" ? r.elegidos[0] : undefined,
      }));
      onConfirmar(configurables);
    }
  };

  return (
    <div className="selector-overlay" onClick={e => e.target === e.currentTarget && onCancelar()}>
      <div className="selector-modal" onClick={e => e.stopPropagation()}>

        <div className="selector-header">
          <h3 className="selector-titulo">{producto.nombre}</h3>
          <button className="selector-cerrar" onClick={onCancelar}>×</button>
        </div>

        {rondas.length > 1 && (
          <div className="selector-rondas">
            {rondas.map((_, i) => (
              <div key={i} className={`selector-ronda-dot
                ${i === rondaActual ? "activa" : ""}
                ${i < rondaActual  ? "completa" : ""}`}
              />
            ))}
          </div>
        )}

        <div className="selector-instruccion">
          <span className="selector-label">{getLabelRonda(ronda, selecciones)}</span>
          <span className="selector-contador">
            {esMulti
              ? `${elegidos.length} / ${maxSabores} sabor${maxSabores !== 1 ? "es" : ""}`
              : "Elige 1"}
          </span>
        </div>

        <div className="selector-sabores-grid">
          {ronda.opciones.map(opcion => {
            const seleccionado  = elegidos.includes(opcion);
            const deshabilitado = esMulti && !seleccionado && elegidos.length >= maxSabores;
            return (
              <button
                key={opcion}
                className={`selector-sabor-btn
                  ${seleccionado  ? "seleccionado"  : ""}
                  ${deshabilitado ? "deshabilitado" : ""}`}
                onClick={() => !deshabilitado && toggleOpcion(opcion)}
              >
                {seleccionado && <span className="selector-check">✓</span>}
                {opcion}
              </button>
            );
          })}
        </div>

        <div className="selector-acciones">
          {rondaActual > 0 && (
            <button className="selector-btn-atras" onClick={() => setRondaActual(p => p - 1)}>
              Atrás
            </button>
          )}
          <button
            className="selector-btn-confirmar"
            onClick={handleSiguiente}
            disabled={elegidos.length === 0}
          >
            {esUltima ? "Agregar al carrito" : `Siguiente`}
          </button>
        </div>

      </div>
    </div>
  );
};

// ── Wrapper con portal ─────────────────────────────────────────
const SelectorSabores = ({ producto, onConfirmar, onCancelar }) => {
  return ReactDOM.createPortal(
    <ModalContent
      producto={producto}
      onConfirmar={onConfirmar}
      onCancelar={onCancelar}
    />,
    document.body
  );
};

export default SelectorSabores;