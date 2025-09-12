import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../Styles.css';

// Importar los iconos de carrito y flecha hacia abajo
import { ShoppingCart, ArrowDown } from 'lucide-react';

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
// Importa las imágenes de las playeras
import playeraMonalisa from '../assets/playera-monalisa.jpeg';
import playeraGrito from '../assets/playera-grito.jpeg';
import playeraFridas from '../assets/playera-fridas.jpeg';
import playeraVenus from '../assets/playera-venus.jpeg';
import playeraAdan from '../assets/playera-adan.jpeg';
// Importa la imagen para el banner de la tienda
import bannerShopImage from '../assets/banner.jpg';

// Importar los nuevos componentes del carrito
import FloatingCartButton from './FloatingCartButton';
import CartPopup from './CartPopup';

// *** DATOS DE LOS PRODUCTOS CON VARIANTES CONSOLIDADAS ***
const shopProducts = [
  {
    id: 'playera-monalisa',
    name: 'Playera Monalisa',
    category: 'Playeras',
    isFeatured: true,
    variants: [
      { id: 'monalisa-unica', name: 'Única', price: 249.00, image: playeraMonalisa, stockStatus: 'low-stock' },
    ]
  },
  {
    id: 'playera-grito',
    name: 'Playera El Grito',
    category: 'Playeras',
    isFeatured: true,
    variants: [
      { id: 'grito-unica', name: 'Única', price: 249.00, image: playeraGrito, stockStatus: 'low-stock' },
    ]
  },
  {
    id: 'playera-fridas',
    name: 'Playera Dos Fridas',
    category: 'Playeras',
    isFeatured: true,
    variants: [
      { id: 'fridas-unica', name: 'Única', price: 249.00, image: playeraFridas, stockStatus: 'low-stock' },
    ]
  },
  {
    id: 'playera-adan',
    name: 'Playera Creación de Adan',
    category: 'Playeras',
    isFeatured: true,
    variants: [
      { id: 'adan-unica', name: 'Única', price: 249.00, image: playeraAdan, stockStatus: 'low-stock' },
    ]
  },
  {
    id: 'playera-venus',
    name: 'Playera Nacimiento de Venus',
    category: 'Playeras',
    isFeatured: true,
    variants: [
      { id: 'venus-unica', name: 'Única', price: 249.00, image: playeraVenus, stockStatus: 'low-stock' },
    ]
  },
  {
    id: 'gorra-benditas',
    name: 'Gorra',
    category: 'Gorras',
    isFeatured: true,
    variants: [
      { id: 'gorra-variant-clasica', name: 'Arena', price: 89.00, image: gorra1, stockStatus: 'in-stock' },
      { id: 'gorra-variant-premium', name: 'Rosa', price: 89.00, image: gorra2, stockStatus: 'low-stock' },
    ]
  },
  {
    id: 'monedero-benditas',
    name: 'Monedero',
    category: 'Monederos',
    isFeatured: true,
    variants: [
      { id: 'monedero-clasico', name: 'BlancoYNegro', price: 50.00, image: monedero1, stockStatus: 'in-stock' },
      { id: 'monedero-rosa', name: 'Rosa', price: 50.00, image: monedero2, stockStatus: 'in-stock' },
      { id: 'monedero-rosa-dos', name: 'Rosa', price: 50.00, image: monedero3, stockStatus: 'out-of-stock' },
    ]
  },
   {
    id: 'cartera-benditas',
    name: 'Cartera',
    category: 'Carteras',
    isFeatured: true,
    variants: [
      { id: 'cartera-clasica', name: 'Classic', price: 99.00, image: cartera1, stockStatus: 'in-stock' },
      { id: 'cartera-premium', name: 'Classic', price: 99.00, image: cartera2, stockStatus: 'in-stock' },
    ]
  },
  {
    id: 'lanyard-benditas',
    name: 'Lanyard',
    category: 'Lanyards',
    isFeatured: true,
    variants: [
      { id: 'lanyard-variant-clasico', name: 'Clásico', price: 69.00, image: lanyard1, stockStatus: 'in-stock' },
      { id: 'lanyard-variant-patron', name: 'Clásico', price: 69.00, image: lanyard2, stockStatus: 'in-stock' },
    ]
  },
  {
    id: 'llavero-benditas',
    name: 'Llavero',
    category: 'Llaveros',
    isFeatured: true,
    variants: [
      { id: 'llavero-variant-metalico', name: 'Hamburguesa', price: 49.00, image: llavero1, stockStatus: 'in-stock' },
      { id: 'llavero-variant-acrilico', name: 'Alita', price: 49.00, image: llavero2, stockStatus: 'in-stock' },
    ]
  },
  {
    id: 'tote-benditas',
    name: 'Tote',
    category: 'Totes',
    isFeatured: true,
    variants: [
      { id: 'tote-hamburguesa', name: 'Hamburguesa', price: 109.00, image: tote1, stockStatus: 'in-stock' },
      { id: 'tote-alita', name: 'Alita', price: 109.00, image: tote2, stockStatus: 'in-stock' },
    ]
  },
  // *** NUEVAS PLAYERAS INDIVIDUALES ***
  
];

