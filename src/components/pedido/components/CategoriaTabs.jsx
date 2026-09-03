// src/components/pedido/components/CategoriaTabs.jsx

import React from "react";

// Recibe categorias como prop para permitir filtrado externo (ej. domicilio)
const CategoriaTabs = React.memo(({ categorias = [], categoriaActiva, setCategoriaActiva }) => {
  return (
    <div className="categoria-tabs">
      {categorias.map(cat => (
        <button
          key={cat}
          className={`categoria-btn ${categoriaActiva === cat ? "categoria-activa" : ""}`}
          onClick={() => setCategoriaActiva(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
});

export default CategoriaTabs;