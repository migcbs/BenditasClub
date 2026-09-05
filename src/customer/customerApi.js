// Ver src/admin/adminApi.js — mismo criterio: relativo en producción, localhost:3001 en dev.
const API_BASE = process.env.REACT_APP_API_BASE ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

async function handle(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'No pudimos completar la solicitud');
  return body;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

export const customerApi = {
  login: (email, password) => fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handle),
  register: (payload) => fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle),
  solicitarRestablecimiento: (payload) => fetch(`${API_BASE}/api/auth/solicitar-restablecimiento`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(handle),
  profile: (token) => fetch(`${API_BASE}/api/customer/me`, { headers: auth(token) }).then(handle),
  updateProfile: (payload, token) => fetch(`${API_BASE}/api/customer/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload),
  }).then(handle),
  changePassword: (payload, token) => fetch(`${API_BASE}/api/customer/password`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload),
  }).then(handle),
  uploadFoto: (file, token) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API_BASE}/api/customer/foto`, { method: 'POST', headers: auth(token), body: form }).then(handle);
  },
  orders: (token) => fetch(`${API_BASE}/api/customer/orders`, { headers: auth(token) }).then(handle),
  // token es opcional: un invitado sin cuenta también puede crear un
  // pedido en línea (ver POST /api/customer/orders con optionalAuth).
  createOrder: (payload, token) => fetch(`${API_BASE}/api/customer/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? auth(token) : {}) },
    body: JSON.stringify(payload),
  }).then(handle),
  loyalty: (token) => fetch(`${API_BASE}/api/customer/loyalty`, { headers: auth(token) }).then(handle),
  deliveryFee: (sucursal, codigoPostal) => fetch(`${API_BASE}/api/delivery-zones/${sucursal}/${encodeURIComponent(codigoPostal)}`).then(handle),
  canjearPuntos: (productId, token) => fetch(`${API_BASE}/api/customer/points/canjear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify({ productId }),
  }).then(handle),
  reclamarCumpleanos: (token) => fetch(`${API_BASE}/api/customer/birthday/reclamar`, { method: 'POST', headers: auth(token) }).then(handle),
  addresses: (token) => fetch(`${API_BASE}/api/customer/addresses`, { headers: auth(token) }).then(handle),
  createAddress: (payload, token) => fetch(`${API_BASE}/api/customer/addresses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload),
  }).then(handle),
  updateAddress: (id, payload, token) => fetch(`${API_BASE}/api/customer/addresses/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload),
  }).then(handle),
  deleteAddress: (id, token) => fetch(`${API_BASE}/api/customer/addresses/${id}`, {
    method: 'DELETE',
    headers: auth(token),
  }).then(handle),
};
