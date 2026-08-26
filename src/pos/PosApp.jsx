// src/pos/PosApp.jsx
import React from 'react';
import StaffLogin from './StaffLogin';
import { useStaffAuth } from './useStaffAuth';
import './pos.css';

const PosApp = () => {
  const { user, login, logout } = useStaffAuth();

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
        <p style={{ padding: 20 }}>Catálogo de productos próximamente (Task 6).</p>
      </main>
    </div>
  );
};

export default PosApp;
