// src/shared/staffApi.js
// Helpers HTTP compartidos por las pantallas de staff (/pos y /cocina).
// Habla con el backend de las fases 1-3 (index.js), en local en el puerto 3001.
const API_BASE = 'http://localhost:3001';

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

export const resolveReception = (id, aceptar) =>
  fetch(`${API_BASE}/api/orders/${id}/recepcion`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ aceptar }),
  }).then(handle);

export const updateOrderEstado = (id, estado, metodoPago) =>
  fetch(`${API_BASE}/api/orders/${id}/estado`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ estado, metodoPago }),
  }).then(handle);

export const updateOrderCocina = (id, estadoCocina) =>
  fetch(`${API_BASE}/api/orders/${id}/cocina`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeader() },
    body: JSON.stringify({ estadoCocina }),
  }).then(handle);
