// src/shared/theme.js
// Tema MUI compartido por TODAS las pantallas de staff (/pos, /cocina) y el
// popup de pedido del cliente — misma paleta de marca (rosa/dorado sobre
// fondo claro, igual que el sitio) para que la plataforma completa se
// sienta como un solo producto, no como pantallas construidas por separado.
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#d1477f', contrastText: '#fff8f0' },
    secondary: { main: '#c98a1f', contrastText: '#fff8f0' },
    background: { default: '#fff8f0', paper: '#ffffff' },
    text: { primary: '#241a20', secondary: '#6e5c66' },
    error: { main: '#c62838' },
    success: { main: '#2e7d4f' },
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily: '"Inter", "Roboto", system-ui, sans-serif',
    h1: { fontWeight: 800, letterSpacing: '-0.035em' },
    h2: { fontWeight: 750, letterSpacing: '-0.025em' },
    button: { fontWeight: 750, textTransform: 'none' },
  },
  components: {
    MuiButton: { styleOverrides: { root: { minHeight: 48 } } },
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
