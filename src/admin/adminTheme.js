// Paleta idéntica a src/shared/theme.js — ver DESIGN.md. Antes tenía su
// propio rosa/dorado inventados; ahora comparte el mismo token exacto
// (#E765B7, medido del manual de marca) para que Admin no se sienta como
// una app aparte del resto de la plataforma.
import { createTheme } from '@mui/material/styles';

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#E765B7', dark: '#C43D8F', contrastText: '#241A20' },
    secondary: { main: '#241A20', contrastText: '#fff8f0' },
    background: { default: '#fff8f0', paper: '#ffffff' },
    text: { primary: '#241a20', secondary: '#6e5c66' },
    error: { main: '#c62838' },
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
