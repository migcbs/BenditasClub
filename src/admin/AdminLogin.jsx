import React, { useState } from 'react';
import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material';

// Mismo isotipo que la pestaña del navegador y la navbar del sitio público
// (antes era el lockup ancho de src/assets/logo.png, inconsistente con el
// resto del sitio).
const logo = `${process.env.PUBLIC_URL}/logo192.jpg`;

export default function AdminLogin({ onLogin, onDemo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try { await onLogin(email, password); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  };

  return (
    <main className="admin-login-page">
      <Box component="form" className="admin-login-panel" onSubmit={submit}>
        <img className="admin-login-logo" src={logo} alt="Benditas Club" />
        <Typography component="h1" variant="h4">Control del restaurante</Typography>
        <Typography color="text.secondary">Ventas, cocina, caja e inventario en un solo turno.</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        <TextField label="Correo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
        <TextField label="Contraseña" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required fullWidth />
        <Button type="submit" variant="contained" size="large" disabled={loading}>
          {loading ? <CircularProgress size={22} /> : 'Entrar al panel'}
        </Button>
        <Button type="button" variant="outlined" size="large" onClick={onDemo}>Explorar demo local</Button>
      </Box>
    </main>
  );
}
