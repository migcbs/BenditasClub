// src/components/pedido/components/SelectorSabores.jsx

import React, { useState } from "react";
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

const CONDIMENTOS_PAPAS = [
  "Naturales","Ajo parmesano","Pimienta limón",
  "Queso parmesano","Paprika",
];

const TIPOS_PAPAS = ["Papas a la Francesa","Papas en Gajos"];

const construirRondas = (producto) => {
  const nombre = producto.nombre?.toLowerCase() || "";

  // ── Alitas sueltas ──
  if (nombre.includes("alita") && !nombre.includes("box")) {
    return [{
      id: "sabores_alitas",
      label: "Sabores de Alitas",
      tipo: "multi",
      opciones: SABORES_ALITAS,
      maxSabores: producto.maxSabores || 2,
    }];
  }

  // ── Boneless suelto ──
  if (nombre.includes("boneless") && !nombre.includes("box") && !nombre.includes("papas")) {
    return [{
      id: "sabores_boneless",
      label: "Sabores de Boneless",
      tipo: "multi",
      opciones: SABORES_ALITAS,
      maxSabores: producto.maxSabores || 2,
    }];
  }

  // ── Papas sueltas ──
  if ((nombre.includes("papas") || nombre.includes("papa")) &&
      !nombre.includes("boneless") && !nombre.includes("box") &&
      !nombre.includes("burgy") && !nombre.includes("doggy") &&
      !nombre.includes("happy") && !nombre.includes("salchi")) {
    return [
      { id: "tipo_papas",      label: "Tipo de Papas",    tipo: "unico", opciones: TIPOS_PAPAS },
      { id: "condimento_papas",label: "Condimento",        tipo: "unico", opciones: CONDIMENTOS_PAPAS },
    ];
  }

  // ── Papas + Boneless (combo) ──
  if (nombre.includes("papas") && nombre.includes("boneless")) {
    return [
      { id: "tipo_papas",       label: "Tipo de Papas",          tipo: "unico", opciones: TIPOS_PAPAS },
      { id: "condimento_papas", label: "Condimento de Papas",     tipo: "unico", opciones: CONDIMENTOS_PAPAS },
      { id: "sabores_boneless", label: "Sabores de Boneless",     tipo: "multi", opciones: SABORES_ALITAS, maxSabores: 2 },
    ];
  }

  // ── Burgys ──
  if ((nombre.includes("burgy") || nombre.includes("bonely")) && !nombre.includes("box")) {
    return [
      { id: "tipo_papas",       label: "Tipo de Papas",           tipo: "unico", opciones: TIPOS_PAPAS },
      { id: "condimento_papas", label: "Condimento de las Papas", tipo: "unico", opciones: CONDIMENTOS_PAPAS },
    ];
  }

  // ── Doggys ──
  if (nombre.includes("doggy") && !nombre.includes("box")) {
    const llevanPapas = !nombre.includes("club");
    const rondas = [
      { id: "salchicha", label: "Tipo de Salchicha", tipo: "unico", opciones: ["Salchicha de Res","Salchicha de Pavo"] },
    ];
    if (llevanPapas) {
      rondas.push({ id: "tipo_papas",       label: "Tipo de Papas",           tipo: "unico", opciones: TIPOS_PAPAS });
      rondas.push({ id: "condimento_papas", label: "Condimento de las Papas", tipo: "unico", opciones: CONDIMENTOS_PAPAS });
    }
    return rondas;
  }

  // ── Burgy / Doggy Box ──
  if (nombre.includes("burgy") && nombre.includes("doggy")) {
    return [
      { id: "tipo_proteina",    label: "¿Burgy o Doggy?",         tipo: "unico", opciones: ["Burgy","Doggy"] },
      { id: "tipo_papas",       label: "Tipo de Papas",           tipo: "unico", opciones: TIPOS_PAPAS },
      { id: "condimento_papas", label: "Condimento de las Papas", tipo: "unico", opciones: CONDIMENTOS_PAPAS },
      { id: "sabores_alitas",   label: "Sabores de las 10 Alitas",tipo: "multi", opciones: SABORES_ALITAS, maxSabores: 2 },
    ];
  }

  // ── Resto de Boxes ──
  if (nombre.includes("box")) {
    let maxSabores = 2;
    if (nombre.includes("box #2")) maxSabores = 3;
    if (nombre.includes("box #3") || nombre.includes("bendito")) maxSabores = 5;

    return [
      { id: "proteina",         label: "¿Alitas o Boneless?",     tipo: "unico", opciones: ["Alitas","Boneless"] },
      { id: "sabores_proteina", label: "Sabores",                  tipo: "multi", opciones: SABORES_ALITAS, maxSabores },
      { id: "tipo_papas",       label: "Tipo de Papas",           tipo: "unico", opciones: TIPOS_PAPAS },
      { id: "condimento_papas", label: "Condimento de las Papas", tipo: "unico", opciones: CONDIMENTOS_PAPAS },
    ];
  }

  // ── Paquete Kids ──
  if (nombre.includes("kids")) {
    return [{
      id: "proteina_kids",
      label: "Elige el alimento principal",
      tipo: "unico",
      opciones: ["6 Alitas","8 Nuggets","1 Mini Burgy"],
    }];
  }

  // ── Bebidas con opción ──
  if (producto.opciones?.length > 0) {
    return [{
      id: "opcion_bebida",
      label: "Elige una opción",
      tipo: "unico",
      opciones: producto.opciones,
    }];
  }

  return [];
};

