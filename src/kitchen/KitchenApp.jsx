// src/kitchen/KitchenApp.jsx
import React, { useCallback, useEffect, useState } from 'react';
import StaffLogin from '../shared/StaffLogin';
import { useStaffAuth } from '../shared/useStaffAuth';
import { listOrders, updateOrderCocina } from '../shared/staffApi';
import './kitchen.css';

const COLUMNAS = [
  { estado: 'nueva', titulo: 'Nueva', siguiente: 'en_preparacion', accion: 'Empezar' },
  { estado: 'en_preparacion', titulo: 'En preparación', siguiente: 'lista', accion: 'Marcar lista' },
  { estado: 'lista', titulo: 'Lista', siguiente: null, accion: null },
];

const describirPedido = (orden) => {
  if (orden.tipo === 'mesa') return `Mesa ${orden.mesa || '-'}`;
  if (orden.tipo === 'domicilio') return `Domicilio · ${orden.clienteNombre || 'sin nombre'}`;
  return `Para llevar${orden.clienteNombre ? ` · ${orden.clienteNombre}` : ''}`;
};

const KitchenApp = () => {
  const { user, login, logout } = useStaffAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    if (!user) return;
    listOrders()
      .then((data) => setOrders(data.filter((o) => o.estado !== 'cancelado' && o.estadoCocina !== 'entregada')))
      .catch((e) => setError(e.message));
  }, [user]);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 4000);
    return () => clearInterval(interval);
  }, [cargar]);

  if (!user) {
    return <StaffLogin onLogin={login} title="BenditasClub Cocina" />;
  }

  const avanzar = async (orden, siguiente) => {
    await updateOrderCocina(orden.id, siguiente);
    cargar();
  };

  return (
    <div className="kitchen-app">
      <header className="kitchen-header">
        <span>{user.nombre} · {user.sucursal}</span>
        <button onClick={logout}>Cerrar sesión</button>
      </header>

      {error && <p className="pos-error">{error}</p>}

      <div className="kitchen-board">
        {COLUMNAS.map((col) => (
          <div className="kitchen-column" key={col.estado}>
            <h3>{col.titulo}</h3>
            {orders.filter((o) => o.estadoCocina === col.estado).map((orden) => (
              <div className="kitchen-card" key={orden.id}>
                <strong>{describirPedido(orden)}</strong>
                <ul>
                  {orden.items.map((item) => (
                    <li key={item.id}>
                      {item.cantidad}× {item.nombre}
                      {item.sabores.length > 0 && <div><small>{item.sabores.join(', ')}</small></div>}
                    </li>
                  ))}
                </ul>
                {orden.notas && <p><em>{orden.notas}</em></p>}
                {col.siguiente && (
                  <button onClick={() => avanzar(orden, col.siguiente)}>{col.accion}</button>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KitchenApp;
