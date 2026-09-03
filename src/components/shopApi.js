// src/components/shopApi.js
// Cliente HTTP para el catálogo de merch (público) y el guardado en cuenta
// de un pedido de merch cuando el cliente tiene sesión iniciada.
const API_BASE = 'http://localhost:3001';

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
