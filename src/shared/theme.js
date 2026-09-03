// src/shared/theme.js
// Tema MUI compartido por TODAS las pantallas de staff (/pos, /cocina) y el
// popup de pedido del cliente — misma paleta de marca (ver DESIGN.md, tomada
// directamente del manual de marca) para que la plataforma completa se
// sienta como un solo producto, no como pantallas construidas por separado.
// El rosa exacto es #E765B7 (medido del manual) — nunca el rosa/dorado
// inventados que traía el código antes de esta pasada de diseño.
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#E765B7', dark: '#C43D8F', contrastText: '#241A20' },
    secondary: { main: '#241A20', contrastText: '#fff8f0' },
    background: { default: '#fff8f0', paper: '#ffffff' },
    text: { primary: '#241a20', secondary: '#6e5c66' },
    error: { main: '#c62838' },
    success: { main: '#2e7d4f' },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: '"Inter", "Roboto", system-ui, sans-serif',
    h1: { fontFamily: '"Titan One", cursive', fontWeight: 400, letterSpacing: '-0.01em' },
    h2: { fontFamily: '"Fredoka", "Inter", sans-serif', fontWeight: 700, letterSpacing: '-0.01em' },
    button: { fontWeight: 750, textTransform: 'none' },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { minHeight: 48, borderRadius: 999 },
        containedPrimary: { color: '#241A20', '&:hover': { backgroundColor: '#C43D8F' } },
      },
    },
    MuiCard: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});

// Panel de vidrio (glassmorfismo) reutilizable vía sx={glassSx}.
export const glassSx = {
  background: 'rgba(255, 255, 255, 0.72)',
  backdropFilter: 'blur(18px) saturate(160%)',
  WebkitBackdropFilter: 'blur(18px) saturate(160%)',
  border: '1px solid rgba(36, 26, 32, 0.08)',
};
