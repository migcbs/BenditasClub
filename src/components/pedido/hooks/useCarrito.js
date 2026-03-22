// src/components/pedido/hooks/useCarrito.js
// ✅ Total calculado con calcularSubtotal (fuente única de verdad)
// ✅ agregarProducto acumula correctamente por ID estable

import { useState, useMemo } from "react";
import { calcularSubtotal } from "../services/pedidoServices";

export const useCarrito = () => {

  const [carrito, setCarrito] = useState([]);

  // ── Agregar producto ──────────────────────────────
  // Si el producto ya existe (mismo id), incrementa cantidad.
  // El id debe ser determinístico (ej. producto.nombre o nombre+sabores).
  const agregarProducto = (producto) => {
    if (!producto) return;

    setCarrito((prev) => {
      const existe = prev.find((p) => p.id === producto.id);
      if (existe) {
        return prev.map((p) =>
          p.id === producto.id
            ? { ...p, cantidad: p.cantidad + 1 }
            : p
        );
      }
      return [...prev, { ...producto, cantidad: 1 }];
    });
  };

  // ── Eliminar producto ─────────────────────────────
  const eliminarProducto = (id) => {
    setCarrito((prev) => prev.filter((p) => p.id !== id));
  };

  // ── Actualizar cantidad ───────────────────────────
  const actualizarCantidad = (id, cantidad) => {
    if (cantidad <= 0) {
      eliminarProducto(id);
      return;
    }
    setCarrito((prev) =>
      prev.map((p) => (p.id === id ? { ...p, cantidad } : p))
    );
  };

  // ── Vaciar ────────────────────────────────────────
  const vaciarCarrito = () => setCarrito([]);

  // ── Total (fuente única: calcularSubtotal) ────────
  const total = useMemo(() => calcularSubtotal(carrito), [carrito]);

  // ── Cantidad total de items ───────────────────────
  const cantidadTotalItems = useMemo(
    () => carrito.reduce((acc, item) => acc + (item.cantidad || 1), 0),
    [carrito]
  );

  return {
    carrito,
    agregarProducto,
    eliminarProducto,
    actualizarCantidad,
    vaciarCarrito,
    total,
    cantidadTotalItems,
  };
};