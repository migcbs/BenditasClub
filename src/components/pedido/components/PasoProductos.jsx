// src/components/pedido/components/PasoProductos.jsx

import React, { useState, useMemo } from "react";
import CategoriaTabs  from "./CategoriaTabs";
import ProductoCard   from "./ProductoCard";
import CarritoItem    from "./CarritoItem";

import { categorias, obtenerProductosPorCategoria, calcularSubtotal, formatearMoneda } from "../services/pedidoServices";

import "../styles/productos.css";

// Categorías que NO se muestran en pedidos a domicilio
const CATEGORIAS_SOLO_LOCAL = ["Cerveza", "Preparados"];

const PasoProductos = ({
  cliente,
  carrito,
  agregarProducto,
  eliminarProducto,
  actualizarCantidad,
  siguientePaso,
  pasoAnterior,
}) => {
  const esDomicilio = cliente?.tipoPedido === "domicilio";

  // Filtrar categorías según tipo de pedido
  const categoriasVisibles = useMemo(
    () => esDomicilio
      ? categorias.filter(c => !CATEGORIAS_SOLO_LOCAL.includes(c))
      : categorias,
    [esDomicilio]
  );

  const [categoriaActiva, setCategoriaActiva] = useState("Alitas");
  const [toastVisible,    setToastVisible]    = useState(false);
  const [productoAgregado,setProductoAgregado]= useState("");

  // Si la categoría activa queda fuera por cambio de tipo, resetear a Alitas
  const categoriaFinal = categoriasVisibles.includes(categoriaActiva)
    ? categoriaActiva
    : "Alitas";

  const productos    = useMemo(() => obtenerProductosPorCategoria(categoriaFinal), [categoriaFinal]);
  const total        = useMemo(() => calcularSubtotal(carrito), [carrito]);
  const carritoVacio = carrito.length === 0;

  const handleAgregarProducto = (producto) => {
    agregarProducto(producto);
    setProductoAgregado(producto.nombre);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1500);
  };

  return (
    <div className="paso-productos">

      {/* ── Productos ── */}
      <div className="productos-section">
        <CategoriaTabs
          categorias={categoriasVisibles}
          categoriaActiva={categoriaFinal}
          setCategoriaActiva={setCategoriaActiva}
        />

        <div className="productos-grid-scroll">
          {productos.map((producto, idx) => (
            <ProductoCard
              key={`${producto.nombre}-${idx}`}
              producto={producto}
              agregarProducto={handleAgregarProducto}
            />
          ))}
        </div>
      </div>

      {/* ── Carrito ── */}
      <div className="carrito-section">
        <h3 className="carrito-titulo">Tu pedido</h3>

        <div className="carrito-scroll">
          {carrito.map(item => (
            <CarritoItem
              key={item.id}
              item={item}
              actualizarCantidad={actualizarCantidad}
              eliminarProducto={eliminarProducto}
            />
          ))}
          {carritoVacio && <p className="carrito-vacio">Agrega productos al carrito 😎</p>}
        </div>

        <div className="carrito-total">
          <span>Total</span>
          <span>{formatearMoneda(total)}</span>
        </div>

        <div className="acciones">
          <button onClick={pasoAnterior}>Atrás</button>
          <button className="btn-primary" onClick={siguientePaso} disabled={carritoVacio}>
            Continuar
          </button>
        </div>
      </div>

      {toastVisible && (
        <div className="toast-agregado">✓ {productoAgregado} agregado</div>
      )}

    </div>
  );
};

export default PasoProductos;