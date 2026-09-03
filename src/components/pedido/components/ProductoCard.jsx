// src/components/pedido/components/ProductoCard.jsx

import React, { useState } from "react";
import SelectorSabores from "./SelectorSabores";

// Productos que requieren configuración antes de agregar
const requiereSelector = (producto) => {
  const nombre = producto.nombre?.toLowerCase() || "";
  return (
    nombre.includes("alita") ||
    nombre.includes("boneless") ||
    nombre.includes("papas") ||
    nombre.includes("papa") ||
    nombre.includes("box") ||
    nombre.includes("burgy") ||
    nombre.includes("bonely") ||
    nombre.includes("doggy") ||
    nombre.includes("kids") ||
    // Bebidas con opciones (micheladas, agua de sabor, etc.)
    (producto.opciones && producto.opciones.length > 0)
  );
};

const ProductoCard = React.memo(({ producto, agregarProducto }) => {
  const [mostrarSelector, setMostrarSelector] = useState(false);

  const handleAgregar = () => {
    if (requiereSelector(producto)) {
      setMostrarSelector(true);
    } else {
      agregarProducto({ ...producto, id: producto.nombre });
    }
  };

  const handleConfirmarSabores = (configurables) => {
    // Construir ID único con todas las selecciones
    const keyParts = configurables.map(c =>
      c.sabores?.length > 0
        ? c.sabores.join("-")
        : c.opcion || ""
    ).filter(Boolean);

    const id = keyParts.length > 0
      ? `${producto.nombre}|${keyParts.join("|")}`
      : producto.nombre;

    // Para bebidas con opción simple, guardar también en opcionElegida
    const opcionSimple = configurables.length === 1 && configurables[0].opcion
      ? configurables[0].opcion
      : undefined;

    agregarProducto({
      ...producto,
      id,
      configurables: configurables.length > 0 ? configurables : undefined,
      opcionElegida: opcionSimple,
    });
    setMostrarSelector(false);
  };

  return (
    <>
      <div className="producto-card">
        <h4 className="producto-nombre">{producto.nombre}</h4>

        {producto.descripcion && (
          <p className="producto-descripcion">{producto.descripcion}</p>
        )}

        <span className="precio-tag">${producto.precio}</span>

        <button className="btn-agregar" onClick={handleAgregar}>
          + Agregar
        </button>
      </div>

      {mostrarSelector && (
        <SelectorSabores
          producto={producto}
          onConfirmar={handleConfirmarSabores}
          onCancelar={() => setMostrarSelector(false)}
        />
      )}
    </>
  );
});

export default ProductoCard;