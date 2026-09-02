const API_BASE = 'http://localhost:3001';

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
  profile: (token) => fetch(`${API_BASE}/api/customer/me`, { headers: auth(token) }).then(handle),
  updateProfile: (payload, token) => fetch(`${API_BASE}/api/customer/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth(token) },
    body: JSON.stringify(payload),
  }).then(handle),
  orders: (token) => fetch(`${API_BASE}/api/customer/orders`, { headers: auth(token) }).then(handle),
};
