// src/pos/OrdersList.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Card, Typography, Chip, Button, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { listOrders, updateOrderEstado, updateOrderCocina } from '../shared/staffApi';

const CHIP_COLOR = { pendiente: 'warning', pagado: 'success', cancelado: 'default' };

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

  const marcarEntregado = async (orden) => {
    await updateOrderCocina(orden.id, 'entregada');
    cargar();
  };

  const marcar = async (orden, estado) => {
    const metodoPago = estado === 'pagado' ? (orden.metodoPago || 'efectivo') : undefined;
    await updateOrderEstado(orden.id, estado, metodoPago);
    cargar();
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {orders.length === 0 && <Typography color="text.secondary">No hay pedidos todavía en este turno.</Typography>}
      <AnimatePresence initial={false}>
        {orders.map((orden) => (
          <motion.div key={orden.id} layout initial={{ opacity: 0.6, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card elevation={0} sx={{ background: 'rgba(255,255,255,0.05)', borderRadius: 3, p: 2, mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                <Typography sx={{ fontWeight: 700 }}>{orden.tipo === 'mesa' ? `Mesa ${orden.mesa || '-'}` : orden.tipo}</Typography>
                <Chip size="small" label={orden.estado} color={CHIP_COLOR[orden.estado] || 'default'} />
              </Box>
              {orden.items.map((item) => (
                <Typography key={item.id} variant="body2" color="text.secondary">
                  {item.cantidad}× {item.nombre}
                  {item.sabores.length > 0 && ` (${item.sabores.join(', ')})`}
                </Typography>
              ))}
              <Typography sx={{ fontWeight: 700, mt: 0.5 }}>Total: ${orden.total}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                {orden.estadoCocina === 'lista' && (
                  <Button size="small" variant="outlined" onClick={() => marcarEntregado(orden)}>Marcar entregado</Button>
                )}
                {orden.estado === 'pendiente' && (
                  <>
                    <Button size="small" variant="contained" color="success" onClick={() => marcar(orden, 'pagado')}>Marcar pagado</Button>
                    <Button size="small" color="error" onClick={() => marcar(orden, 'cancelado')}>Cancelar</Button>
                  </>
                )}
              </Box>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default OrdersList;
