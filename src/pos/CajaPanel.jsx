// src/pos/CajaPanel.jsx
// Caja del turno, escapada siempre a la sucursal del mesero logueado — no
// necesita entrar como admin, y nunca ve ni afecta la caja de la otra
// sucursal (el backend la resuelve por el token, ver /api/caja/*).
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Button, Card, MenuItem, TextField, Typography } from '@mui/material';
import { getCajaActual, abrirCaja, registrarMovimientoCaja, cerrarCaja } from '../shared/staffApi';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

const CajaPanel = () => {
  const [caja, setCaja] = useState(undefined); // undefined = cargando, null = sin caja abierta
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [fondoInicial, setFondoInicial] = useState('');
  const [movimiento, setMovimiento] = useState({ type: 'pay_in', amount: '', concept: '' });
  const [cierre, setCierre] = useState({ abierto: false, countedAmount: '', notes: '' });
  const [resultadoCierre, setResultadoCierre] = useState(null);

  const cargar = useCallback(() => {
    getCajaActual().then(setCaja).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    cargar();
    const interval = setInterval(cargar, 10000);
    return () => clearInterval(interval);
  }, [cargar]);

  const abrir = async () => {
    setError('');
    if (!(Number(fondoInicial) >= 0)) return setError('El fondo inicial debe ser un número válido.');
    setSaving(true);
    try {
      const nueva = await abrirCaja(Number(fondoInicial));
      setCaja(nueva);
      setFondoInicial('');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const agregarMovimiento = async () => {
    setError('');
    if (!(Number(movimiento.amount) > 0) || !movimiento.concept.trim()) {
      return setError('Monto y concepto son obligatorios.');
    }
    setSaving(true);
    try {
      const actualizada = await registrarMovimientoCaja(movimiento.type, Number(movimiento.amount), movimiento.concept.trim());
      setCaja(actualizada);
      setMovimiento({ type: 'pay_in', amount: '', concept: '' });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const cerrar = async () => {
    setError('');
    if (!(Number(cierre.countedAmount) >= 0)) return setError('El monto contado debe ser un número válido.');
    setSaving(true);
    try {
      const cerrada = await cerrarCaja(Number(cierre.countedAmount), cierre.notes.trim() || undefined);
      setResultadoCierre(cerrada);
      setCierre({ abierto: false, countedAmount: '', notes: '' });
      cargar();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (caja === undefined) return <Box sx={{ p: 2 }}><Typography color="text.secondary">Cargando caja...</Typography></Box>;

  return (
    <Box sx={{ p: 2, height: '100%', overflowY: 'auto' }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {resultadoCierre && (
        <Alert severity={Number(resultadoCierre.difference) === 0 ? 'success' : 'warning'} sx={{ mb: 2 }} onClose={() => setResultadoCierre(null)}>
          Caja cerrada — esperado {money.format(Number(resultadoCierre.expectedAmount))}, contado {money.format(Number(resultadoCierre.countedAmount))},
          diferencia {money.format(Number(resultadoCierre.difference))}.
        </Alert>
      )}

      {!caja ? (
        <Card elevation={0} sx={{ background: 'rgba(36,26,32,0.05)', borderRadius: 3, p: 2.5, maxWidth: 380 }}>
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Abrir caja del turno</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            No hay una caja abierta en esta sucursal todavía.
          </Typography>
          <TextField
            fullWidth size="small" label="Fondo inicial" type="number"
            value={fondoInicial} onChange={(e) => setFondoInicial(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Button fullWidth variant="contained" sx={{ background: '#E765B7', color: '#241a20' }} onClick={abrir} disabled={saving}>
            {saving ? 'Abriendo...' : 'Abrir caja'}
          </Button>
        </Card>
      ) : (
        <>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, mb: 2 }}>
            <Card elevation={0} sx={{ background: 'rgba(36,26,32,0.05)', borderRadius: 3, p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Fondo inicial</Typography>
              <Typography sx={{ fontWeight: 700 }}>{money.format(Number(caja.openingAmount))}</Typography>
            </Card>
            <Card elevation={0} sx={{ background: 'rgba(36,26,32,0.05)', borderRadius: 3, p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Venta en efectivo</Typography>
              <Typography sx={{ fontWeight: 700 }}>{money.format(Number(caja.cashSales))}</Typography>
            </Card>
            <Card elevation={0} sx={{ background: 'rgba(36,26,32,0.05)', borderRadius: 3, p: 1.5 }}>
              <Typography variant="caption" color="text.secondary">Abierta desde</Typography>
              <Typography sx={{ fontWeight: 700 }}>{new Date(caja.openedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</Typography>
            </Card>
            <Card elevation={0} sx={{ background: '#E765B7', borderRadius: 3, p: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'rgba(36,26,32,.7)' }}>Efectivo teórico</Typography>
              <Typography sx={{ fontWeight: 800, color: '#241a20' }}>{money.format(Number(caja.esperado))}</Typography>
            </Card>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <Card elevation={0} sx={{ background: 'rgba(36,26,32,0.05)', borderRadius: 3, p: 2 }}>
              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Registrar entrada o salida</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Depósitos, retiros o gastos pagados en efectivo desde la caja. Las ventas con tarjeta o transferencia no se registran aquí — no afectan el efectivo físico.
              </Typography>
              <TextField
                select fullWidth size="small" label="Tipo" sx={{ mb: 1.5 }}
                value={movimiento.type} onChange={(e) => setMovimiento({ ...movimiento, type: e.target.value })}
              >
                <MenuItem value="pay_in">Entrada (depósito)</MenuItem>
                <MenuItem value="pay_out">Salida (gasto / retiro)</MenuItem>
              </TextField>
              <TextField
                fullWidth size="small" label="Monto" type="number" sx={{ mb: 1.5 }}
                value={movimiento.amount} onChange={(e) => setMovimiento({ ...movimiento, amount: e.target.value })}
              />
              <TextField
                fullWidth size="small" label="Concepto" sx={{ mb: 1.5 }}
                value={movimiento.concept} onChange={(e) => setMovimiento({ ...movimiento, concept: e.target.value })}
              />
              <Button fullWidth variant="contained" sx={{ background: '#E765B7', color: '#241a20' }} onClick={agregarMovimiento} disabled={saving}>
                Registrar movimiento
              </Button>
            </Card>

            <Card elevation={0} sx={{ background: 'rgba(36,26,32,0.05)', borderRadius: 3, p: 2 }}>
              <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Movimientos de este turno</Typography>
              {caja.movements.length ? caja.movements.map((m) => (
                <Box key={m.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75, borderBottom: '1px dashed rgba(36,26,32,.15)' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{m.concept}</Typography>
                    <Typography variant="caption" color="text.secondary">{new Date(m.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}</Typography>
                  </Box>
                  <Typography sx={{ fontWeight: 700, color: m.type === 'pay_in' ? '#2E7D4F' : '#C62838' }}>
                    {m.type === 'pay_in' ? '+' : '-'}{money.format(Number(m.amount))}
                  </Typography>
                </Box>
              )) : <Typography variant="body2" color="text.secondary">Sin movimientos todavía.</Typography>}
            </Card>
          </Box>

          <Box sx={{ mt: 2 }}>
            {!cierre.abierto ? (
              <Button variant="outlined" color="error" onClick={() => setCierre({ ...cierre, abierto: true })}>Cerrar caja</Button>
            ) : (
              <Card elevation={0} sx={{ background: 'rgba(198,40,56,0.06)', borderRadius: 3, p: 2, maxWidth: 380 }}>
                <Typography sx={{ fontWeight: 700, mb: 1.5 }}>Cerrar caja</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Cuenta el efectivo físico y captura el total — se compara contra el esperado ({money.format(Number(caja.esperado))}).
                </Typography>
                <TextField
                  fullWidth size="small" label="Monto contado" type="number" sx={{ mb: 1.5 }}
                  value={cierre.countedAmount} onChange={(e) => setCierre({ ...cierre, countedAmount: e.target.value })}
                />
                <TextField
                  fullWidth size="small" label="Notas (opcional)" sx={{ mb: 1.5 }}
                  value={cierre.notes} onChange={(e) => setCierre({ ...cierre, notes: e.target.value })}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="outlined" onClick={() => setCierre({ abierto: false, countedAmount: '', notes: '' })} disabled={saving}>Cancelar</Button>
                  <Button variant="contained" color="error" onClick={cerrar} disabled={saving}>Confirmar cierre</Button>
                </Box>
              </Card>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default CajaPanel;
