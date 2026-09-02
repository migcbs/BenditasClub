import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerApi as defaultApi } from './customerApi';
import './customer.css';

export const CUSTOMER_TOKEN_KEY = 'bc_customer_token';

export default function CustomerAuth({ mode = 'login', api = defaultApi, storage = window.localStorage }) {
  const navigate = useNavigate();
  const isRegister = mode === 'register';
  const [form, setForm] = useState({ nombre: '', email: '', password: '' });
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
      navigate('/perfil');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="customer-page">
      <section className="customer-card customer-auth-card">
        <span className="customer-kicker">Benditas Club</span>
        <h1>{isRegister ? 'Crea tu cuenta' : 'Entra a tu cuenta'}</h1>
        <p>Consulta tus pedidos, guarda tus datos y prepara tu tarjeta de fidelidad.</p>

        {error ? <div className="customer-alert">{error}</div> : null}

        <form className="customer-form" onSubmit={submit}>
          {isRegister ? (
            <label>
              Nombre
              <input value={form.nombre} onChange={update('nombre')} autoComplete="name" required />
            </label>
          ) : null}
          <label>
            Correo
            <input type="email" value={form.email} onChange={update('email')} autoComplete="email" required />
          </label>
          <label>
            Contraseña
            <input type="password" value={form.password} onChange={update('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} minLength={8} required />
          </label>
          <button className="customer-primary" disabled={loading}>{loading ? 'Entrando...' : isRegister ? 'Crear cuenta' : 'Entrar'}</button>
        </form>

        <Link className="customer-secondary-link" to={isRegister ? '/login' : '/registro'}>
          {isRegister ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
        </Link>
      </section>
    </main>
  );
}
