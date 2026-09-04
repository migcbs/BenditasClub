// src/components/shopApi.js
// Cliente HTTP para el catálogo de merch (público) y el guardado en cuenta
// de un pedido de merch cuando el cliente tiene sesión iniciada.
// Ver src/admin/adminApi.js — mismo criterio: relativo en producción, localhost:3001 en dev.
const API_BASE = process.env.REACT_APP_API_BASE ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3001');

async function handle(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || 'No pudimos completar la solicitud');
  return body;
}

export const shopApi = {
  products: () => fetch(`${API_BASE}/api/shop/products`).then(handle),
  createOrder: (payload, token) => fetch(`${API_BASE}/api/customer/shop-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  }).then(handle),
};
