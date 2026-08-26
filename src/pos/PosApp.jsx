// src/pos/PosApp.jsx
import React from 'react';
import StaffLogin from './StaffLogin';
import ProductGrid from './ProductGrid';
import CheckoutPanel from './CheckoutPanel';
import { useStaffAuth } from './useStaffAuth';
import { usePosCarrito } from './usePosCarrito';
import './pos.css';

const PosApp = () => {
  const { user, login, logout } = useStaffAuth();
  const carrito = usePosCarrito();

  if (!user) {
    return <StaffLogin onLogin={login} />;
  }

  return (
    <div className="pos-app">
      <header className="pos-header">
        <span>{user.nombre} · {user.sucursal}</span>
        <button onClick={logout}>Cerrar sesión</button>
      </header>
      <main className="pos-main">
        <ProductGrid onAgregar={carrito.agregarItem} />
        <div className="pos-carrito">
          <h3>Pedido actual</h3>
          {carrito.items.map((item) => (
            <div className="pos-carrito-item" key={item.key}>
              <span>
                {item.cantidad}× {item.nombre}
                {item.sabores.length > 0 && <div><small>{item.sabores.join(', ')}</small></div>}
              </span>
              <span>
                ${item.precio * item.cantidad}
                <button onClick={() => carrito.actualizarCantidad(item.key, item.cantidad - 1)}>-</button>
                <button onClick={() => carrito.actualizarCantidad(item.key, item.cantidad + 1)}>+</button>
                <button onClick={() => carrito.quitarItem(item.key)}>×</button>
              </span>
            </div>
          ))}
          <div className="pos-total">
            <span>Total</span>
            <span>${carrito.total}</span>
          </div>
          <CheckoutPanel carrito={carrito} onOrderCreated={() => {}} />
        </div>
      </main>
    </div>
  );
};

export default PosApp;
