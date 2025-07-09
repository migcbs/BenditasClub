// src/components/Shop.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Styles.css';

// Importar los iconos de carrito y AHORA TAMBIÉN LA FLECHA HACIA ABAJO
import { ShoppingCart, ArrowDown } from 'lucide-react'; // <--- AGREGADO ArrowDown

// Importar las imágenes de los productos
import bucket1 from '../assets/bucket1.jpg';
import gorra1 from '../assets/gorra1.jpg';
import gorra2 from '../assets/gorra2.jpg';
import gorro from '../assets/gorro.jpg';
import hoodie1 from '../assets/hoodie1.jpg';
import hoodie2 from '../assets/hoodie2.jpg';
import lanyard1 from '../assets/lanyard1.jpg';
import lanyard2 from '../assets/lanyard2.jpg';
import llavero1 from '../assets/llavero1.jpg';
import llavero2 from '../assets/llavero2.jpg';
import tote1 from '../assets/tote1.jpg';
import tote2 from '../assets/tote2.jpg';
import monedero1 from '../assets/monedero1.jpeg';
import monedero2 from '../assets/monedero2.jpeg';
import monedero3 from '../assets/monedero3.jpeg';
import cartera1 from '../assets/cartera1.jpeg';
import cartera2 from '../assets/cartera2.jpeg';
// Importa la imagen para el banner de la tienda
import bannerShopImage from '../assets/banner.jpg';

// Importar los nuevos componentes del carrito
import FloatingCartButton from './FloatingCartButton';
import CartPopup from './CartPopup';

// *** DATOS DE LOS PRODUCTOS CON VARIANTES CONSOLIDADAS ***
const shopProducts = [
  /*{
    id: 'bucket-hat-exclusivo',
    name: 'Bucket Hat',
    category: 'Bucket Hats',
    isFeatured: true,
    variants: [
      { id: 'bucket1-variant-default', name: 'Único', price: 99.00, image: bucket1 },
    ]
  },*/
  {
    id: 'gorra-benditas',
    name: 'Gorra',
    category: 'Gorras',
    isFeatured: true,
    variants: [
      { id: 'gorra-variant-clasica', name: 'Arena', price: 89.00, image: gorra1 },
      { id: 'gorra-variant-premium', name: 'Rosa', price: 89.00, image: gorra2 },
    ]
  },
   {
    id: 'monedero-benditas',
    name: 'Monedero',
    category: 'Monederos',
    isFeatured: true,
    variants: [
      { id: 'monedero-clasico', name: 'BlancoYNegro', price: 50.00, image: monedero1 },
      { id: 'monedero-rosa', name: 'Rosa', price: 50.00, image: monedero2 },
      { id: 'monedero-rosa-dos', name: 'Rosa', price: 50.00, image: monedero3 },
    ]
  },
   {
    id: 'cartera-benditas',
    name: 'Cartera',
    category: 'Carteras',
    isFeatured: true,
    variants: [
      { id: 'cartera-clasica', name: 'Classic', price: 99.00, image: cartera1 },
      { id: 'cartera-premium', name: 'Classic', price: 99.00, image: cartera2 },
    ]
  },
  /*{
    id: 'gorro-beanie',
    name: 'Gorro',
    category: 'Gorros',
    isFeatured: true,
    variants: [
      { id: 'gorro-variant-default', name: 'Color Único', price: 89.00, image: gorro },
    ]
  },
  {
    id: 'hoodie-benditas',
    name: 'Hoodie',
    category: 'Hoodies',
    isFeatured: true,
    variants: [
      { id: 'hoodie-variant-negro', name: 'Negro', price: 350.00, image: hoodie1 },
      { id: 'hoodie-variant-gris', price: 350.00, image: hoodie2 },
    ]
  },*/
  {
    id: 'lanyard-benditas',
    name: 'Lanyard',
    category: 'Lanyards',
    isFeatured: true,
    variants: [
      { id: 'lanyard-variant-clasico', name: 'Clásico', price: 69.00, image: lanyard1 },
      { id: 'lanyard-variant-patron', name: 'Clásico', price: 69.00, image: lanyard2 },
    ]
  },
  {
    id: 'llavero-benditas',
    name: 'Llavero',
    category: 'Llaveros',
    isFeatured: true,
    variants: [
      { id: 'llavero-variant-metalico', name: 'Hamburguesa', price: 49.00, image: llavero1 },
      { id: 'llavero-variant-acrilico', name: 'Alita', price: 49.00, image: llavero2 },
    ]
  },
  {
    id: 'tote-benditas',
    name: 'Tote',
    category: 'Totes',
    isFeatured: true,
    variants: [
      { id: 'tote-hamburguesa', name: 'Hamburguesa', price: 109.00, image: tote1 },
      { id: 'tote-alita', name: 'Alita', price: 109.00, image: tote2 },
    ]
  },
];

