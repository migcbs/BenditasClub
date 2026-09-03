// src/components/pedido/components/CarritoItem.jsx
// ✅ Muestra sabores/configurables debajo del nombre
// ✅ Subtotal calculado con calcularSubtotalItem (fuente única)
// ✅ Layout correcto en mobile y desktop

import React from "react";
import { calcularSubtotalItem } from "../services/pedidoServices";

const CarritoItem = React.memo(({ item, actualizarCantidad, eliminarProducto }) => {

  const handleDisminuir = () => {
    if (item.cantidad > 1) {
      actualizarCantidad(item.id, item.cantidad - 1);
    }
  };

  const handleAumentar  = () => actualizarCantidad(item.id, item.cantidad + 1);
  const handleEliminar  = () => eliminarProducto(item.id);

  const subtotal = calcularSubtotalItem(item);

  return (
    <div className="carrito-item">

      {/* ── Info: nombre + precio ── */}
      <div className="carrito-info">
        <strong className="carrito-nombre">{item.nombre}</strong>
        <p className="carrito-precio">${subtotal.toFixed(2)}</p>
      </div>

      {/* ── Sabores / configurables ── */}
      {item.configurables && item.configurables.length > 0 && (
        <div className="carrito-sabores">
          {item.configurables.map((c, i) => {
            if (c.sabores && c.sabores.length > 0) {
              return (
                <span key={i} className="carrito-sabor-tag">
                  🌶 {c.type ? `${c.type}: ` : ""}{c.sabores.join(", ")}
                </span>
              );
            }
            if (c.opcion) {
              return (
                <span key={i} className="carrito-sabor-tag">
                  ➤ {c.type ? `${c.type}: ` : ""}{c.opcion}
                </span>
              );
            }
            return null;
          })}
        </div>
      )}

      {/* Opción simple (bebidas, etc.) */}
      {item.opcionElegida && (
        <span className="carrito-sabor-tag">➤ {item.opcionElegida}</span>
      )}

      {/* ── Controles de cantidad + eliminar ── */}
      <div className="carrito-controles-row">
        <div className="cantidad-control">
          <button className="btn-cantidad" onClick={handleDisminuir} aria-label="Disminuir">−</button>
          <span className="cantidad-numero">{item.cantidad}</span>
          <button className="btn-cantidad" onClick={handleAumentar} aria-label="Aumentar">+</button>
        </div>
        <button className="btn-eliminar" onClick={handleEliminar} aria-label="Eliminar producto">✕</button>
      </div>

    </div>
  );
});

export default CarritoItem;