// src/kitchen/KitchenApp.jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
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

// Mismo isotipo que la pestaña del navegador y la navbar del sitio público.
const LOGO_ICON = `${process.env.PUBLIC_URL}/logo192.jpg`;

const folio = (orden) => `#${orden.id.slice(0, 6).toUpperCase()}`;

// Minutos desde que se creó el pedido — no una fecha, es lo que le importa
// a cocina para priorizar ("esto lleva 12 min esperando").
const minutosDesde = (fecha) => Math.max(0, Math.round((Date.now() - new Date(fecha).getTime()) / 60000));

const KitchenApp = () => {
  const { user, login, logout } = useStaffAuth();
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const columnRefs = useRef({});

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
    // Optimista: mueve la tarjeta ya mismo en vez de esperar los hasta 4s
    // del siguiente polling — si falla, cargar() la regresa a su lugar real.
    setOrders((prev) => prev.map((o) => (o.id === orden.id ? { ...o, estadoCocina: siguiente } : o)));
    try {
      await updateOrderCocina(orden.id, siguiente);
    } catch (e) {
      setError(e.message);
    } finally {
      cargar();
    }
  };

  // Al soltar una tarjeta, revisa sobre qué columna quedó el puntero
  // (comparando contra el rect de cada columna) y, si es una distinta a la
  // actual, la mueve a ese estado — sin importar el orden (nueva -> lista
  // directo también es válido, por si cocina se equivocó de un salto).
  const handleDragEnd = (orden, event, info) => {
    const punto = { x: info.point.x, y: info.point.y };
    const destino = COLUMNAS.find((col) => {
      const el = columnRefs.current[col.estado];
      if (!el) return false;
      const rect = el.getBoundingClientRect();
      return punto.x >= rect.left && punto.x <= rect.right && punto.y >= rect.top && punto.y <= rect.bottom;
    });
    if (destino && destino.estado !== orden.estadoCocina) {
      avanzar(orden, destino.estado);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
        <AppBar position="static" color="transparent" elevation={0} sx={{ ...glassSx, boxShadow: 'none' }}>
          <Toolbar sx={{ justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <Box component="img" src={LOGO_ICON} alt="" sx={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
              <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>{user.nombre} · {user.sucursal}</Typography>
            </Box>
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
            <Box
              key={col.estado}
              ref={(el) => { columnRefs.current[col.estado] = el; }}
              sx={{ minHeight: 120, borderRadius: 3, transition: 'background-color .15s ease' }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <Typography variant="h2" sx={{ fontSize: 17 }}>{col.titulo}</Typography>
                <Chip size="small" color={col.color} label={orders.filter((o) => o.estadoCocina === col.estado).length} />
              </Box>
              <AnimatePresence initial={false}>
                {orders.filter((o) => o.estadoCocina === col.estado).map((orden) => (
                  <motion.div
                    key={orden.id}
                    layout
                    initial={{ opacity: 0.6, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    drag={user.role === 'cocina'}
                    dragSnapToOrigin
                    dragElastic={0.15}
                    dragMomentum={false}
                    whileDrag={{ scale: 1.05, zIndex: 20, boxShadow: '0 12px 30px rgba(36,26,32,.25)' }}
                    onDragEnd={(event, info) => handleDragEnd(orden, event, info)}
                    style={user.role === 'cocina' ? { cursor: 'grab' } : undefined}
                  >
                    <Card elevation={0} sx={{ ...glassSx, borderRadius: 3, p: 0, mb: 1.5, overflow: 'hidden' }}>
                      {/* Encabezado de la comanda: folio, tipo/cliente, tiempo esperando */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, px: 2, pt: 1.5, pb: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 800, fontFamily: 'monospace', flexShrink: 0 }}>{folio(orden)}</Typography>
                          {orden.origen === 'online' && <Chip size="small" label="En línea" sx={{ bgcolor: '#E765B7', color: '#fff' }} />}
                        </Box>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={`${minutosDesde(orden.createdAt)} min`}
                          color={minutosDesde(orden.createdAt) >= 15 ? 'error' : 'default'}
                        />
                      </Box>

                      <Typography sx={{ fontWeight: 700, px: 2, pb: 1 }}>{describirPedido(orden)}</Typography>

                      {orden.tipo === 'domicilio' && orden.direccion && (
                        <Typography variant="body2" color="text.secondary" sx={{ px: 2, pb: 1 }}>
                          📍 {orden.direccion}
                        </Typography>
                      )}

                      {/* Detalle del pedido — línea punteada como una comanda de verdad */}
                      <Box sx={{ borderTop: '1px dashed rgba(36,26,32,.25)', px: 2, py: 1.25 }}>
                        {orden.items.map((item) => (
                          <Box key={item.id} sx={{ mb: 0.75, '&:last-child': { mb: 0 } }}>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.cantidad}× {item.nombre}
                            </Typography>
                            {item.sabores.length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                🌶 {item.sabores.join(', ')}
                              </Typography>
                            )}
                          </Box>
                        ))}
                      </Box>

                      {orden.notas && (
                        <Box sx={{ borderTop: '1px dashed rgba(36,26,32,.25)', px: 2, py: 1 }}>
                          <Typography variant="caption" fontStyle="italic">📝 {orden.notas}</Typography>
                        </Box>
                      )}

                      {col.siguiente && user.role === 'cocina' && (
                        <Box sx={{ px: 2, pb: 2, pt: orden.notas ? 0 : 1.5 }}>
                          <Button
                            fullWidth
                            variant="contained"
                            size="small"
                            sx={{ background: '#E765B7', color: '#241a20' }}
                            onClick={() => avanzar(orden, col.siguiente)}
                          >
                            {col.accion}
                          </Button>
                        </Box>
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
