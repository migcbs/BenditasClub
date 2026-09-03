// src/pos/CheckoutPanel.jsx
import React, { useState } from 'react';
import { Box, FormControlLabel, Checkbox, TextField, MenuItem, Alert, Button } from '@mui/material';
import { motion } from 'framer-motion';
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
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mt: 1 }}>
      <OrderDetailsForm detalles={detalles} setDetalles={setDetalles} />

      <FormControlLabel
        control={<Checkbox checked={dejarPendiente} onChange={(e) => setDejarPendiente(e.target.checked)} />}
        label="Cobrar al entregar (dejar pendiente)"
      />

      {!dejarPendiente && (
        <TextField select size="small" label="Método de pago" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
          <MenuItem value="efectivo">Efectivo</MenuItem>
          <MenuItem value="tarjeta">Tarjeta (terminal física)</MenuItem>
        </TextField>
      )}

      {error && <Alert severity="error">{error}</Alert>}

      <motion.div whileTap={{ scale: 0.97 }}>
        <Button
          fullWidth
          variant="contained"
          size="large"
          onClick={handleCerrarVenta}
          disabled={carrito.items.length === 0 || enviando}
          sx={{ background: '#E765B7', color: '#241a20' }}
        >
          {dejarPendiente ? 'Guardar pedido pendiente' : 'Cerrar venta'}
        </Button>
      </motion.div>
    </Box>
  );
};

export default CheckoutPanel;
