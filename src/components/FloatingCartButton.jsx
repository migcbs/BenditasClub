// src/components/FloatingCartButton.jsx
import React from 'react';
import { ShoppingCart } from 'lucide-react';
import '../Styles.css'; // Asegúrate de que el CSS esté enlazado

const FloatingCartButton = ({ totalItems, onClick }) => {
  return (
    <button className="floating-cart-btn" onClick={onClick}>
      <ShoppingCart size={32} /> {/* Icono más grande para el botón flotante */}
      {totalItems > 0 && (
        <span className="cart-badge">{totalItems}</span>
      )}
    </button>
  );
};

export default FloatingCartButton;