// ─────────────────────────────────────────────────────────────
const SelectorSabores = ({ producto, onConfirmar, onCancelar }) => {
  const rondas = construirRondas(producto);
  const [rondaActual, setRondaActual] = useState(0);
  const [selecciones, setSelecciones] = useState(rondas.map(r => ({ ...r, elegidos: [] })));

  if (rondas.length === 0) { onConfirmar([]); return null; }

  const ronda    = selecciones[rondaActual];
  const elegidos = ronda.elegidos;
  const esMulti  = ronda.tipo === "multi";
  const maxSabores = ronda.maxSabores || 1;
  const esUltimaRonda = rondaActual === rondas.length - 1;
  const puedeAvanzar  = elegidos.length > 0;

  // Etiqueta dinámica: "Sabores de Alitas" o "Sabores de Boneless" según proteína elegida
  const getLabelRonda = (r, sels) => {
    if (r.id === "sabores_proteina") {
      const proteina = sels.find(s => s.id === "proteina");
      return `Sabores de ${proteina?.elegidos[0] || "Proteína"}`;
    }
    return r.label;
  };

  const toggleOpcion = (opcion) => {
    setSelecciones(prev => {
      const nueva = [...prev];
      const actual = { ...nueva[rondaActual], elegidos: [...nueva[rondaActual].elegidos] };
      if (esMulti) {
        actual.elegidos = actual.elegidos.includes(opcion)
          ? actual.elegidos.filter(s => s !== opcion)
          : actual.elegidos.length < maxSabores
            ? [...actual.elegidos, opcion]
            : actual.elegidos;
      } else {
        actual.elegidos = [opcion];
      }
      nueva[rondaActual] = actual;
      return nueva;
    });
  };

  const handleSiguiente = () => {
    if (!esUltimaRonda) {
      setRondaActual(prev => prev + 1);
    } else {
      const configurables = selecciones.map(r => ({
        type:    r.id,
        label:   getLabelRonda(r, selecciones),
        sabores: r.tipo === "multi"  ? r.elegidos : [],
        opcion:  r.tipo === "unico"  ? r.elegidos[0] : undefined,
      }));
      onConfirmar(configurables);
    }
  };

  const labelActual = getLabelRonda(ronda, selecciones);

  return (
    <div className="selector-overlay" onClick={e => e.target === e.currentTarget && onCancelar()}>
      <div className="selector-modal">

        <div className="selector-header">
          <h3 className="selector-titulo">{producto.nombre}</h3>
          <button className="selector-cerrar" onClick={onCancelar}>×</button>
        </div>

        {rondas.length > 1 && (
          <div className="selector-rondas">
            {rondas.map((_, i) => (
              <div key={i} className={`selector-ronda-dot ${i === rondaActual ? "activa" : ""} ${i < rondaActual ? "completa" : ""}`} />
            ))}
          </div>
        )}

        <div className="selector-instruccion">
          <span className="selector-label">{labelActual}</span>
          {esMulti
            ? <span className="selector-contador">{elegidos.length} / {maxSabores} sabor{maxSabores !== 1 ? "es" : ""}</span>
            : <span className="selector-contador">Elige 1</span>
          }
        </div>

        <div className="selector-sabores-grid">
          {ronda.opciones.map(opcion => {
            const seleccionado  = elegidos.includes(opcion);
            const deshabilitado = esMulti && !seleccionado && elegidos.length >= maxSabores;
            return (
              <button
                key={opcion}
                className={`selector-sabor-btn ${seleccionado ? "seleccionado" : ""} ${deshabilitado ? "deshabilitado" : ""}`}
                onClick={() => toggleOpcion(opcion)}
                disabled={deshabilitado}
              >
                {seleccionado && <span className="selector-check">✓</span>}
                {opcion}
              </button>
            );
          })}
        </div>

        <div className="selector-acciones">
          {rondaActual > 0 && (
            <button className="selector-btn-atras" onClick={() => setRondaActual(p => p - 1)}>Atrás</button>
          )}
          <button
            className="selector-btn-confirmar"
            onClick={handleSiguiente}
            disabled={!puedeAvanzar}
          >
            {esUltimaRonda
              ? "Agregar al carrito"
              : `Siguiente: ${getLabelRonda(rondas[rondaActual + 1], selecciones)}`}
          </button>
        </div>

      </div>
    </div>
  );
};

export default SelectorSabores;