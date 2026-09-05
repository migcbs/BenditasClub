import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { customerApi as defaultApi } from './customerApi';
import { CUSTOMER_TOKEN_KEY } from './CustomerAuth';
import { useDocumentMeta } from '../shared/useDocumentMeta';
import './customer.css';
import './LoginPopup.css';

const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const PASOS_COCINA = ['nueva', 'en_preparacion', 'lista', 'entregada'];
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

// Índice del paso actual en PASOS_COCINA para pintar la barra de
// seguimiento — -1 si aún ni siquiera lo aceptan (nada se enciende).
const pasoActualIndex = (order) => {
  if (order.estado === 'cancelado') return -1;
  if (order.origen === 'online' && !order.recibidoEn) return -1;
  return PASOS_COCINA.indexOf(order.estadoCocina);
};

export default function CustomerProfile({ api = defaultApi, storage = window.localStorage }) {
  useDocumentMeta({ title: 'Mi cuenta | Benditas Club', noindex: true });
  const navigate = useNavigate();
  const [token, setToken] = useState(() => storage.getItem(CUSTOMER_TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loyalty, setLoyalty] = useState(null);
  const [cupones, setCupones] = useState(null);
  const [canjeandoPuntos, setCanjeandoPuntos] = useState(false);
  const [form, setForm] = useState({ nombre: '', telefono: '' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [addresses, setAddresses] = useState([]);
  const [addressForm, setAddressForm] = useState({ etiqueta: '', calle: '', numero: '', colonia: '', referencias: '', codigoPostal: '', esPrincipal: false });
  const [savingAddress, setSavingAddress] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ passwordActual: '', passwordNueva: '', passwordConfirmar: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [tab, setTab] = useState('perfil');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoError, setFotoError] = useState('');
  const [mostrarCanje, setMostrarCanje] = useState(false);
  const [mostrarAjustes, setMostrarAjustes] = useState(false);

  const cargarDirecciones = () => api.addresses(token).then(setAddresses);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return undefined;
    }

    let live = true;
    Promise.all([api.profile(token), api.orders(token), api.loyalty(token), api.addresses(token), api.couponsPublicos()])
      .then(([profile, history, loyaltyStatus, addressList, cuponesList]) => {
        if (!live) return;
        setUser(profile.user);
        setForm({ nombre: profile.user.nombre || '', telefono: profile.user.telefono || '' });
        setOrders(history);
        setLoyalty(loyaltyStatus);
        setAddresses(addressList);
        setCupones(cuponesList);
      })
      .catch((requestError) => {
        if (!live) return;
        setError(requestError.message);
        storage.removeItem(CUSTOMER_TOKEN_KEY);
        setToken(null);
      });
    return () => { live = false; };
  }, [api, navigate, storage, token]);

  // Para que el cliente vea su pedido pasar de "en revisión" a "listo" sin
  // tener que recargar la página a mano — solo el historial, no todo el
  // perfil, para no repetir llamadas de más.
  useEffect(() => {
    if (!token) return undefined;
    const interval = setInterval(() => {
      api.orders(token).then(setOrders).catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [api, token]);

  const updateAddressForm = (field) => (event) => {
    const value = field === 'esPrincipal' ? event.target.checked : event.target.value;
    setAddressForm((current) => ({ ...current, [field]: value }));
  };

  const agregarDireccion = async (event) => {
    event.preventDefault();
    if (!addressForm.calle.trim() || !addressForm.numero.trim()) return;
    setSavingAddress(true);
    setError('');
    try {
      await api.createAddress(addressForm, token);
      setAddressForm({ etiqueta: '', calle: '', numero: '', colonia: '', referencias: '', codigoPostal: '', esPrincipal: false });
      await cargarDirecciones();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSavingAddress(false);
    }
  };

  const marcarPrincipal = async (id) => {
    try {
      await api.updateAddress(id, { esPrincipal: true }, token);
      await cargarDirecciones();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const eliminarDireccion = async (id) => {
    try {
      await api.deleteAddress(id, token);
      await cargarDirecciones();
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  const [reclamandoCumple, setReclamandoCumple] = useState(false);

  const reclamarCumpleanos = async () => {
    setReclamandoCumple(true);
    setError('');
    try {
      await api.reclamarCumpleanos(token);
      const actualizado = await api.loyalty(token);
      setLoyalty(actualizado);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setReclamandoCumple(false);
    }
  };

  const canjearPuntos = async (productId) => {
    setCanjeandoPuntos(true);
    setError('');
    try {
      await api.canjearPuntos(productId, token);
      const actualizado = await api.loyalty(token);
      setLoyalty(actualizado);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setCanjeandoPuntos(false);
    }
  };

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

  const subirFoto = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setSubiendoFoto(true);
    setFotoError('');
    try {
      const result = await api.uploadFoto(file, token);
      setUser(result.user);
    } catch (requestError) {
      setFotoError(requestError.message);
    } finally {
      setSubiendoFoto(false);
    }
  };

  const updatePasswordForm = (field) => (event) => {
    setPasswordForm((current) => ({ ...current, [field]: event.target.value }));
    setPasswordSuccess(false);
  };

  const cambiarPassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    if (passwordForm.passwordNueva !== passwordForm.passwordConfirmar) {
      return setPasswordError('La confirmación no coincide con la nueva contraseña.');
    }
    setSavingPassword(true);
    try {
      await api.changePassword({ passwordActual: passwordForm.passwordActual, passwordNueva: passwordForm.passwordNueva }, token);
      setPasswordForm({ passwordActual: '', passwordNueva: '', passwordConfirmar: '' });
      setPasswordSuccess(true);
    } catch (requestError) {
      setPasswordError(requestError.message);
    } finally {
      setSavingPassword(false);
    }
  };

  const logout = () => {
    storage.removeItem(CUSTOMER_TOKEN_KEY);
    navigate('/login');
  };

  if (!user && !error) return <main className="customer-page"><section className="customer-card">Cargando perfil...</section></main>;

  const puntosListos = loyalty?.pointsRedemptions?.some((r) => !r.redeemed);

  return (
    <main className="customer-page customer-profile-page">
      <section className="customer-profile-hero">
        <div className="customer-avatar-wrap">
          {user?.fotoUrl ? (
            <img src={user.fotoUrl} alt="" className="customer-avatar" />
          ) : (
            <div className="customer-avatar customer-avatar-placeholder" aria-hidden="true">{(user?.nombre || 'C').trim()[0]?.toUpperCase()}</div>
          )}
        </div>
        <div className="customer-profile-hero-text">
          <span className="customer-kicker">Mi cuenta</span>
          <h1>{user?.nombre || 'Cliente Benditas'}</h1>
          <p>{user?.email}</p>
        </div>
        <button type="button" className="customer-logout-btn" onClick={logout}>Cerrar sesión</button>
      </section>

      {error ? <div className="customer-alert">{error}</div> : null}

      <nav className="customer-tabs" aria-label="Secciones de mi cuenta">
        <button type="button" className={tab === 'perfil' ? 'is-active' : ''} onClick={() => setTab('perfil')}>Mi cuenta</button>
        <button type="button" className={tab === 'direcciones' ? 'is-active' : ''} onClick={() => setTab('direcciones')}>Direcciones</button>
        <button type="button" onClick={() => setMostrarAjustes(true)}>Ajustes</button>
      </nav>

      {tab === 'perfil' && (
        <>
          <section className="customer-grid">
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

            <article className="customer-card">
              <h2>Mis puntos</h2>
              {loyalty ? (
                <>
                  <p>Ganas el 2% del total de cada pedido pagado. Llevas <b>{loyalty.puntos.toFixed(2)}</b> puntos.</p>

                  {puntosListos && (
                    <div className="customer-reward-ready">
                      <p><b>¡Ya tienes un canje listo!</b> {loyalty.pointsRedemptions.find((r) => !r.redeemed).product?.nombre}</p>
                      <div className="customer-reward-code">{loyalty.pointsRedemptions.find((r) => !r.redeemed).code}</div>
                      <small>Muestra este código en sucursal para recogerlo.</small>
                    </div>
                  )}

                  <button type="button" className="customer-primary customer-canje-btn" onClick={() => setMostrarCanje(true)}>
                    Ver productos para canjear
                  </button>

                  {loyalty.pointsRedemptions?.some((r) => r.redeemed) && (
                    <details className="customer-reward-history">
                      <summary>Puntos canjeados ({loyalty.pointsRedemptions.filter((r) => r.redeemed).length})</summary>
                      {loyalty.pointsRedemptions.filter((r) => r.redeemed).map((r) => (
                        <p key={r.id}>{r.product?.nombre} · {Number(r.puntos).toFixed(2)} puntos · {new Date(r.redeemedAt).toLocaleDateString('es-MX')}</p>
                      ))}
                    </details>
                  )}
                </>
              ) : <small>Cargando tus puntos...</small>}
            </article>

            <article className="customer-card">
              <h2>Cuponera</h2>
              {cupones ? (
                cupones.length ? (
                  <ul className="customer-coupon-list">
                    {cupones.map((c) => (
                      <li key={c.codigo} className="customer-coupon-item">
                        <span className="customer-coupon-code">{c.codigo}</span>
                        <span className="customer-coupon-info">
                          <b>{c.tipo === 'discount_percent' ? `${c.valor}% de descuento` : `${money.format(c.valor)} de descuento`}</b>
                          {c.descripcion && <small>{c.descripcion}</small>}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : <p className="customer-empty">No hay cupones disponibles por ahora.</p>
              ) : <small>Cargando cupones...</small>}
              <p className="customer-coupon-hint">Escribe el código al final de tu pedido en línea, antes de enviarlo.</p>
            </article>

            {loyalty?.activeBirthdayReward && (() => {
              const hoy = new Date();
              const nacimiento = loyalty.fechaNacimiento ? new Date(loyalty.fechaNacimiento) : null;
              const esHoy = nacimiento && hoy.getUTCMonth() === nacimiento.getUTCMonth() && hoy.getUTCDate() === nacimiento.getUTCDate();
              const yaReclamado = loyalty.birthdayRedemptions?.some((r) => r.year === hoy.getUTCFullYear());
              const pendiente = loyalty.birthdayRedemptions?.find((r) => r.year === hoy.getUTCFullYear() && !r.redeemed);
              if (!esHoy && !pendiente) return null;
              return (
                <article className="customer-card">
                  <h2>🎂 Cumpleaños</h2>
                  {pendiente ? (
                    <div className="customer-reward-ready">
                      <p><b>¡Feliz cumpleaños!</b> {rewardDescription(pendiente.reward)}</p>
                      <div className="customer-reward-code">{pendiente.code}</div>
                      <small>Muestra este código en sucursal.</small>
                    </div>
                  ) : esHoy && !yaReclamado ? (
                    <>
                      <p>¡Hoy es tu cumpleaños! Tienes un regalo esperándote: <b>{rewardDescription(loyalty.activeBirthdayReward)}</b></p>
                      <button type="button" className="customer-primary" disabled={reclamandoCumple} onClick={reclamarCumpleanos}>
                        {reclamandoCumple ? 'Reclamando...' : 'Reclamar mi regalo'}
                      </button>
                    </>
                  ) : null}
                </article>
              );
            })()}
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
                  {order.estado !== 'cancelado' && (
                    <div className="customer-order-tracker">
                      {PASOS_COCINA.map((paso, i) => (
                        <div key={paso} className={`tracker-paso ${i <= pasoActualIndex(order) ? 'is-activo' : ''}`}>
                          <span className="tracker-punto" />
                          <small>{kitchenLabel[paso]}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </span>
                <strong>{money.format(order.total)}</strong>
              </article>
            )) : <p className="customer-empty">Todavía no hay pedidos conectados a esta cuenta.</p>}
          </section>
        </>
      )}

      {tab === 'direcciones' && (
        <section className="customer-card">
          <h2>Mis direcciones</h2>
          {addresses.length ? (
            <ul className="customer-address-list">
              {addresses.map((a) => (
                <li key={a.id} className="customer-address-item">
                  <span>
                    {a.etiqueta ? <b>{a.etiqueta}: </b> : null}
                    {a.direccion}
                    {a.esPrincipal ? <em> · Principal</em> : null}
                  </span>
                  <span className="customer-address-actions">
                    {!a.esPrincipal && (
                      <button type="button" className="customer-address-link" onClick={() => marcarPrincipal(a.id)}>Usar como principal</button>
                    )}
                    <button type="button" className="customer-address-link customer-address-danger" onClick={() => eliminarDireccion(a.id)}>Eliminar</button>
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="customer-empty">Todavía no tienes direcciones guardadas.</p>}

          <form className="customer-form customer-address-form" onSubmit={agregarDireccion}>
            <label>
              Etiqueta (opcional)
              <input value={addressForm.etiqueta} onChange={updateAddressForm('etiqueta')} placeholder="Casa, trabajo..." />
            </label>
            <label>
              Calle
              <input value={addressForm.calle} onChange={updateAddressForm('calle')} placeholder="Av. Hidalgo" required />
            </label>
            <label>
              Número
              <input value={addressForm.numero} onChange={updateAddressForm('numero')} placeholder="123" required />
            </label>
            <label>
              Colonia y referencias
              <input value={addressForm.colonia} onChange={updateAddressForm('colonia')} placeholder="Centro" />
            </label>
            <input value={addressForm.referencias} onChange={updateAddressForm('referencias')} placeholder="Referencias: entre calles, color de casa, portón..." />
            <label>
              Código postal
              <input value={addressForm.codigoPostal} onChange={updateAddressForm('codigoPostal')} placeholder="91240" inputMode="numeric" maxLength={5} />
            </label>
            <label className="customer-address-checkbox">
              <input type="checkbox" checked={addressForm.esPrincipal} onChange={updateAddressForm('esPrincipal')} />
              Usar como principal
            </label>
            <button className="customer-primary" disabled={savingAddress}>{savingAddress ? 'Agregando...' : 'Agregar dirección'}</button>
          </form>
        </section>
      )}

      {mostrarAjustes && (
        <div className="login-popup-overlay" role="dialog" aria-modal="true" aria-label="Ajustes de la cuenta" onClick={() => setMostrarAjustes(false)}>
          <div className="login-popup-card login-popup-card-wide" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="login-popup-close" onClick={() => setMostrarAjustes(false)} aria-label="Cerrar">×</button>
            <h2 className="login-popup-title">Ajustes</h2>

            <section className="customer-settings-block">
              <h3>Foto de perfil</h3>
              {fotoError ? <div className="customer-alert">{fotoError}</div> : null}
              <div className="customer-foto-row">
                {user?.fotoUrl ? (
                  <img src={user.fotoUrl} alt="" className="customer-avatar customer-avatar-lg" />
                ) : (
                  <div className="customer-avatar customer-avatar-lg customer-avatar-placeholder" aria-hidden="true">{(user?.nombre || 'C').trim()[0]?.toUpperCase()}</div>
                )}
                <label className="customer-ghost customer-foto-upload">
                  {subiendoFoto ? 'Subiendo...' : 'Cambiar foto'}
                  <input type="file" accept="image/*" hidden onChange={subirFoto} disabled={subiendoFoto} />
                </label>
              </div>
            </section>

            <section className="customer-settings-block">
              <h3>Datos de contacto</h3>
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
            </section>

            <section className="customer-settings-block">
              <h3>Cambiar contraseña</h3>
              {passwordError ? <div className="customer-alert">{passwordError}</div> : null}
              {passwordSuccess ? <p className="customer-empty">Tu contraseña se actualizó correctamente.</p> : null}
              <form className="customer-form" onSubmit={cambiarPassword}>
                <label>
                  Contraseña actual
                  <input type="password" value={passwordForm.passwordActual} onChange={updatePasswordForm('passwordActual')} autoComplete="current-password" required />
                </label>
                <label>
                  Nueva contraseña
                  <input type="password" value={passwordForm.passwordNueva} onChange={updatePasswordForm('passwordNueva')} autoComplete="new-password" minLength={8} required />
                </label>
                <label>
                  Confirmar nueva contraseña
                  <input type="password" value={passwordForm.passwordConfirmar} onChange={updatePasswordForm('passwordConfirmar')} autoComplete="new-password" minLength={8} required />
                </label>
                <button className="customer-primary" disabled={savingPassword}>{savingPassword ? 'Guardando...' : 'Cambiar contraseña'}</button>
              </form>
            </section>

            <section className="customer-settings-block">
              <h3>Sesión</h3>
              <p className="customer-empty">Cierra sesión en este dispositivo.</p>
              <button type="button" className="customer-logout-btn customer-logout-btn-block" onClick={logout}>Cerrar sesión</button>
            </section>
          </div>
        </div>
      )}

      {mostrarCanje && (
        <div className="login-popup-overlay" role="dialog" aria-modal="true" aria-label="Productos para canjear" onClick={() => setMostrarCanje(false)}>
          <div className="login-popup-card login-popup-card-wide" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="login-popup-close" onClick={() => setMostrarCanje(false)} aria-label="Cerrar">×</button>
            <h2 className="login-popup-title">Canjear puntos</h2>
            <p className="login-popup-sub">Llevas <b>{loyalty?.puntos.toFixed(2)}</b> puntos.</p>
            {loyalty?.productosCanjeables?.length ? (
              <div className="customer-points-catalog">
                {loyalty.productosCanjeables.map((p) => {
                  const alcanza = loyalty.puntos >= p.costoPuntos;
                  return (
                    <div key={p.id} className="customer-points-item">
                      <span>{p.nombre}<small>{p.costoPuntos} puntos</small></span>
                      <button
                        type="button"
                        className="customer-ghost"
                        disabled={!alcanza || canjeandoPuntos}
                        onClick={() => canjearPuntos(p.id)}
                      >
                        Canjear
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : <p className="customer-empty">Todavía no hay productos configurados para canje con puntos.</p>}
          </div>
        </div>
      )}
    </main>
  );
}
