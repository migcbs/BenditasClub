// src/pos/OrderDetailsForm.jsx
import React from 'react';

const OrderDetailsForm = ({ detalles, setDetalles }) => {
  const set = (campo) => (e) => setDetalles((prev) => ({ ...prev, [campo]: e.target.value }));

  return (
    <div className="pos-order-details">
      <label>
        Tipo de pedido
        <select value={detalles.tipo} onChange={set('tipo')}>
          <option value="mesa">Mesa</option>
          <option value="para_llevar">Para llevar</option>
          <option value="domicilio">Domicilio</option>
        </select>
      </label>

      {detalles.tipo === 'mesa' && (
        <label>
          Número de mesa
          <input value={detalles.mesa} onChange={set('mesa')} />
        </label>
      )}

      {detalles.tipo === 'domicilio' && (
        <>
          <label>
            Nombre del cliente
            <input value={detalles.clienteNombre} onChange={set('clienteNombre')} />
          </label>
          <label>
            Teléfono
            <input value={detalles.clienteTelefono} onChange={set('clienteTelefono')} />
          </label>
          <label>
            Dirección
            <input value={detalles.direccion} onChange={set('direccion')} />
          </label>
        </>
      )}

      {detalles.tipo === 'para_llevar' && (
        <label>
          Nombre del cliente
          <input value={detalles.clienteNombre} onChange={set('clienteNombre')} />
        </label>
      )}

      <label>
        Notas
        <input value={detalles.notas} onChange={set('notas')} />
      </label>
    </div>
  );
};

export default OrderDetailsForm;
