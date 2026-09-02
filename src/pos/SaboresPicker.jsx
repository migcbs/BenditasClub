// src/pos/SaboresPicker.jsx
import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Typography, Chip, Button, Box } from '@mui/material';

const SABORES_ALITAS_BONELESS = [
  'Ajo parmesano', 'Pimienta limón', 'Queso parmesano',
  'BBQ', 'Tamarindo', 'Miel & mostaza', 'Teriyaki',
  'Machas', 'Habanero', 'Búfalo', 'Mango habanero',
  'BBQ Habanero', 'Tamarindo habanero', 'Habanero parmesano',
  'Sriracha', 'Diabla', 'Piña chipotle', 'Valentina',
  'Pelón Pelo Rico', 'Takis Blue', "Cheetos Flamin' Hot",
  'Takis Fuego', 'Doritos Cheddar', 'Naturales',
];
const SABORES_PAPAS = ['Naturales', 'Ajo parmesano', 'Pimienta limón', 'Queso parmesano', 'Paprika'];

const saboresPara = (categoria) => (categoria === 'Papas' ? SABORES_PAPAS : SABORES_ALITAS_BONELESS);

const SaboresPicker = ({ producto, categoria, onConfirmar, onCancelar }) => {
  const [elegidos, setElegidos] = useState([]);
  const opciones = saboresPara(categoria);
  const max = producto.maxSabores || 1;

  const toggle = (sabor) => {
    setElegidos((prev) => {
      if (prev.includes(sabor)) return prev.filter((s) => s !== sabor);
      if (prev.length >= max) return prev;
      return [...prev, sabor];
    });
  };

  return (
    <Dialog open onClose={onCancelar} fullWidth maxWidth="xs">
      <DialogTitle>{producto.nombre}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Elige hasta {max} sabor{max !== 1 ? 'es' : ''} ({elegidos.length}/{max})
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {opciones.map((sabor) => (
            <Chip
              key={sabor}
              label={sabor}
              onClick={() => toggle(sabor)}
              color={elegidos.includes(sabor) ? 'primary' : 'default'}
              variant={elegidos.includes(sabor) ? 'filled' : 'outlined'}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancelar}>Cancelar</Button>
        <Button variant="contained" onClick={() => onConfirmar(elegidos)} disabled={elegidos.length === 0}>
          Agregar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SaboresPicker;