const Shop = () => {
  const productsToDisplayInSlider = shopProducts.filter(product => product.isFeatured);

  const [cartItems, setCartItems] = useState([]);
  const [isCartPopupOpen, setIsCartPopupOpen] = useState(false);

  const addToCart = (product, variant) => {
    setCartItems(prevItems => {
      const existingItemIndex = prevItems.findIndex(
        item => item.id === product.id && item.variantId === variant.id
      );

      if (existingItemIndex > -1) {
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      } else {
        return [
          ...prevItems,
          {
            id: product.id,
            variantId: variant.id,
            name: product.name,
            variantName: variant.name,
            price: variant.price,
            quantity: 1,
            image: variant.image,
          },
        ];
      }
    });
  };

  const removeFromCart = (productId, variantId) => {
    setCartItems(prevItems =>
      prevItems.filter(item => !(item.id === productId && item.variantId === variantId))
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalCartItems = cartItems.reduce((total, item) => total + item.quantity, 0);

  const handleScrollToProducts = () => {
    document.getElementById('featured-products').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="shop-page-container">

      <div className="shop-hero-banner" style={{ backgroundImage: `url(${bannerShopImage})` }}>
        <div className="shop-banner-content">
          <button onClick={handleScrollToProducts} className="shop-banner-btn">
            <ArrowDown size={32} />
          </button>
        </div>
      </div>

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

      <div className="shop-return-section">
        <p>¿No encontraste lo que buscabas? ¡No te preocupes!</p>
        <Link to="/" className="return-home-btn">Regresar al Inicio</Link>
      </div>

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
// Componente: ProductCardDisplay (Modificado para añadir al carrito y etiquetas de stock)
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

  // Determinar la clase y texto para el estado de stock
  let stockLabel = null;
  if (currentVariant.stockStatus === 'low-stock') {
    stockLabel = <span className="stock-label low-stock">Casi agotado</span>;
  } else if (currentVariant.stockStatus === 'out-of-stock') {
    stockLabel = <span className="stock-label out-of-stock">Agotado</span>;
  }

  // Deshabilitar el botón de "Añadir al carrito" si el producto está agotado
  const isOutOfStock = currentVariant.stockStatus === 'out-of-stock';

  return (
    <div className="slider-item">
      <img src={currentVariant.image} alt={product.name} className="product-image" />

      {/* Etiqueta de stock */}
      {stockLabel}

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
      <button
        className={`add-to-cart-btn ${isOutOfStock ? 'disabled' : ''}`}
        onClick={handleAddToCartClick}
        disabled={isOutOfStock}
      >
        <ShoppingCart size={24} />
      </button>
    </div>
  );
};

export default Shop;