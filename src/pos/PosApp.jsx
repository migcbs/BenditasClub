// src/pos/PosApp.jsx
import React, { useState } from 'react';
import ProductGrid from './ProductGrid';
import CheckoutPanel from './CheckoutPanel';
import OrdersList from './OrdersList';
import StaffLogin from '../shared/StaffLogin';
import { useStaffAuth } from '../shared/useStaffAuth';
import { usePosCarrito } from './usePosCarrito';
import './pos.css';

const PosApp = () => {
  const { user, login, logout } = useStaffAuth();
  const carrito = usePosCarrito();
  const [tab, setTab] = useState('tomar');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) {
    return <StaffLogin onLogin={login} />;
  }

  return (
    <div className="pos-app">
      <header className="pos-header">
        <span>{user.nombre} · {user.sucursal}</span>
        <button onClick={logout}>Cerrar sesión</button>
      </header>

      <nav className="pos-tabs">
        <button className={tab === 'tomar' ? 'activa' : ''} onClick={() => setTab('tomar')}>
          Tomar pedido
        </button>
        <button className={tab === 'lista' ? 'activa' : ''} onClick={() => setTab('lista')}>
          Pedidos del turno
        </button>
      </nav>

      {tab === 'tomar' ? (
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
            <CheckoutPanel
              carrito={carrito}
              onOrderCreated={() => setRefreshKey((k) => k + 1)}
            />
          </div>
        </main>
      ) : (
        <OrdersList refreshKey={refreshKey} />
      )}
    </div>
  );
};

export default PosApp;
