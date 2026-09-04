// src/components/pedido/hooks/usePedido.js

import { useEffect, useState } from "react";
import { useCarrito } from "./useCarrito";
import { useClienteForm } from "./useClienteForm";
import { useCustomerAccount } from "./useCustomerAccount";

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
    setCliente,
  } = useClienteForm();

  // Si hay sesión de cliente, precarga nombre/teléfono de la cuenta (el
  // cliente sigue pudiendo editarlos para este pedido en particular).
  const { cuenta, direcciones } = useCustomerAccount();
  useEffect(() => {
    if (!cuenta) return;
    setCliente((prev) => ({
      ...prev,
      nombre: prev.nombre || cuenta.nombre || "",
      telefono: prev.telefono || cuenta.telefono || "",
    }));
  }, [cuenta, setCliente]);

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
    direcciones,
    carrito,
    agregarProducto,
    eliminarProducto,
    actualizarCantidad,
    total,
    cantidadTotalItems,
  };
};