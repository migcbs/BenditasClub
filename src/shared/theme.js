// src/shared/theme.js
// Tema MUI compartido por TODAS las pantallas de staff (/pos, /cocina) y el
// panel admin (src/admin/adminTheme.js) — misma paleta de marca (rosa/dorado
// sobre fondo oscuro) para que la plataforma completa se sienta como un solo
// producto, no como pantallas construidas por separado.
import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#e682a8', contrastText: '#171217' },
    secondary: { main: '#f6b43b', contrastText: '#171217' },
    background: { default: '#131113', paper: '#211c22' },
    text: { primary: '#f7f2f5', secondary: '#cbbfc7' },
    error: { main: '#ff6b78' },
    success: { main: '#5fd88f' },
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
  background: 'rgba(33, 28, 34, 0.72)',
  backdropFilter: 'blur(18px) saturate(160%)',
  WebkitBackdropFilter: 'blur(18px) saturate(160%)',
  border: '1px solid rgba(255,255,255,0.08)',
};
