// En build de producción (Vercel), sin REACT_APP_API_BASE configurado,
// usa rutas relativas ('') — funciona solo porque frontend y backend
// (api/index.js) se despliegan juntos en el mismo dominio. En desarrollo
// local, apunta al Express que corre aparte en el puerto 3001.
const API_BASE = process.env.REACT_APP_API_BASE ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

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
  createIngredient: (payload, token) => fetch(`${API_BASE}/api/admin/ingredients`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  updateIngredient: (id, payload, token) => fetch(`${API_BASE}/api/admin/ingredients/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  addStock: (payload, token) => fetch(`${API_BASE}/api/admin/inventory/adjustments`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  inventoryMovements: (branch, token) => fetch(`${API_BASE}/api/admin/inventory/movements?branch=${branch}`, { headers: auth(token) }).then(handle),
  products: () => fetch(`${API_BASE}/api/products`).then(handle),
  saveRecipe: (productId, payload, token) => fetch(`${API_BASE}/api/admin/recipes/${productId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  recipes: (token) => fetch(`${API_BASE}/api/admin/recipes`, { headers: auth(token) }).then(handle),
  suppliers: (token) => fetch(`${API_BASE}/api/admin/suppliers`, { headers: auth(token) }).then(handle),
  createSupplier: (payload, token) => fetch(`${API_BASE}/api/admin/suppliers`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  purchases: (branch, token) => fetch(`${API_BASE}/api/admin/purchases?branch=${branch}`, { headers: auth(token) }).then(handle),
  createPurchase: (payload, token) => fetch(`${API_BASE}/api/admin/purchases`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  receivePurchase: (id, payload, token) => fetch(`${API_BASE}/api/admin/purchases/${id}/receive`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  cashShifts: (branch, token) => fetch(`${API_BASE}/api/admin/cash-shifts?branch=${branch}`, { headers: auth(token) }).then(handle),
  closeCashShift: (id, payload, token) => fetch(`${API_BASE}/api/admin/cash-shifts/${id}/close`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  expenses: (branch, token) => fetch(`${API_BASE}/api/admin/expenses?branch=${branch}`, { headers: auth(token) }).then(handle),
  users: (token) => fetch(`${API_BASE}/api/admin/users`, { headers: auth(token) }).then(handle),
  createUser: (payload, token) => fetch(`${API_BASE}/api/admin/users`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  updateUser: (id, payload, token) => fetch(`${API_BASE}/api/admin/users/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  updateSupplier: (id, payload, token) => fetch(`${API_BASE}/api/admin/suppliers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  loyaltyRewards: (token) => fetch(`${API_BASE}/api/admin/loyalty/rewards`, { headers: auth(token) }).then(handle),
  createLoyaltyReward: (payload, token) => fetch(`${API_BASE}/api/admin/loyalty/rewards`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  updateLoyaltyReward: (id, payload, token) => fetch(`${API_BASE}/api/admin/loyalty/rewards/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  loyaltyRedemptions: (token) => fetch(`${API_BASE}/api/admin/loyalty/redemptions`, { headers: auth(token) }).then(handle),
  categories: (token) => fetch(`${API_BASE}/api/admin/categories`, { headers: auth(token) }).then(handle),
  createCategory: (payload, token) => fetch(`${API_BASE}/api/admin/categories`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  uploadImage: (file, token) => {
    const form = new FormData();
    form.append('file', file);
    return fetch(`${API_BASE}/api/admin/upload`, { method: 'POST', headers: auth(token), body: form }).then(handle);
  },
  merchProducts: (token) => fetch(`${API_BASE}/api/admin/merch/products`, { headers: auth(token) }).then(handle),
  merchOrders: (token) => fetch(`${API_BASE}/api/admin/merch/orders`, { headers: auth(token) }).then(handle),
  createProduct: (payload, token) => fetch(`${API_BASE}/api/admin/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  updateProduct: (id, payload, token) => fetch(`${API_BASE}/api/admin/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  createVariant: (productId, payload, token) => fetch(`${API_BASE}/api/admin/products/${productId}/variants`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  updateVariant: (id, payload, token) => fetch(`${API_BASE}/api/admin/variants/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  updateVariantStock: (id, payload, token) => fetch(`${API_BASE}/api/admin/variants/${id}/stock`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  branchSettings: (token) => fetch(`${API_BASE}/api/admin/branch-settings`, { headers: auth(token) }).then(handle),
  updateBranchSettings: (sucursal, payload, token) => fetch(`${API_BASE}/api/admin/branch-settings/${sucursal}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  passwordResetRequests: (token) => fetch(`${API_BASE}/api/admin/password-reset-requests`, { headers: auth(token) }).then(handle),
  resolvePasswordReset: (id, payload, token) => fetch(`${API_BASE}/api/admin/password-reset-requests/${id}/resolver`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  pointsRedemptions: (token) => fetch(`${API_BASE}/api/admin/loyalty/points-redemptions`, { headers: auth(token) }).then(handle),
  birthdayRewards: (token) => fetch(`${API_BASE}/api/admin/birthday-rewards`, { headers: auth(token) }).then(handle),
  createBirthdayReward: (payload, token) => fetch(`${API_BASE}/api/admin/birthday-rewards`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  updateBirthdayReward: (id, payload, token) => fetch(`${API_BASE}/api/admin/birthday-rewards/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify(payload) }).then(handle),
  birthdayRedemptions: (token) => fetch(`${API_BASE}/api/admin/birthday-redemptions`, { headers: auth(token) }).then(handle),
  pendingDeletions: (token) => fetch(`${API_BASE}/api/admin/orders/eliminaciones-pendientes`, { headers: auth(token) }).then(handle),
  resolveDeletion: (id, aprobar, token) => fetch(`${API_BASE}/api/admin/orders/${id}/eliminacion`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify({ aprobar }) }).then(handle),
  deleteOrder: (id, motivo, token) => fetch(`${API_BASE}/api/admin/orders/${id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json', ...auth(token) }, body: JSON.stringify({ motivo }) }).then(handle),
};
