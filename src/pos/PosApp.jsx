// src/pos/PosApp.jsx
import React, { useState } from 'react';
import { ThemeProvider, Box, AppBar, Toolbar, Typography, Tabs, Tab, Card, IconButton } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, Minus, Plus, X } from 'lucide-react';
import ProductGrid from './ProductGrid';
import CheckoutPanel from './CheckoutPanel';
import OrdersList from './OrdersList';
import ReceptionQueue from './ReceptionQueue';
import StaffLogin from '../shared/StaffLogin';
import { useStaffAuth } from '../shared/useStaffAuth';
import { theme, glassSx } from '../shared/theme';
import { usePosCarrito } from './usePosCarrito';

const PosApp = () => {
  const { user, login, logout } = useStaffAuth();
  const carrito = usePosCarrito();
  const [tab, setTab] = useState('tomar');
  const [refreshKey, setRefreshKey] = useState(0);

  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <StaffLogin onLogin={login} />
      </ThemeProvider>
    );
  }

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
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            textColor="primary"
            sx={{ '& .MuiTabs-indicator': { background: 'linear-gradient(90deg, #d1477f, #c98a1f)', height: 3 } }}
          >
            <Tab value="tomar" label="Tomar pedido" />
            <Tab value="lista" label="Pedidos del turno" />
            <Tab value="recepcion" label="Recepción" />
          </Tabs>
        </AppBar>

        {/* Cambio de pestaña sin animación de cross-fade: en un POS real esto
            debe ser instantáneo y nunca depender de que termine una
            animación (rAF puede pausarse si la pantalla pierde foco un
            instante). La animación se reserva para micro-interacciones
            (tarjetas, items) donde una demora no oculta contenido crítico. */}
        {tab === 'tomar' ? (
            <Box
              component="main"
              sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}
            >
              <ProductGrid onAgregar={carrito.agregarItem} />
              <Card elevation={0} sx={{ ...glassSx, flex: 1, minWidth: 320, borderRadius: 0, p: 2.5, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
                <Typography variant="h2" sx={{ fontSize: 18, mb: 1.5 }}>Pedido actual</Typography>
                <AnimatePresence initial={false}>
                  {carrito.items.map((item) => (
                    <motion.div
                      key={item.key}
                      layout
                      initial={{ opacity: 0.6, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                    >
                      <Card elevation={0} sx={{ background: 'rgba(36,26,32,0.04)', borderRadius: 3, p: 1.5, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography sx={{ fontWeight: 600 }}>{item.cantidad}× {item.nombre}</Typography>
                          {item.sabores.length > 0 && (
                            <Typography variant="caption" color="text.secondary">{item.sabores.join(', ')}</Typography>
                          )}
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography sx={{ fontWeight: 700, mr: 1 }}>${item.precio * item.cantidad}</Typography>
                          <IconButton size="small" onClick={() => carrito.actualizarCantidad(item.key, item.cantidad - 1)}><Minus size={14} /></IconButton>
                          <IconButton size="small" onClick={() => carrito.actualizarCantidad(item.key, item.cantidad + 1)}><Plus size={14} /></IconButton>
                          <IconButton size="small" onClick={() => carrito.quitarItem(item.key)}><X size={14} /></IconButton>
                        </Box>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 20, my: 1.5 }}>
                  <span>Total</span>
                  <span>${carrito.total}</span>
                </Box>
                <CheckoutPanel carrito={carrito} onOrderCreated={() => setRefreshKey((k) => k + 1)} />
              </Card>
            </Box>
        ) : tab === 'lista' ? (
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <OrdersList refreshKey={refreshKey} />
            </Box>
        ) : (
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <ReceptionQueue refreshKey={refreshKey} onResolved={() => setRefreshKey((k) => k + 1)} />
            </Box>
        )}
      </Box>
    </ThemeProvider>
  );
};

export default PosApp;
