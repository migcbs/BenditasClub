// src/pos/usePosCarrito.js
import { useState, useMemo, useCallback } from 'react';

const keyFor = (productId, sabores = []) => `${productId}|${[...sabores].sort().join(',')}`;

export const usePosCarrito = () => {
  const [items, setItems] = useState([]);

  const agregarItem = useCallback((producto, sabores = []) => {
    const key = keyFor(producto.id, sabores);
    setItems((prev) => {
      const existente = prev.find((i) => i.key === key);
      if (existente) {
        return prev.map((i) => (i.key === key ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [
        ...prev,
        {
          key,
          productId: producto.id,
          nombre: producto.nombre,
          precio: producto.precio,
          cantidad: 1,
          sabores,
        },
      ];
    });
  }, []);

  const quitarItem = useCallback((key) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }, []);

  const actualizarCantidad = useCallback((key, cantidad) => {
    if (cantidad <= 0) return quitarItem(key);
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, cantidad } : i)));
  }, [quitarItem]);

  const vaciar = useCallback(() => setItems([]), []);

  const total = useMemo(() => items.reduce((acc, i) => acc + i.precio * i.cantidad, 0), [items]);

  return { items, agregarItem, quitarItem, actualizarCantidad, vaciar, total };
};
