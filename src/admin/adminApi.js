const API_BASE = 'http://localhost:3001';

async function handle(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'No pudimos completar la solicitud');
  return body;
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

export const adminApi = {
  login: (email, password) => fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  }).then(handle),
  session: (token) => fetch(`${API_BASE}/api/admin/session`, { headers: auth(token) }).then(handle),
  dashboard: (filters = {}, token) => {
    const query = new URLSearchParams(Object.entries(filters).filter(([, value]) => value));
    return fetch(`${API_BASE}/api/admin/dashboard?${query}`, { headers: auth(token) }).then(handle);
  },
  inventory: (branch, token) => fetch(`${API_BASE}/api/admin/inventory?branch=${branch}`, { headers: auth(token) }).then(handle),
  recipes: (token) => fetch(`${API_BASE}/api/admin/recipes`, { headers: auth(token) }).then(handle),
  suppliers: (token) => fetch(`${API_BASE}/api/admin/suppliers`, { headers: auth(token) }).then(handle),
  purchases: (branch, token) => fetch(`${API_BASE}/api/admin/purchases?branch=${branch}`, { headers: auth(token) }).then(handle),
  cashShifts: (branch, token) => fetch(`${API_BASE}/api/admin/cash-shifts?branch=${branch}`, { headers: auth(token) }).then(handle),
  expenses: (branch, token) => fetch(`${API_BASE}/api/admin/expenses?branch=${branch}`, { headers: auth(token) }).then(handle),
  users: (token) => fetch(`${API_BASE}/api/admin/users`, { headers: auth(token) }).then(handle),
};
