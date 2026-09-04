// src/pos/OrdersList.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Card, Typography, Chip, Button, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { listOrders, updateOrderEstado, updateOrderCocina } from '../shared/staffApi';

const CHIP_COLOR = { pendiente: 'warning', pagado: 'success', cancelado: 'default' };
const TIPO_LABEL = { mesa: 'Mesa', para_llevar: 'Para llevar', domicilio: 'Domicilio' };
const COCINA_LABEL = { nueva: 'Nueva', en_preparacion: 'En preparación', lista: 'Lista', entregada: 'Entregada' };
const COCINA_COLOR = { nueva: 'default', en_preparacion: 'info', lista: 'success', entregada: 'default' };

const describirPedido = (orden) => {
  if (orden.tipo === 'mesa') return `Mesa ${orden.mesa || '-'}`;
  const nombre = TIPO_LABEL[orden.tipo] || orden.tipo;
  return orden.clienteNombre ? `${nombre} · ${orden.clienteNombre}` : nombre;
};

const OrdersList = ({ refreshKey }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');

  const cargar = useCallback(() => {
    listOrders()
      .then(setOrders)
      .catch((e) => setError(e.message));
  }, []);

  // Antes solo se recargaba al montar o cuando este mismo mesero resolvía
  // algo en Recepción — un pedido aceptado desde OTRA terminal, o que
  // cocina marca "lista", no aparecía aquí hasta cambiar de pestaña. Mismo
  // intervalo que Recepción/Cocina (4-5s) para que las tres pantallas se
  // sientan igual de "en vivo".
  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 5000);
    return () => clearInterval(interval);
  }, [cargar, refreshKey]);

  const marcarEntregado = async (orden) => {
    setError('');
    try {
      await updateOrderCocina(orden.id, 'entregada');
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  const marcar = async (orden, estado) => {
    setError('');
    try {
      const metodoPago = estado === 'pagado' ? (orden.metodoPago || 'efectivo') : undefined;
      await updateOrderEstado(orden.id, estado, metodoPago);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {orders.length === 0 && <Typography color="text.secondary">No hay pedidos todavía en este turno.</Typography>}
      <AnimatePresence initial={false}>
        {orders.map((orden) => (
          <motion.div key={orden.id} layout initial={{ opacity: 0.6, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card elevation={0} sx={{ background: 'rgba(36,26,32,0.05)', borderRadius: 3, p: 2, mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>{describirPedido(orden)}</Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                  <Chip size="small" label={COCINA_LABEL[orden.estadoCocina] || orden.estadoCocina} color={COCINA_COLOR[orden.estadoCocina] || 'default'} variant="outlined" />
                  <Chip size="small" label={orden.estado} color={CHIP_COLOR[orden.estado] || 'default'} />
                </Box>
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
