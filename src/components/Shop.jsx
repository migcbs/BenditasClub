// src/components/Shop.jsx
// Catálogo real desde la base de datos (antes era una lista hardcodeada) —
// categorías agrupadas, max 3 cols, semáforo de stock, filtro por categoría.

import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Shop.css';
import { ShoppingCart, ArrowDown } from 'lucide-react';
import { shopApi } from './shopApi';

import bannerShopImage from '../assets/banner.jpg';

import FloatingCartButton from './FloatingCartButton';
import CartPopup          from './CartPopup';
import { useDocumentMeta } from '../shared/useDocumentMeta';

// ─── Constantes de stock ──────────────────────────────────────
// Deben coincidir exactamente con los valores que calcula el backend en
// GET /api/shop/products (ver index.js).
export const STOCK = {
  DISPONIBLE: 'disponible',
  POCO:       'poco',
  AGOTADO:    'agotado',
};

// Adapta la forma que entrega la API (product.variants[].estado) a la forma
// que ya esperaba este componente (producto.variantes[].stock/imagen).
const adaptarCatalogo = (products) => products.map((p) => ({
  id: p.id,
  nombre: p.nombre,
  categoria: p.category?.nombre || 'Otros',
  variantes: p.variants.map((v) => ({
    id: v.id,
    nombre: v.nombre,
    precio: v.precio,
    imagen: v.imagenUrl || p.imagenUrl,
    stock: v.estado,
  })),
})).filter((p) => p.variantes.length > 0);

// ─── Stock helpers ────────────────────────────────────────────
const STOCK_CONFIG = {
  [STOCK.DISPONIBLE]: { label: 'Disponible',    cls: 'stock-disponible' },
  [STOCK.POCO]:       { label: 'Pocas piezas',  cls: 'stock-poco'       },
  [STOCK.AGOTADO]:    { label: 'Agotado',        cls: 'stock-agotado'    },
};

