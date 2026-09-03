// src/pos/ReceptionQueue.jsx
// Cola de filtrado para pedidos en línea: llegan primero aquí (recibidoEn
// null) antes de aparecer en "Pedidos del turno" o en cocina. Quien esté en
// caja acepta (pasa a la operación normal) o rechaza (se cancela) cada uno.
import React, { useCallback, useEffect, useState } from 'react';
import { Box, Card, Typography, Chip, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { listPendingReception, resolveReception } from '../shared/staffApi';

const TIPO_LABEL = { mesa: 'Mesa', para_llevar: 'Para llevar', domicilio: 'Domicilio' };

const describirPedido = (orden) => {
  const nombre = TIPO_LABEL[orden.tipo] || orden.tipo;
  return orden.clienteNombre ? `${nombre} · ${orden.clienteNombre}` : nombre;
};

const ReceptionQueue = ({ refreshKey, onResolved }) => {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rechazando, setRechazando] = useState(null);
  const [motivo, setMotivo] = useState('');
  const [motivoError, setMotivoError] = useState('');

  const cargar = useCallback(() => {
    listPendingReception().then(setOrders).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 5000);
    return () => clearInterval(interval);
  }, [cargar, refreshKey]);

  const aceptar = async (orden) => {
    setError('');
    setBusyId(orden.id);
    try {
      await resolveReception(orden.id, true);
      cargar();
      onResolved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const abrirRechazo = (orden) => {
    setRechazando(orden);
    setMotivo('');
    setMotivoError('');
  };

  const confirmarRechazo = async () => {
    if (!motivo.trim()) {
      setMotivoError('Escribe el motivo del rechazo — el cliente lo va a ver.');
      return;
    }
    setError('');
    setBusyId(rechazando.id);
    try {
      await resolveReception(rechazando.id, false, motivo.trim());
      setRechazando(null);
      cargar();
      onResolved?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {orders.length === 0 && (
        <Typography color="text.secondary">No hay pedidos en línea esperando revisión.</Typography>
      )}
      <AnimatePresence initial={false}>
        {orders.map((orden) => (
          <motion.div key={orden.id} layout initial={{ opacity: 0.6, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Card elevation={0} sx={{ background: 'rgba(36,26,32,0.05)', borderRadius: 3, p: 2, mb: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1 }}>
                <Typography sx={{ fontWeight: 700 }}>{describirPedido(orden)}</Typography>
                <Chip size="small" label="En línea" color="secondary" variant="outlined" />
              </Box>
              {orden.clienteTelefono && <Typography variant="body2" color="text.secondary">Tel: {orden.clienteTelefono}</Typography>}
              {orden.direccion && <Typography variant="body2" color="text.secondary">Dirección: {orden.direccion}</Typography>}
              {orden.notas && <Typography variant="body2" color="text.secondary">Notas: {orden.notas}</Typography>}
              {orden.items.map((item) => (
                <Typography key={item.id} variant="body2" color="text.secondary">
                  {item.cantidad}× {item.nombre}
                  {item.sabores.length > 0 && ` (${item.sabores.join(', ')})`}
                </Typography>
              ))}
              <Typography sx={{ fontWeight: 700, mt: 0.5 }}>Total: ${orden.total}</Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button size="small" variant="contained" color="success" disabled={busyId === orden.id} onClick={() => aceptar(orden)}>Aceptar</Button>
                <Button size="small" color="error" disabled={busyId === orden.id} onClick={() => abrirRechazo(orden)}>Rechazar</Button>
              </Box>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <Dialog open={Boolean(rechazando)} onClose={() => !busyId && setRechazando(null)} fullWidth maxWidth="xs">
        <DialogTitle>Rechazar pedido{rechazando ? ` · ${describirPedido(rechazando)}` : ''}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            El cliente va a ver este motivo en su historial de pedidos.
          </Typography>
          <TextField
            autoFocus
            fullWidth
            multiline
            minRows={2}
            label="Motivo del rechazo"
            placeholder="Ej. Ya no tenemos ese producto disponible, sucursal cerrada, etc."
            value={motivo}
            onChange={(event) => { setMotivo(event.target.value); setMotivoError(''); }}
            error={Boolean(motivoError)}
            helperText={motivoError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRechazando(null)} disabled={busyId === rechazando?.id}>Cancelar</Button>
          <Button color="error" variant="contained" onClick={confirmarRechazo} disabled={busyId === rechazando?.id}>Rechazar pedido</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReceptionQueue;
