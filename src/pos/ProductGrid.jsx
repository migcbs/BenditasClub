// src/pos/ProductGrid.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { getProducts } from './api';
import SaboresPicker from './SaboresPicker';

const ProductGrid = ({ onAgregar }) => {
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [productoConSabores, setProductoConSabores] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProductos(data);
        if (data.length > 0) setCategoriaActiva(data[0].category.nombre);
      })
      .catch((e) => setError(e.message));
  }, []);

  const categorias = useMemo(
    () => [...new Set(productos.map((p) => p.category.nombre))],
    [productos]
  );

  const productosVisibles = useMemo(
    () => productos.filter((p) => p.category.nombre === categoriaActiva),
    [productos, categoriaActiva]
  );

  const handleClickProducto = (producto) => {
    if (producto.maxSabores) {
      setProductoConSabores(producto);
    } else {
      onAgregar(producto, []);
    }
  };

  return (
    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {error && <p className="pos-error">{error}</p>}
      <div className="pos-categorias">
        {categorias.map((cat) => (
          <button
            key={cat}
            className={categoriaActiva === cat ? 'activa' : ''}
            onClick={() => setCategoriaActiva(cat)}
          >
            {cat}
          </button>
        ))}
      </div>
      <div className="pos-productos-grid">
        {productosVisibles.map((producto) => (
          <button
            key={producto.id}
            type="button"
            className="pos-producto-card"
            onClick={() => handleClickProducto(producto)}
          >
            <strong>{producto.nombre}</strong>
            <div>${producto.precio}</div>
          </button>
        ))}
      </div>

      {productoConSabores && (
        <SaboresPicker
          producto={productoConSabores}
          categoria={productoConSabores.category.nombre}
          onConfirmar={(sabores) => {
            onAgregar(productoConSabores, sabores);
            setProductoConSabores(null);
          }}
          onCancelar={() => setProductoConSabores(null)}
        />
      )}
    </div>
  );
};

export default ProductGrid;
