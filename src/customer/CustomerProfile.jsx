import React, { useEffect, useState } from 'react';
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

// El estado de cocina por sí solo no basta: un pedido en línea puede seguir
// esperando revisión en Recepción (todavía no "recibido" de verdad), y uno
// cancelado no debe seguir mostrando su estadoCocina viejo.
const orderStatusLabel = (order) => {
  if (order.estado === 'cancelado') return 'Cancelado';
  if (order.origen === 'online' && !order.recibidoEn) return 'En revisión';
  return kitchenLabel[order.estadoCocina] || order.estadoCocina;
};

export default function CustomerProfile({ api = defaultApi, storage = window.localStorage }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => storage.getItem(CUSTOMER_TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [form, setForm] = useState({ nombre: '', telefono: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return undefined;
    }

    let live = true;
    Promise.all([api.profile(token), api.orders(token), api.loyalty(token)])
      .then(([profile, history, loyaltyStatus]) => {
        if (!live) return;
        setUser(profile.user);
        setForm({ nombre: profile.user.nombre || '', telefono: profile.user.telefono || '' });
        setOrders(history);
        setLoyalty(loyaltyStatus);
      })
      .catch((requestError) => {
        if (!live) return;
        setError(requestError.message);
        storage.removeItem(CUSTOMER_TOKEN_KEY);
        setToken(null);
      });
    return () => { live = false; };
  }, [api, navigate, storage, token]);

  const rewardDescription = (reward) => {
    if (!reward) return '';
    if (reward.type === 'discount_percent') return `${reward.value}% de descuento`;
    if (reward.type === 'discount_fixed') return `${money.format(reward.value)} de descuento`;
    if (reward.type === 'free_shipping') return 'Envío gratis';
    if (reward.type === 'free_item') return `${reward.product?.nombre || 'Producto'} gratis`;
    return reward.label;
  };

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
          {loyalty ? (
            loyalty.activeReward ? (
              <>
                <p>{loyalty.stamps}/{loyalty.stampsRequired} pedidos hacia: <b>{rewardDescription(loyalty.activeReward)}</b></p>
                <div className="customer-stamps" aria-label={`${loyalty.stamps} de ${loyalty.stampsRequired} sellos de fidelidad`}>
                  {Array.from({ length: loyalty.stampsRequired }, (_, index) => (
                    <span key={index} className={index < loyalty.stamps ? 'is-filled' : ''} />
                  ))}
                </div>

                {loyalty.redemptions.some((r) => !r.redeemed) ? (
                  <div className="customer-reward-ready">
                    <p><b>¡Tienes una recompensa lista!</b> {rewardDescription(loyalty.redemptions.find((r) => !r.redeemed).reward)}</p>
                    <div className="customer-reward-code">{loyalty.redemptions.find((r) => !r.redeemed).code}</div>
                    <small>Muestra este código al pagar en sucursal.</small>
                    <button
                      type="button"
                      className="customer-ghost customer-wallet-btn"
                      onClick={() => alert('Agregar a Apple Wallet estará disponible en cuanto configuremos el certificado Pass Type ID del restaurante con Apple.')}
                    >
                      Agregar a Apple Wallet
                    </button>
                  </div>
                ) : null}

                {loyalty.redemptions.some((r) => r.redeemed) && (
                  <details className="customer-reward-history">
                    <summary>Recompensas canjeadas ({loyalty.redemptions.filter((r) => r.redeemed).length})</summary>
                    {loyalty.redemptions.filter((r) => r.redeemed).map((r) => (
                      <p key={r.id}>{rewardDescription(r.reward)} · {new Date(r.redeemedAt).toLocaleDateString('es-MX')}</p>
                    ))}
                  </details>
                )}
              </>
            ) : (
              <small>Todavía no hay una recompensa activa configurada por el restaurante.</small>
            )
          ) : (
            <small>Cargando tu tarjeta...</small>
          )}
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
              <b>#{order.id.slice(0, 6).toUpperCase()} · {orderStatusLabel(order)}</b>
              <small>{new Date(order.createdAt).toLocaleString('es-MX')} · {order.sucursal} · {order.tipo}</small>
              {order.estado === 'cancelado' && order.motivoRechazo && (
                <small className="customer-order-reason">Motivo: {order.motivoRechazo}</small>
              )}
            </span>
            <strong>{money.format(order.total)}</strong>
          </article>
        )) : <p className="customer-empty">Todavía no hay pedidos conectados a esta cuenta.</p>}
      </section>
    </main>
  );
}
