// src/shared/StaffLogin.jsx
import React, { useState } from 'react';
import { Box, Card, MenuItem, TextField, Typography, IconButton, Alert } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Delete } from 'lucide-react';
import { glassSx } from './theme';

const SUCURSALES = [
  { value: 'xico', label: 'Xico' },
  { value: 'coatepec', label: 'Coatepec' },
];

const digitos = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

const StaffLogin = ({ onLogin, title = 'BenditasClub POS' }) => {
  const [sucursal, setSucursal] = useState('xico');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const presionarDigito = (d) => {
    if (pin.length >= 4) return;
    setPin((prev) => prev + d);
  };

  const borrar = () => setPin((prev) => prev.slice(0, -1));

  const handleSubmit = async () => {
    setError('');
    setEnviando(true);
    try {
      await onLogin(sucursal, pin);
    } catch (err) {
      setError(err.message);
      setPin('');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // Fondo con capas de degradado radial (efecto de profundidad/parallax
        // suave, sin depender de scroll ya que esta pantalla no hace scroll).
        background:
          'radial-gradient(circle at 20% 20%, rgba(230,130,168,0.25), transparent 55%), radial-gradient(circle at 80% 80%, rgba(246,180,59,0.18), transparent 55%), #131113',
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card
          elevation={0}
          sx={{ ...glassSx, width: 340, borderRadius: 6, p: 3.5, textAlign: 'center' }}
        >
          <Typography variant="h1" sx={{ fontSize: 22, mb: 2 }}>{title}</Typography>

          <TextField
            select
            fullWidth
            size="small"
            label="Sucursal"
            value={sucursal}
            onChange={(e) => setSucursal(e.target.value)}
            sx={{ mb: 3, textAlign: 'left' }}
          >
            {SUCURSALES.map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1.5, mb: 3 }}>
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: i < pin.length ? 1.15 : 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: i < pin.length ? '#e682a8' : 'rgba(255,255,255,0.18)',
                }}
              />
            ))}
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
            {digitos.map((d) => (
              <motion.div key={d} whileTap={{ scale: 0.9 }}>
                <Box
                  component="button"
                  type="button"
                  onClick={() => presionarDigito(d)}
                  sx={{
                    width: '100%',
                    py: 1.6,
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'text.primary',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 3,
                    cursor: 'pointer',
                  }}
                >
                  {d}
                </Box>
              </motion.div>
            ))}
            <motion.div whileTap={{ scale: 0.9 }}>
              <IconButton onClick={borrar} sx={{ width: '100%', height: '100%', borderRadius: 3 }}>
                <Delete size={18} />
              </IconButton>
            </motion.div>
            <motion.div whileTap={{ scale: 0.9 }}>
              <Box
                component="button"
                type="button"
                onClick={() => presionarDigito('0')}
                sx={{
                  width: '100%',
                  py: 1.6,
                  fontSize: 18,
                  fontWeight: 700,
                  color: 'text.primary',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  cursor: 'pointer',
                }}
              >
                0
              </Box>
            </motion.div>
            <motion.div whileTap={{ scale: 0.94 }}>
              <Box
                component="button"
                type="button"
                onClick={handleSubmit}
                disabled={pin.length !== 4 || enviando}
                sx={{
                  width: '100%',
                  height: '100%',
                  fontWeight: 800,
                  color: 'primary.contrastText',
                  background: 'linear-gradient(135deg, #e682a8, #f6b43b)',
                  border: 'none',
                  borderRadius: 3,
                  cursor: 'pointer',
                  opacity: pin.length !== 4 || enviando ? 0.5 : 1,
                }}
              >
                Entrar
              </Box>
            </motion.div>
          </Box>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert severity="error" sx={{ mt: 2, textAlign: 'left' }}>{error}</Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      </motion.div>
    </Box>
  );
};

export default StaffLogin;
