// server/delivery.js
// Estimación de costo de envío por distancia real (geocodificación gratuita
// por CP + Haversine, ver server/geocoding.js) — el admin define tramos
// "hasta X km cuesta $Y" por sucursal (DeliveryZone) en vez de mapear cada
// código postal a mano. Nunca se confía en un costoEnvio que mande el
// cliente — esto es lo único que calcula el precio.
const prisma = require('../lib/prisma');
const { obtenerCoordenadasCP, haversineKm } = require('./geocoding');

// Coordenadas fijas del centro de cada sucursal — geocodificadas una vez
// contra el mismo CP que usan sus propias direcciones (91240 Xico, 91500
// Coatepec), para comparar manzanas con manzanas contra el CP del cliente.
const SUCURSAL_COORDS = {
  xico: { lat: 19.4121591, lon: -97.0004453 },
  coatepec: { lat: 19.4608954, lon: -96.9589986 },
};

async function calcularCostoEnvio(sucursal, codigoPostal) {
  const settings = await prisma.branchSettings.findUnique({ where: { sucursal } });
  const envioMinimo = settings?.envioMinimo ?? 35;
  const cp = codigoPostal?.trim();
  if (!cp) return { costoEnvio: envioMinimo, exacto: false, distanciaKm: null };

  const destino = await obtenerCoordenadasCP(cp);
  if (!destino) return { costoEnvio: envioMinimo, exacto: false, distanciaKm: null };

  const distanciaKm = Math.round(haversineKm(SUCURSAL_COORDS[sucursal], destino) * 10) / 10;

  const tramos = await prisma.deliveryZone.findMany({ where: { sucursal, activo: true }, orderBy: { distanciaMaxKm: 'asc' } });
  if (!tramos.length) return { costoEnvio: envioMinimo, exacto: false, distanciaKm };

  const tramo = tramos.find((t) => distanciaKm <= t.distanciaMaxKm);
  if (tramo) return { costoEnvio: tramo.costoEnvio, exacto: true, distanciaKm, etiqueta: tramo.etiqueta || null };

  // Más lejos que cualquier tramo configurado: se cobra el tramo más caro
  // como techo (más seguro para el negocio que caer al mínimo por no
  // tener el tramo exacto) y se marca como estimado para que el mesero
  // confirme con el motociclista.
  const masLejano = tramos[tramos.length - 1];
  return { costoEnvio: masLejano.costoEnvio, exacto: false, distanciaKm, etiqueta: masLejano.etiqueta || null, fueraDeTramos: true };
}

module.exports = { calcularCostoEnvio };
