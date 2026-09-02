// src/pos/OrderDetailsForm.jsx
import React from 'react';
import { Box, TextField, MenuItem } from '@mui/material';

const OrderDetailsForm = ({ detalles, setDetalles }) => {
  const set = (campo) => (e) => setDetalles((prev) => ({ ...prev, [campo]: e.target.value }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <TextField select size="small" label="Tipo de pedido" value={detalles.tipo} onChange={set('tipo')}>
        <MenuItem value="mesa">Mesa</MenuItem>
        <MenuItem value="para_llevar">Para llevar</MenuItem>
        <MenuItem value="domicilio">Domicilio</MenuItem>
      </TextField>

      {detalles.tipo === 'mesa' && (
        <TextField size="small" label="Número de mesa" value={detalles.mesa} onChange={set('mesa')} />
      )}

      {detalles.tipo === 'domicilio' && (
        <>
          <TextField size="small" label="Nombre del cliente" value={detalles.clienteNombre} onChange={set('clienteNombre')} />
          <TextField size="small" label="Teléfono" value={detalles.clienteTelefono} onChange={set('clienteTelefono')} />
          <TextField size="small" label="Dirección" value={detalles.direccion} onChange={set('direccion')} />
        </>
      )}

      {detalles.tipo === 'para_llevar' && (
        <TextField size="small" label="Nombre del cliente" value={detalles.clienteNombre} onChange={set('clienteNombre')} />
      )}

      <TextField size="small" label="Notas" value={detalles.notas} onChange={set('notas')} />
    </Box>
  );
};

export default OrderDetailsForm;