const Shop = () => {
  const productsToDisplayInSlider = shopProducts.filter(product => product.isFeatured);

  // *** ESTADO DEL CARRITO ***
  const [cartItems, setCartItems] = useState([]); // [{id, name, variantName, price, quantity, image}]
  const [isCartPopupOpen, setIsCartPopupOpen] = useState(false);

  // Función para añadir un producto al carrito
  const addToCart = (product, variant) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.id === product.id && item.variantId === variant.id
      );

      if (existingItemIndex > -1) {
        // Si el producto/variante ya existe, incrementa la cantidad
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      } else {
        // Si no existe, añade el nuevo producto
        return [
          ...prevItems,
          {
            id: product.id,
            variantId: variant.id, // Para identificar la variante única
            name: product.name,
            variantName: variant.name,
            price: variant.price,
            quantity: 1,
            image: variant.image,
          },
        ];
      }
    });
    // Opcional: Mostrar un mensaje o abrir el carrito automáticamente
    // setIsCartPopupOpen(true); // Puedes descomentar esto si quieres que el popup se abra al añadir
  };

  // Función para remover un producto del carrito
  const removeFromCart = (productId, variantId) => {
    setCartItems(prevItems =>
      prevItems.filter(item => !(item.id === productId && item.variantId === variantId))
    );
  };

  // Función para vaciar el carrito
  const clearCart = () => {
    setCartItems([]);
  };

  // Calcular el total de ítems en el carrito para el badge
  const totalCartItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Función para el scroll suave al slider de productos
  const handleScrollToProducts = () => {
    document.getElementById('featured-products').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="shop-page-container">

      {/* 1. SECCIÓN DE BANNER DE LA TIENDA */}
      <div className="shop-hero-banner" style={{ backgroundImage: `url(${bannerShopImage})` }}>
        <div className="shop-banner-content">
          {/* CAMBIADO: El botón ahora es solo un icono de flecha */}
          <button onClick={handleScrollToProducts} className="shop-banner-btn">
            <ArrowDown size={32} /> {/* Icono de flecha hacia abajo de lucide-react */}
          </button>
        </div>
      </div>

      {/* 2. SLIDER/CARRUSEL DE PRODUCTOS PRINCIPAL */}
      {productsToDisplayInSlider.length > 0 && (
        <section id="featured-products" className="featured-products-slider section-spacing">
          
          <div className="slider-placeholder">
            {productsToDisplayInSlider.map(product => (
              <ProductCardDisplay
                key={product.id}
                product={product}
                addToCart={addToCart}
              />
            ))}
          </div>
        </section>
      )}

      {/* Botón para regresar al inicio o al flujo principal */}
      <div className="shop-return-section">
        <p>¿No encontraste lo que buscabas? ¡No te preocupes!</p>
        <Link to="/" className="return-home-btn">Regresar al Inicio</Link>
      </div>

      {/* *** NUEVOS COMPONENTES DEL CARRITO *** */}
      <FloatingCartButton
        totalItems={totalCartItems}
        onClick={() => setIsCartPopupOpen(true)}
      />

      {isCartPopupOpen && (
        <CartPopup
          cartItems={cartItems}
          onClose={() => setIsCartPopupOpen(false)}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
        />
      )}

    </div>
  );
};

// =========================================================
// Componente: ProductCardDisplay (Modificado para añadir al carrito)
// =========================================================
const ProductCardDisplay = ({ product, addToCart }) => {
  const [currentVariant, setCurrentVariant] = useState(product.variants[0]);

  const handleVariantClick = (variant) => {
    setCurrentVariant(variant);
  };

  const handleAddToCartClick = () => {
    addToCart(product, currentVariant);
  };

  const displayPrice = currentVariant ? currentVariant.price : product.variants[0].price;
  const showVariantOptions = product.variants && product.variants.length > 1;

  return (
    <div className="slider-item">
      <img src={currentVariant.image} alt={product.name} className="product-image" />
      <h3>{product.name}</h3>
      <p className="product-price">${displayPrice.toFixed(2)} MXN</p>
      

      {showVariantOptions && (
        <div className="product-variants-options">
          {product.variants.map(variant => (
            <img
              key={variant.id}
              src={variant.image}
              alt={variant.name}
              className={`variant-thumbnail ${currentVariant.id === variant.id ? 'active' : ''}`}
              title={variant.name}
              onClick={() => handleVariantClick(variant)}
            />
          ))}
        </div>
      )}
      <button className="add-to-cart-btn" onClick={handleAddToCartClick}>
        <ShoppingCart size={24} />
      </button>
    </div>
  );
};

export default Shop;