// ─── Componente principal ─────────────────────────────────────
const Shop = () => {
  useDocumentMeta({
    title: 'Tienda Benditas Club — Playeras, gorras y más | Xico y Coatepec',
    description: 'Compra la mercancía oficial de Benditas Club: playeras, gorras y accesorios. Envíos y entrega en Xico y Coatepec, Veracruz.',
  });
  const [catalogo,        setCatalogo]        = useState(null);
  const [error,           setError]           = useState('');
  const [filtro,          setFiltro]          = useState('Todas');
  const [cartItems,       setCartItems]       = useState([]);
  const [isCartOpen,      setIsCartOpen]      = useState(false);
  const [toastMsg,        setToastMsg]        = useState('');

  useEffect(() => {
    let live = true;
    shopApi.products()
      .then((products) => live && setCatalogo(adaptarCatalogo(products)))
      .catch((e) => live && setError(e.message));
    return () => { live = false; };
  }, []);

  // Categorías únicas en el orden en que llegan
  const categorias = useMemo(() => ['Todas', ...new Set((catalogo || []).map(p => p.categoria))], [catalogo]);

  // Productos filtrados agrupados por categoría
  const productosFiltrados = useMemo(() => {
    const lista = filtro === 'Todas'
      ? (catalogo || [])
      : (catalogo || []).filter(p => p.categoria === filtro);

    const grupos = {};
    lista.forEach(p => {
      if (!grupos[p.categoria]) grupos[p.categoria] = [];
      grupos[p.categoria].push(p);
    });
    return grupos;
  }, [filtro, catalogo]);

  const totalItems = cartItems.reduce((t, i) => t + i.cantidad, 0);

  const agregarAlCarrito = (producto, variante) => {
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.variantId === variante.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + 1 };
        return updated;
      }
      return [...prev, {
        id: producto.id, variantId: variante.id,
        nombre: producto.nombre, varianteNombre: variante.nombre,
        precio: variante.precio, cantidad: 1, imagen: variante.imagen,
      }];
    });
    showToast(`${producto.nombre} agregado`);
  };

  const quitarDelCarrito = (variantId) => {
    setCartItems(prev => prev.filter(i => i.variantId !== variantId));
  };

  const vaciarCarrito = () => setCartItems([]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 1800);
  };

  return (
    <div className="shop-page-container">

      {/* Hero */}
      <div className="shop-hero-banner" style={{ backgroundImage: `url(${bannerShopImage})` }}>
        <div className="shop-banner-content">
          <button
            className="shop-banner-btn"
            onClick={() => document.getElementById('shop-productos')?.scrollIntoView({ behavior: 'smooth' })}
            aria-label="Ver productos"
          >
            <ArrowDown size={26} />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div id="shop-productos" className="shop-contenido">

        <h2 className="shop-section-title">Merch Benditas</h2>

        {error && <p className="shop-empty-state">No pudimos cargar el catálogo — intenta de nuevo en un momento.</p>}
        {!error && !catalogo && <p className="shop-empty-state">Cargando catálogo…</p>}
        {!error && catalogo && catalogo.length === 0 && <p className="shop-empty-state">Todavía no hay productos publicados.</p>}

        {catalogo && catalogo.length > 0 && (
        <>
        {/* Filtros */}
        <div className="shop-filtros">
          {categorias.map(cat => (
            <button
              key={cat}
              className={`shop-filtro-btn ${filtro === cat ? 'activo' : ''}`}
              onClick={() => setFiltro(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Leyenda semáforo */}
        <div className="shop-leyenda">
          <span className="leyenda-item disponible">Disponible</span>
          <span className="leyenda-item poco">Pocas piezas</span>
          <span className="leyenda-item agotado">Agotado</span>
        </div>

        {/* Secciones por categoría */}
        {Object.entries(productosFiltrados).map(([categoria, productos]) => (
          <div key={categoria} className="shop-categoria">
            {filtro === 'Todas' && (
              <h3 className="shop-categoria-titulo">{categoria}</h3>
            )}
            <div className="shop-grid">
              {productos.map(producto => (
                <ProductoCard
                  key={producto.id}
                  producto={producto}
                  onAgregar={agregarAlCarrito}
                />
              ))}
            </div>
          </div>
        ))}
        </>
        )}

      </div>

      {/* Regresar */}
      <div className="shop-return-section">
        <p>¿No encontraste lo que buscabas?</p>
        <Link to="/" className="return-home-btn">Regresar al inicio</Link>
      </div>

      {/* Toast */}
      {toastMsg && <div className="shop-toast">✓ {toastMsg}</div>}

      {/* Carrito flotante */}
      <FloatingCartButton totalItems={totalItems} onClick={() => setIsCartOpen(true)} />

      {isCartOpen && (
        <CartPopup
          cartItems={cartItems}
          onClose={() => setIsCartOpen(false)}
          removeFromCart={(pId, vId) => quitarDelCarrito(vId)}
          clearCart={vaciarCarrito}
        />
      )}

    </div>
  );
};

// ─── Tarjeta de producto ──────────────────────────────────────
const ProductoCard = ({ producto, onAgregar }) => {
  const [varianteActiva, setVarianteActiva] = useState(
    // Seleccionar primera variante disponible, o la primera si todas agotadas
    producto.variantes.find(v => v.stock !== STOCK.AGOTADO) || producto.variantes[0]
  );

  const stockCfg       = STOCK_CONFIG[varianteActiva.stock];
  const estaAgotada    = varianteActiva.stock === STOCK.AGOTADO;
  const tieneVariantes = producto.variantes.length > 1;

  return (
    <div className="shop-card">

      {/* Imagen */}
      <div className="shop-card-img-wrap">
        <img
          src={varianteActiva.imagen}
          alt={`${producto.nombre} - ${varianteActiva.nombre}`}
          className="shop-card-img"
        />

        {/* Badge de stock */}
        <span className={`shop-stock-badge ${stockCfg.cls}`}>
          <span className="shop-stock-dot" />
          {stockCfg.label}
        </span>

        {/* Thumbnails de variantes */}
        {tieneVariantes && (
          <div className="shop-variantes-strip">
            {producto.variantes.map(v => (
              <img
                key={v.id}
                src={v.imagen}
                alt={v.nombre}
                title={v.nombre}
                className={`shop-var-thumb ${varianteActiva.id === v.id ? 'activa' : ''} ${v.stock === STOCK.AGOTADO ? 'agotada' : ''}`}
                onClick={() => v.stock !== STOCK.AGOTADO && setVarianteActiva(v)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="shop-card-info">
        <p className="shop-card-nombre">{producto.nombre}</p>
        {tieneVariantes && (
          <p className="shop-card-variante">{varianteActiva.nombre}</p>
        )}
        <p className="shop-card-precio">${varianteActiva.precio} MXN</p>

        <button
          className={`shop-card-btn ${estaAgotada ? 'agotado' : ''}`}
          onClick={() => !estaAgotada && onAgregar(producto, varianteActiva)}
          disabled={estaAgotada}
        >
          {estaAgotada ? 'Agotado' : (
            <><ShoppingCart size={14} /> Agregar</>
          )}
        </button>
      </div>

    </div>
  );
};

export default Shop;