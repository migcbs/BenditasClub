// src/components/Shop.jsx
// Lógica nueva: categorías agrupadas, max 3 cols, semáforo de stock, filtro por categoría

import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import './Shop.css';
import { ShoppingCart, ArrowDown } from 'lucide-react';

import gorra1          from '../assets/gorra1.jpg';
import gorra2          from '../assets/gorra2.jpg';
import lanyard1        from '../assets/lanyard1.jpg';
import lanyard2        from '../assets/lanyard2.jpg';
import llavero1        from '../assets/llavero1.jpg';
import llavero2        from '../assets/llavero2.jpg';
import tote1           from '../assets/tote1.jpg';
import tote2           from '../assets/tote2.jpg';
import monedero1       from '../assets/monedero1.jpeg';
import monedero2       from '../assets/monedero2.jpeg';
import monedero3       from '../assets/monedero3.jpeg';
import cartera1        from '../assets/cartera1.jpeg';
import cartera2        from '../assets/cartera2.jpeg';
import playeraMonalisa from '../assets/playera-monalisa.jpeg';
import playeraGrito    from '../assets/playera-grito.jpeg';
import playeraFridas   from '../assets/playera-fridas.jpeg';
import playeraVenus    from '../assets/playera-venus.jpeg';
import playeraAdan     from '../assets/playera-adan.jpeg';
import bannerShopImage from '../assets/banner.jpg';

import FloatingCartButton from './FloatingCartButton';
import CartPopup          from './CartPopup';

// ─── Constantes de stock ──────────────────────────────────────
export const STOCK = {
  DISPONIBLE: 'disponible',
  POCO:       'poco',
  AGOTADO:    'agotado',
};

// ─── Catálogo ─────────────────────────────────────────────────
// Cada producto tiene: id, nombre, categoria, variantes[]
// Cada variante tiene: id, nombre, precio, imagen, stock
const CATALOGO = [
  {
    id: 'playera-monalisa',
    nombre: 'Playera Monalisa',
    categoria: 'Playeras',
    variantes: [
      { id: 'monalisa-u', nombre: 'Única', precio: 249, imagen: playeraMonalisa, stock: STOCK.POCO },
    ],
  },
  {
    id: 'playera-grito',
    nombre: 'Playera El Grito',
    categoria: 'Playeras',
    variantes: [
      { id: 'grito-u', nombre: 'Única', precio: 249, imagen: playeraGrito, stock: STOCK.POCO },
    ],
  },
  {
    id: 'playera-fridas',
    nombre: 'Playera Dos Fridas',
    categoria: 'Playeras',
    variantes: [
      { id: 'fridas-u', nombre: 'Única', precio: 249, imagen: playeraFridas, stock: STOCK.POCO },
    ],
  },
  {
    id: 'playera-adan',
    nombre: 'Playera Creación de Adán',
    categoria: 'Playeras',
    variantes: [
      { id: 'adan-u', nombre: 'Única', precio: 249, imagen: playeraAdan, stock: STOCK.POCO },
    ],
  },
  {
    id: 'playera-venus',
    nombre: 'Playera Nacimiento de Venus',
    categoria: 'Playeras',
    variantes: [
      { id: 'venus-u', nombre: 'Única', precio: 249, imagen: playeraVenus, stock: STOCK.POCO },
    ],
  },
  {
    id: 'gorra',
    nombre: 'Gorra',
    categoria: 'Gorras',
    variantes: [
      { id: 'gorra-arena', nombre: 'Arena', precio: 89, imagen: gorra1, stock: STOCK.DISPONIBLE },
      { id: 'gorra-rosa',  nombre: 'Rosa',  precio: 89, imagen: gorra2, stock: STOCK.POCO },
    ],
  },
  {
    id: 'monedero',
    nombre: 'Monedero',
    categoria: 'Accesorios',
    variantes: [
      { id: 'monedero-byn',  nombre: 'Blanco y Negro', precio: 50, imagen: monedero1, stock: STOCK.DISPONIBLE },
      { id: 'monedero-rosa', nombre: 'Rosa',            precio: 50, imagen: monedero2, stock: STOCK.DISPONIBLE },
      { id: 'monedero-r2',   nombre: 'Rosa Alt',        precio: 50, imagen: monedero3, stock: STOCK.AGOTADO   },
    ],
  },
  {
    id: 'cartera',
    nombre: 'Cartera',
    categoria: 'Accesorios',
    variantes: [
      { id: 'cartera-1', nombre: 'Classic 1', precio: 99, imagen: cartera1, stock: STOCK.DISPONIBLE },
      { id: 'cartera-2', nombre: 'Classic 2', precio: 99, imagen: cartera2, stock: STOCK.DISPONIBLE },
    ],
  },
  {
    id: 'lanyard',
    nombre: 'Lanyard',
    categoria: 'Accesorios',
    variantes: [
      { id: 'lanyard-1', nombre: 'Clásico', precio: 69, imagen: lanyard1, stock: STOCK.DISPONIBLE },
      { id: 'lanyard-2', nombre: 'Patrón',  precio: 69, imagen: lanyard2, stock: STOCK.DISPONIBLE },
    ],
  },
  {
    id: 'llavero',
    nombre: 'Llavero',
    categoria: 'Accesorios',
    variantes: [
      { id: 'llavero-burger', nombre: 'Hamburguesa', precio: 49, imagen: llavero1, stock: STOCK.DISPONIBLE },
      { id: 'llavero-alita',  nombre: 'Alita',        precio: 49, imagen: llavero2, stock: STOCK.DISPONIBLE },
    ],
  },
  {
    id: 'tote',
    nombre: 'Tote Bag',
    categoria: 'Bolsas',
    variantes: [
      { id: 'tote-burger', nombre: 'Hamburguesa', precio: 109, imagen: tote1, stock: STOCK.DISPONIBLE },
      { id: 'tote-alita',  nombre: 'Alita',        precio: 109, imagen: tote2, stock: STOCK.DISPONIBLE },
    ],
  },
];

