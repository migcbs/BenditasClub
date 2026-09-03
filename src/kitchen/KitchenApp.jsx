// src/kitchen/KitchenApp.jsx
import React, { useCallback, useEffect, useState } from 'react';
import { ThemeProvider, Box, AppBar, Toolbar, Typography, IconButton, Card, Button, Alert, Chip } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut } from 'lucide-react';
import StaffLogin from '../shared/StaffLogin';
import { useStaffAuth } from '../shared/useStaffAuth';
import { listOrders, updateOrderCocina } from '../shared/staffApi';
import { theme, glassSx } from '../shared/theme';

const COLUMNAS = [
  { estado: 'nueva', titulo: 'Nueva', siguiente: 'en_preparacion', accion: 'Empezar', color: 'warning' },
  { estado: 'en_preparacion', titulo: 'En preparación', siguiente: 'lista', accion: 'Marcar lista', color: 'info' },
  { estado: 'lista', titulo: 'Lista', siguiente: null, accion: null, color: 'success' },
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
    return (
      <ThemeProvider theme={theme}>
        <StaffLogin onLogin={login} title="BenditasClub Cocina" />
      </ThemeProvider>
    );
  }

  const avanzar = async (orden, siguiente) => {
    setError('');
    try {
      await updateOrderCocina(orden.id, siguiente);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ ...glassSx, boxShadow: 'none' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{user.nombre} · {user.sucursal}</Typography>
            <IconButton onClick={logout} sx={{ color: 'text.primary' }} aria-label="Cerrar sesión">
              <LogOut size={20} />
            </IconButton>
          </Toolbar>
        </AppBar>

        {error && <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>}
        {user.role !== 'cocina' && (
          <Alert severity="info" sx={{ m: 2, mb: 0 }}>
            Estás viendo la cocina como empleado — solo el rol de cocina puede avanzar los pedidos entre columnas.
          </Alert>
        )}

        <Box sx={{ flex: 1, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 2, p: 2, overflow: 'auto' }}>
          {COLUMNAS.map((col) => (
            <Box key={col.estado}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Typography variant="h2" sx={{ fontSize: 17 }}>{col.titulo}</Typography>
                <Chip size="small" color={col.color} label={orders.filter((o) => o.estadoCocina === col.estado).length} />
              </Box>
              <AnimatePresence initial={false}>
                {orders.filter((o) => o.estadoCocina === col.estado).map((orden) => (
                  <motion.div key={orden.id} layout initial={{ opacity: 0.6, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                    <Card elevation={0} sx={{ ...glassSx, borderRadius: 3, p: 2, mb: 1.5 }}>
                      <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{describirPedido(orden)}</Typography>
                      {orden.items.map((item) => (
                        <Typography key={item.id} variant="body2" color="text.secondary">
                          {item.cantidad}× {item.nombre}
                          {item.sabores.length > 0 && ` — ${item.sabores.join(', ')}`}
                        </Typography>
                      ))}
                      {orden.notas && <Typography variant="caption" fontStyle="italic">{orden.notas}</Typography>}
                      {col.siguiente && user.role === 'cocina' && (
                        <Button
                          fullWidth
                          variant="contained"
                          size="small"
                          sx={{ mt: 1.5, background: '#E765B7', color: '#241a20' }}
                          onClick={() => avanzar(orden, col.siguiente)}
                        >
                          {col.accion}
                        </Button>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </Box>
          ))}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default KitchenApp;
