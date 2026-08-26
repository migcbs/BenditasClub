// src/pos/SaboresPicker.jsx
import React, { useState } from 'react';

const SABORES_ALITAS_BONELESS = [
  'Ajo parmesano', 'Pimienta limón', 'Queso parmesano',
  'BBQ', 'Tamarindo', 'Miel & mostaza', 'Teriyaki',
  'Machas', 'Habanero', 'Búfalo', 'Mango habanero',
  'BBQ Habanero', 'Tamarindo habanero', 'Habanero parmesano',
  'Sriracha', 'Diabla', 'Piña chipotle', 'Valentina',
  'Pelón Pelo Rico', 'Takis Blue', "Cheetos Flamin' Hot",
  'Takis Fuego', 'Doritos Cheddar', 'Naturales',
];
const SABORES_PAPAS = ['Naturales', 'Ajo parmesano', 'Pimienta limón', 'Queso parmesano', 'Paprika'];

const saboresPara = (categoria) => (categoria === 'Papas' ? SABORES_PAPAS : SABORES_ALITAS_BONELESS);

const SaboresPicker = ({ producto, categoria, onConfirmar, onCancelar }) => {
  const [elegidos, setElegidos] = useState([]);
  const opciones = saboresPara(categoria);
  const max = producto.maxSabores || 1;

  const toggle = (sabor) => {
    setElegidos((prev) => {
      if (prev.includes(sabor)) return prev.filter((s) => s !== sabor);
      if (prev.length >= max) return prev;
      return [...prev, sabor];
    });
  };

  return (
    <div className="pos-sabores-overlay" onClick={(e) => e.target === e.currentTarget && onCancelar()}>
      <div className="pos-sabores-modal">
        <h3>{producto.nombre}</h3>
        <p>Elige hasta {max} sabor{max !== 1 ? 'es' : ''} ({elegidos.length}/{max})</p>
        <div className="pos-sabores-grid">
          {opciones.map((sabor) => (
            <button
              key={sabor}
              type="button"
              className={`pos-sabor-chip ${elegidos.includes(sabor) ? 'seleccionado' : ''}`}
              onClick={() => toggle(sabor)}
            >
              {sabor}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onCancelar}>Cancelar</button>
          <button type="button" onClick={() => onConfirmar(elegidos)} disabled={elegidos.length === 0}>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaboresPicker;
