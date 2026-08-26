// src/pos/OrdersList.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { listOrders, updateOrderEstado } from './api';

const OrdersList = ({ refreshKey }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    listOrders()
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar, refreshKey]);

  const marcar = async (orden, estado) => {
    const metodoPago = estado === 'pagado' ? (orden.metodoPago || 'efectivo') : undefined;
    await updateOrderEstado(orden.id, estado, metodoPago);
    cargar();
  };

  return (
    <div className="pos-orders-list">
      {error && <p className="pos-error">{error}</p>}
      {orders.length === 0 && <p>No hay pedidos todavía en este turno.</p>}
      {orders.map((orden) => (
        <div className="pos-order-card" key={orden.id}>
          <strong>{orden.tipo === 'mesa' ? `Mesa ${orden.mesa}` : orden.tipo}</strong>
          {' · '}
          <span>{orden.estado}</span>
          <div>
            {orden.items.map((item) => (
              <div key={item.id}>
                {item.cantidad}× {item.nombre}
                {item.sabores.length > 0 && ` (${item.sabores.join(', ')})`}
              </div>
            ))}
          </div>
          <div>Total: ${orden.total}</div>
          {orden.estado === 'pendiente' && (
            <div>
              <button onClick={() => marcar(orden, 'pagado')}>Marcar pagado</button>
              <button onClick={() => marcar(orden, 'cancelado')}>Cancelar</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default OrdersList;
