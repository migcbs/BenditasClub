// src/components/pedido/hooks/usePedido.js

import { useState } from "react";
import { useCarrito } from "./useCarrito";
import { useClienteForm } from "./useClienteForm";

export const usePedido = () => {

  const [paso, setPaso] = useState(1);

  const {
    carrito,
    agregarProducto,
    eliminarProducto,
    actualizarCantidad,
    vaciarCarrito,
    total,
    cantidadTotalItems,
  } = useCarrito();

  const {
    cliente,
    errores,
    handleChange,
    validar,
    resetCliente,
  } = useClienteForm();

  const siguientePaso = () => {
    if (paso === 1) {
      const esValido = validar();
      if (!esValido) return;
    }
    setPaso((prev) => prev + 1);
  };

  const pasoAnterior = () => {
    setPaso((prev) => Math.max(1, prev - 1));
  };

  const resetPedido = () => {
    setPaso(1);
    vaciarCarrito();
    resetCliente();
  };

  return {
    paso,
    siguientePaso,
    pasoAnterior,
    resetPedido,
    cliente,
    errores,
    handleChange,
    carrito,
    agregarProducto,
    eliminarProducto,
    actualizarCantidad,
    total,
    cantidadTotalItems,
  };
};