// Categorías únicas en el orden en que aparecen
const CATEGORIAS = ['Todas', ...new Set(CATALOGO.map(p => p.categoria))];

// ─── Stock helpers ────────────────────────────────────────────
const STOCK_CONFIG = {
  [STOCK.DISPONIBLE]: { label: 'Disponible',    cls: 'stock-disponible' },
  [STOCK.POCO]:       { label: 'Pocas piezas',  cls: 'stock-poco'       },
  [STOCK.AGOTADO]:    { label: 'Agotado',        cls: 'stock-agotado'    },
};

// Stock global de un producto = peor caso de sus variantes disponibles
const stockProducto = (producto) => {
  const disponibles = producto.variantes.filter(v => v.stock !== STOCK.AGOTADO);
  if (disponibles.length === 0) return STOCK.AGOTADO;
  if (disponibles.some(v => v.stock === STOCK.POCO)) return STOCK.POCO;
  return STOCK.DISPONIBLE;
};

// ─── Componente principal ─────────────────────────────────────
const Shop = () => {
  const [filtro,          setFiltro]          = useState('Todas');
  const [cartItems,       setCartItems]       = useState([]);
  const [isCartOpen,      setIsCartOpen]      = useState(false);
  const [toastMsg,        setToastMsg]        = useState('');

  // Productos filtrados agrupados por categoría
  const productosFiltrados = useMemo(() => {
    const lista = filtro === 'Todas'
      ? CATALOGO
      : CATALOGO.filter(p => p.categoria === filtro);

    const grupos = {};
    lista.forEach(p => {
      if (!grupos[p.categoria]) grupos[p.categoria] = [];
      grupos[p.categoria].push(p);
    });
    return grupos;
  }, [filtro]);

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

        {/* Filtros */}
        <div className="shop-filtros">
          {CATEGORIAS.map(cat => (
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