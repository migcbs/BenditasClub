// src/components/FloatingCartButton.jsx

import React from 'react';
import { ShoppingCart } from 'lucide-react';

const FloatingCartButton = ({ totalItems, onClick }) => {
  return (
    <button
      className="floating-cart-btn"
      onClick={onClick}
      aria-label={`Ver carrito (${totalItems} items)`}
    >
      <ShoppingCart size={22} />
      {totalItems > 0 && (
        <span className="floating-cart-badge">{totalItems > 9 ? '9+' : totalItems}</span>
      )}
    </button>
  );
};

export default FloatingCartButton;