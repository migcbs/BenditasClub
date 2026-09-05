// server/geocoding.js
// Geocodificación gratuita de códigos postales mexicanos vía Nominatim
// (OpenStreetMap) — sin API de mapas de paga. Cacheado para siempre en
// PostalCodeGeo: la política de uso de Nominatim pide no repetir consultas
// y máximo 1 request/seg, y un CP nunca cambia de coordenadas, así que
// cachear es tanto cortesía como la implementación correcta.
const prisma = require('../lib/prisma');

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
// Nominatim exige un User-Agent identificable — sin esto, algunas
// consultas se rechazan silenciosamente.
const USER_AGENT = 'BenditasClub/1.0 (pedidos.benditasclub@gmail.com)';

async function obtenerCoordenadasCP(codigoPostal) {
  const cp = codigoPostal?.trim();
  if (!cp) return null;

  const cacheado = await prisma.postalCodeGeo.findUnique({ where: { codigoPostal: cp } });
  if (cacheado) return { lat: cacheado.lat, lon: cacheado.lon };

  try {
    const url = `${NOMINATIM_URL}?postalcode=${encodeURIComponent(cp)}&country=Mexico&format=json&limit=1`;
    const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.length) return null;
    const lat = Number(data[0].lat);
    const lon = Number(data[0].lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) return null;
    await prisma.postalCodeGeo.upsert({
      where: { codigoPostal: cp },
      create: { codigoPostal: cp, lat, lon },
      update: { lat, lon },
    });
    return { lat, lon };
  } catch (error) {
    console.error('❌ Error geocodificando CP:', cp, error.message);
    return null;
  }
}

// Distancia en línea recta (no ruta real por calles) — suficiente para
// estimar una tarifa por tramos; una API de rutas de paga daría la
// distancia exacta manejada, pero no hay presupuesto para eso aquí.
function haversineKm(a, b) {
  const R = 6371;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.asin(Math.sqrt(h));
}

module.exports = { obtenerCoordenadasCP, haversineKm };
