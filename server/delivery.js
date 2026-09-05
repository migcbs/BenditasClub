// server/delivery.js
// Estimación de costo de envío por radio de distancia, aproximado por
// código postal — sin geocodificación real ni API de mapas de paga (el
// admin conoce sus colonias mejor que cualquier API para dos pueblos
// chicos). Un CP con fila en DeliveryZone usa esa tarifa exacta; si no,
// se usa BranchSettings.envioMinimo como estimado. Nunca se confía en un
// costoEnvio que mande el cliente — esto es lo único que calcula el precio.
const prisma = require('../lib/prisma');

async function calcularCostoEnvio(sucursal, codigoPostal) {
  const cp = codigoPostal?.trim();
  if (cp) {
    const zona = await prisma.deliveryZone.findUnique({
      where: { sucursal_codigoPostal: { sucursal, codigoPostal: cp } },
    });
    if (zona && zona.activo) {
      return { costoEnvio: zona.costoEnvio, exacto: true, etiqueta: zona.etiqueta || null };
    }
  }
  const settings = await prisma.branchSettings.findUnique({ where: { sucursal } });
  return { costoEnvio: settings?.envioMinimo ?? 35, exacto: false, etiqueta: null };
}

module.exports = { calcularCostoEnvio };
