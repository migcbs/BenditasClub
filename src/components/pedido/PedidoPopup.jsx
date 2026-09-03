// src/components/pedido/PedidoPopup.jsx

import React from "react";
import "./styles/PedidoPopup.css";

import PasoCliente   from "./components/PasoCliente";
import PasoProductos from "./components/PasoProductos";
import PasoResumen   from "./components/PasoResumen";

import { usePedido } from "./hooks/usePedido";

const PedidoPopup = ({ onClose }) => {
  const {
    paso, siguientePaso, pasoAnterior, resetPedido,
    cliente, errores, handleChange,
    carrito, agregarProducto, eliminarProducto, actualizarCantidad,
    total,
  } = usePedido();

  return (
    <div className="pedido-overlay">
      <div className="pedido-popup">

        <button className="btn-cerrar-popup" onClick={onClose}>×</button>

        <div className="pedido-paso-container">

          {paso === 1 && (
            <PasoCliente
              cliente={cliente}
              errores={errores}
              handleChange={handleChange}
              siguientePaso={siguientePaso}
            />
          )}

          {paso === 2 && (
            <PasoProductos
              cliente={cliente}
              carrito={carrito}
              agregarProducto={agregarProducto}
              eliminarProducto={eliminarProducto}
              actualizarCantidad={actualizarCantidad}
              siguientePaso={siguientePaso}
              pasoAnterior={pasoAnterior}
              total={total}
            />
          )}

          {paso === 3 && (
            <PasoResumen
              cliente={cliente}
              carrito={carrito}
              pasoAnterior={pasoAnterior}
              resetPedido={resetPedido}
              onClose={onClose}
            />
          )}

        </div>
      </div>
    </div>
  );
};

export default PedidoPopup;