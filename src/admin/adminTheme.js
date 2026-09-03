import { createTheme } from '@mui/material/styles';

export const adminTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#d1477f', contrastText: '#fff8f0' },
    secondary: { main: '#c98a1f', contrastText: '#fff8f0' },
    background: { default: '#fff8f0', paper: '#ffffff' },
    text: { primary: '#241a20', secondary: '#6e5c66' },
    error: { main: '#c62838' },
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
