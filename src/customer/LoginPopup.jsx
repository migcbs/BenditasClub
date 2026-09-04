import React, { useState } from 'react';
import { customerApi as defaultApi } from './customerApi';
import { CUSTOMER_TOKEN_KEY } from './CustomerAuth';
import './customer.css';
import './LoginPopup.css';

// Misma lógica que CustomerAuth.jsx, pero como popup en vez de ruta: el
// toggle login/registro es estado local (no <Link>) y al terminar se llama
// onSuccess() en vez de navigate('/perfil') — quien la use decide qué hacer
// (Navbar solo cierra el popup; localStorage ya quedó actualizado).
export default function LoginPopup({ onClose, onSuccess, api = defaultApi, storage = window.localStorage }) {
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '', direccion: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = isRegister
        ? await api.register(form)
        : await api.login(form.email, form.password);
      if (result.user.role !== 'cliente') throw new Error('Esta entrada es solo para clientes.');
      storage.setItem(CUSTOMER_TOKEN_KEY, result.token);
      onSuccess();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-popup-overlay" onClick={onClose}>
      <div className="login-popup-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="login-popup-close" onClick={onClose} aria-label="Cerrar">×</button>

        <span className="customer-kicker">Benditas Club</span>
        <h2 className="login-popup-title">{isRegister ? 'Crea tu cuenta' : 'Entra a tu cuenta'}</h2>
        <p className="login-popup-sub">Consulta tus pedidos, guarda tus datos y prepara tu tarjeta de fidelidad.</p>

        {error ? <div className="customer-alert">{error}</div> : null}

        <form className="customer-form" onSubmit={submit}>
          {isRegister ? (
            <>
              <label>
                Nombre
                <input value={form.nombre} onChange={update('nombre')} autoComplete="name" required />
              </label>
              <label>
                Teléfono (10 dígitos)
                <input type="tel" value={form.telefono} onChange={update('telefono')} autoComplete="tel" inputMode="numeric" required />
              </label>
            </>
          ) : null}
          <label>
            Correo
            <input type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
          </label>
          <label>
            Contraseña
            <input type="password" value={form.password} onChange={update('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required />
          </label>
          {isRegister ? (
            <label>
              Dirección (opcional — puedes indicar otra al momento de pedir)
              <input value={form.direccion} onChange={update('direccion')} autoComplete="street-address" />
            </label>
          ) : null}
          <button className="customer-primary" disabled={loading}>{loading ? 'Entrando...' : isRegister ? 'Crear cuenta' : 'Entrar'}</button>
        </form>

        <button type="button" className="login-popup-toggle" onClick={() => setIsRegister((r) => !r)}>
          {isRegister ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
        </button>
      </div>
    </div>
  );
}
