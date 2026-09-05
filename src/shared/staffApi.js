// src/shared/staffApi.js
// Helpers HTTP compartidos por las pantallas de staff (/pos y /cocina).
// Habla con el backend de las fases 1-3 (index.js), en local en el puerto 3001.
// Ver src/admin/adminApi.js — mismo criterio: relativo en producción, localhost:3001 en dev.
const API_BASE = process.env.REACT_APP_API_BASE ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

export const authHeader = () => {
  const token = localStorage.getItem('bc_staff_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

async function handle(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'Error de servidor');
  return body;
}

export const staffLogin = (sucursal, pin) =>
  fetch(`${API_BASE}/api/auth/staff-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sucursal, pin }),
  }).then(handle);

export const getProducts = () =>
  fetch(`${API_BASE}/api/products`).then(handle);

export const createOrder = (payload) =>
  fetch(`${API_BASE}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify(payload),
  }).then(handle);

export const listOrders = (estado) =>
  fetch(`${API_BASE}/api/orders${estado ? `?estado=${estado}` : ''}`, {
    headers: authHeader(),
  }).then(handle);

export const listPendingReception = () =>
  fetch(`${API_BASE}/api/orders?pendientes=true`, {
    headers: authHeader(),
  }).then(handle);

export const resolveReception = (id, aceptar, motivo) =>
  fetch(`${API_BASE}/api/orders/${id}/recepcion`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ aceptar, motivo }),
  }).then(handle);

export const updateOrderEstado = (id, estado, metodoPago) =>
  fetch(`${API_BASE}/api/orders/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ estado, metodoPago }),
  }).then(handle);

export const solicitarEliminacion = (id, motivo) =>
  fetch(`${API_BASE}/api/orders/${id}/solicitar-eliminacion`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ motivo }),
  }).then(handle);

export const updateOrderCocina = (id, estadoCocina) =>
  fetch(`${API_BASE}/api/orders/${id}/cocina`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ estadoCocina }),
  }).then(handle);

// Caja — siempre la de la propia sucursal del mesero (el backend la resuelve
// por su token, no se manda sucursal ni shiftId desde aquí).
export const getCajaActual = () =>
  fetch(`${API_BASE}/api/caja/actual`, { headers: authHeader() }).then(handle);

export const abrirCaja = (openingAmount) =>
  fetch(`${API_BASE}/api/caja/abrir`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ openingAmount }),
  }).then(handle);

export const registrarMovimientoCaja = (type, amount, concept) =>
  fetch(`${API_BASE}/api/caja/movimientos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ type, amount, concept }),
  }).then(handle);

export const cerrarCaja = (countedAmount, notes) =>
  fetch(`${API_BASE}/api/caja/cerrar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ countedAmount, notes }),
  }).then(handle);
