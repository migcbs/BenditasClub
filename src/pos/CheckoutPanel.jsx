// src/pos/CheckoutPanel.jsx
import React, { useState } from 'react';
import OrderDetailsForm from './OrderDetailsForm';
import { createOrder, updateOrderEstado } from '../shared/staffApi';

const DETALLES_INICIALES = {
  tipo: 'mesa',
  mesa: '',
  clienteNombre: '',
  clienteTelefono: '',
  direccion: '',
  notas: '',
};

const CheckoutPanel = ({ carrito, onOrderCreated }) => {
  const [detalles, setDetalles] = useState(DETALLES_INICIALES);
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [dejarPendiente, setDejarPendiente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');

  const handleCerrarVenta = async () => {
    setError('');
    setEnviando(true);
    try {
      const payload = {
        tipo: detalles.tipo,
        mesa: detalles.tipo === 'mesa' ? detalles.mesa : undefined,
        clienteNombre: detalles.clienteNombre || undefined,
        clienteTelefono: detalles.clienteTelefono || undefined,
        direccion: detalles.tipo === 'domicilio' ? detalles.direccion : undefined,
        notas: detalles.notas || undefined,
        items: carrito.items.map((i) => ({
          productId: i.productId,
          cantidad: i.cantidad,
          sabores: i.sabores,
        })),
      };
      const orden = await createOrder(payload);

      if (!dejarPendiente) {
        // Cerrar la venta: la terminal física ya cobró, solo registramos el método.
        await updateOrderEstado(orden.id, 'pagado', metodoPago);
      }

      carrito.vaciar();
      setDetalles(DETALLES_INICIALES);
      onOrderCreated(orden);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="pos-checkout">
      <OrderDetailsForm detalles={detalles} setDetalles={setDetalles} />

      <label>
        <input
          type="checkbox"
          checked={dejarPendiente}
          onChange={(e) => setDejarPendiente(e.target.checked)}
        />
        Cobrar al entregar (dejar pendiente)
      </label>

      {!dejarPendiente && (
        <label>
          Método de pago
          <select value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta (terminal física)</option>
          </select>
        </label>
      )}

      {error && <p className="pos-error">{error}</p>}

      <button
        className="pos-btn-cerrar-venta"
        onClick={handleCerrarVenta}
        disabled={carrito.items.length === 0 || enviando}
      >
        {dejarPendiente ? 'Guardar pedido pendiente' : 'Cerrar venta'}
      </button>
    </div>
  );
};

export default CheckoutPanel;
