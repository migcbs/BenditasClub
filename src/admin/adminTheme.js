import { createTheme } from '@mui/material/styles';

export const adminTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#e682a8', contrastText: '#171217' },
    secondary: { main: '#f6b43b', contrastText: '#171217' },
    background: { default: '#131113', paper: '#211c22' },
    text: { primary: '#f7f2f5', secondary: '#cbbfc7' },
    error: { main: '#ff6b78' },
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

