import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerApi as defaultApi } from './customerApi';
import { CUSTOMER_TOKEN_KEY } from './CustomerAuth';
import './customer.css';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const kitchenLabel = {
  nueva: 'Recibido',
  en_preparacion: 'En cocina',
  lista: 'Listo',
  entregada: 'Entregado',
};

export default function CustomerProfile({ api = defaultApi, storage = window.localStorage }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => storage.getItem(CUSTOMER_TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ nombre: '', telefono: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return undefined;
    }

    let live = true;
    Promise.all([api.profile(token), api.orders(token)])
      .then(([profile, history]) => {
        if (!live) return;
        setUser(profile.user);
        setForm({ nombre: profile.user.nombre || '', telefono: profile.user.telefono || '' });
        setOrders(history);
      })
      .catch((requestError) => {
        if (!live) return;
        setError(requestError.message);
        storage.removeItem(CUSTOMER_TOKEN_KEY);
        setToken(null);
      });
    return () => { live = false; };
  }, [api, navigate, storage, token]);

  const stats = useMemo(() => ({
    total: orders.reduce((sum, order) => sum + Number(order.total || 0), 0),
    stamps: Math.min(8, orders.filter((order) => order.estado !== 'cancelado').length % 8),
  }), [orders]);

  const update = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const result = await api.updateProfile(form, token);
      setUser(result.user);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const logout = () => {
    storage.removeItem(CUSTOMER_TOKEN_KEY);
    navigate('/login');
  };

  if (!user && !error) return <main className="customer-page"><section className="customer-card">Cargando perfil...</section></main>;

  return (
    <main className="customer-page customer-profile-page">
      <section className="customer-profile-hero">
        <div>
          <span className="customer-kicker">Mi cuenta</span>
          <h1>{user?.nombre || 'Cliente Benditas'}</h1>
          <p>{user?.email}</p>
        </div>
        <button className="customer-ghost" onClick={logout}>Salir</button>
      </section>

      {error ? <div className="customer-alert">{error}</div> : null}

      <section className="customer-grid">
        <article className="customer-card">
          <h2>Datos de contacto</h2>
          <form className="customer-form" onSubmit={save}>
            <label>
              Nombre
              <input value={form.nombre} onChange={update('nombre')} required />
            </label>
            <label>
              Teléfono
              <input value={form.telefono} onChange={update('telefono')} inputMode="tel" />
            </label>
            <button className="customer-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar datos'}</button>
          </form>
        </article>

        <article className="customer-card customer-loyalty">
          <h2>Tarjeta de fidelidad</h2>
          <p>{stats.stamps}/8 compras registradas</p>
          <div className="customer-stamps" aria-label={`${stats.stamps} sellos de fidelidad`}>
            {Array.from({ length: 8 }, (_, index) => <span key={index} className={index < stats.stamps ? 'is-filled' : ''} />)}
          </div>
          <small>La recompensa se activará desde admin cuando conectemos promociones.</small>
        </article>
      </section>

      <section className="customer-card">
        <div className="customer-section-heading">
          <h2>Historial de pedidos</h2>
          <Link to="/#menu">Hacer pedido</Link>
        </div>
        {orders.length ? orders.map((order) => (
          <article className="customer-order" key={order.id}>
            <span>
              <b>#{order.id.slice(0, 6).toUpperCase()} · {kitchenLabel[order.estadoCocina] || order.estadoCocina}</b>
              <small>{new Date(order.createdAt).toLocaleString('es-MX')} · {order.sucursal} · {order.tipo}</small>
            </span>
            <strong>{money.format(order.total)}</strong>
          </article>
        )) : <p className="customer-empty">Todavía no hay pedidos conectados a esta cuenta.</p>}
      </section>
    </main>
  );
}
