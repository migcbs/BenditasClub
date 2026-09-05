import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerApi as defaultApi } from './customerApi';
import { useDocumentMeta } from '../shared/useDocumentMeta';
import './customer.css';

export const CUSTOMER_TOKEN_KEY = 'bc_customer_token';

// Sin correo saliente configurado: el restablecimiento real de contraseña
// lo hace el admin a mano desde Configuración, y el seguimiento pasa por
// WhatsApp — por eso el mensaje de éxito manda a estos números en vez de
// prometer un correo que nunca llegará. Mismos números que whatsappService.js.
const SUCURSAL_WHATSAPP = [
  { label: 'Xico', numero: '522283544463' },
  { label: 'Coatepec', numero: '522284032836' },
];

export default function CustomerAuth({ mode = 'login', api = defaultApi, storage = window.localStorage }) {
  const navigate = useNavigate();
  const isRegister = mode === 'register';
  useDocumentMeta({
    title: isRegister ? 'Crea tu cuenta | Benditas Club' : 'Entra a tu cuenta | Benditas Club',
    noindex: true,
  });
  const [form, setForm] = useState({ nombre: '', email: '', password: '', telefono: '', direccion: '', fechaNacimiento: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSent, setForgotSent] = useState(false);

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

  const submitForgot = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.solicitarRestablecimiento({ email: forgotEmail });
      setForgotSent(true);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  if (forgot) {
    return (
      <main className="customer-page">
        <section className="customer-card customer-auth-card">
          <span className="customer-kicker">Benditas Club</span>
          <h1>Recuperar contraseña</h1>
          {forgotSent ? (
            <>
              <p>Tu solicitud ya se envió al administrador. Para darle seguimiento, comunícate por WhatsApp con tu sucursal más cercana:</p>
              <div className="customer-form" style={{ gap: 8 }}>
                {SUCURSAL_WHATSAPP.map((s) => (
                  <a key={s.numero} className="customer-secondary-link" href={`https://wa.me/${s.numero}`} target="_blank" rel="noreferrer">
                    WhatsApp {s.label}
                  </a>
                ))}
              </div>
            </>
          ) : (
            <>
              <p>Escribe el correo de tu cuenta — le avisaremos al administrador para que te ayude a recuperarla.</p>
              {error ? <div className="customer-alert">{error}</div> : null}
              <form className="customer-form" onSubmit={submitForgot}>
                <label>
                  Correo
                  <input type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} autoComplete="email" required />
                </label>
                <button className="customer-primary" disabled={loading}>{loading ? 'Enviando...' : 'Enviar solicitud'}</button>
              </form>
            </>
          )}
          <button type="button" className="customer-secondary-link" onClick={() => { setForgot(false); setForgotSent(false); setError(''); }}>
            Volver a entrar
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="customer-page">
      <section className="customer-card customer-auth-card">
        <span className="customer-kicker">Benditas Club</span>
        <h1>{isRegister ? 'Crea tu cuenta' : 'Entra a tu cuenta'}</h1>
        <p>Consulta tus pedidos, guarda tus datos y prepara tu tarjeta de fidelidad.</p>

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
            <>
              <label>
                Dirección (opcional — puedes indicar otra al momento de pedir)
                <input value={form.direccion} onChange={update('direccion')} autoComplete="street-address" />
              </label>
              <label>
                Fecha de nacimiento (opcional — para tu regalo de cumpleaños)
                <input type="date" value={form.fechaNacimiento} onChange={update('fechaNacimiento')} autoComplete="bday" />
              </label>
            </>
          ) : null}
          <button className="customer-primary" disabled={loading}>{loading ? 'Entrando...' : isRegister ? 'Crear cuenta' : 'Entrar'}</button>
        </form>

        {!isRegister && (
          <button type="button" className="customer-secondary-link" onClick={() => setForgot(true)}>
            ¿Olvidaste tu contraseña?
          </button>
        )}

        <Link className="customer-secondary-link" to={isRegister ? '/login' : '/registro'}>
          {isRegister ? 'Ya tengo cuenta' : 'Crear cuenta nueva'}
        </Link>
      </section>
    </main>
  );
}
