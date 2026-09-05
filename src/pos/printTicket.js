// src/pos/printTicket.js
// Genera una nota con formato de ticket térmico (80mm) e imprime usando el
// diálogo normal del navegador. La impresora Bluetooth se empareja a nivel
// de sistema operativo (como cualquier impresora) — una vez emparejada,
// el navegador no necesita saber que es Bluetooth, solo aparece como
// destino de impresión disponible.

const TIPO_LABEL = { mesa: 'Mesa', para_llevar: 'Para llevar', domicilio: 'Domicilio' };
const METODO_PAGO_LABEL = { efectivo: 'Efectivo', tarjeta: 'Tarjeta', transferencia: 'Transferencia' };

// Mismos datos que ya usa el sitio público (Ubicaciones.jsx / whatsappService.js).
const SUCURSAL_INFO = {
  xico: {
    nombre: 'Benditas Club Xico',
    direccion: 'Av. Hidalgo 212, Centro',
    ciudad: 'Xico, Veracruz',
    whatsapp: '2283544463',
  },
  coatepec: {
    nombre: 'Benditas Club Coatepec',
    direccion: 'Melchor Ocampo 14, Centro',
    ciudad: 'Coatepec, Veracruz',
    whatsapp: '2284032836',
  },
};

// Mismo porcentaje que otorga puntos de verdad al cerrar la venta — ver
// server/loyalty/loyalty-service.js awardPointsForOrder. Aquí es solo para
// mostrarlo en el papel, el saldo real siempre lo calcula el backend.
const TASA_PUNTOS = 0.02;

const escapeHtml = (str = '') =>
  String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function imprimirComanda(orden, opciones = {}) {
  const { meseroNombre, tpv = 'POS', balancePuntos = null } = opciones;
  const sucursal = SUCURSAL_INFO[orden.sucursal] || {};
  const fecha = new Date(orden.createdAt).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
  const folio = orden.id.slice(0, 6).toUpperCase();
  const tipoLabel = orden.tipo === 'mesa' ? `Mesa ${orden.mesa || '-'}` : (TIPO_LABEL[orden.tipo] || orden.tipo);
  const puntosGanados = (orden.total * TASA_PUNTOS).toFixed(2);

  const filasItems = orden.items.map((item) => `
    <div class="item">
      <div class="item-nombre">${item.cantidad}&times; ${escapeHtml(item.nombre)}${item.sabores?.length ? ` (${escapeHtml(item.sabores.join(', '))})` : ''}</div>
      <div class="item-linea"><span>${item.cantidad} x $${item.precio}</span><span>$${item.subtotal}</span></div>
    </div>
  `).join('');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Nota ${folio}</title>
<style>
  @page { size: 80mm auto; margin: 4mm; }
  * { box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; color: #000; width: 72mm; margin: 0 auto; font-size: 12px; }
  .centro { text-align: center; }
  .logo { width: 46px; height: 46px; border-radius: 50%; object-fit: cover; margin-bottom: 4px; }
  h1 { font-size: 16px; margin: 0 0 2px; letter-spacing: 1px; }
  .tagline { font-size: 10px; margin: 0 0 8px; }
  .sucursal-nombre { font-weight: bold; font-size: 12px; margin-top: 6px; }
  .direccion { font-size: 10px; line-height: 1.4; }
  .linea { border-top: 1px dashed #000; margin: 8px 0; }
  .bloque { font-size: 11px; line-height: 1.5; }
  .fila { display: flex; justify-content: space-between; font-size: 11px; margin: 2px 0; gap: 8px; }
  .fila span:last-child { text-align: right; }
  .item { margin: 6px 0; }
  .item-nombre { font-weight: bold; font-size: 11px; }
  .item-linea { display: flex; justify-content: space-between; font-size: 11px; }
  .total { font-size: 16px; font-weight: bold; display: flex; justify-content: space-between; margin-top: 6px; }
  .notas { border: 1px dashed #000; padding: 6px; margin-top: 10px; font-size: 11px; }
  .propina { text-align: center; font-size: 11px; font-weight: bold; margin-top: 10px; }
  .footer { text-align: center; font-size: 10px; margin-top: 16px; }
  .folio-final { display: flex; justify-content: space-between; font-size: 10px; margin-top: 10px; }
</style>
</head>
<body>
  <div class="centro">
    <img class="logo" src="${window.location.origin}/logo192.jpg" alt="" />
    <h1>BENDITAS CLUB</h1>
    <div class="tagline">EST. 2017 &middot; alitas n' more</div>
    <div class="sucursal-nombre">${escapeHtml(sucursal.nombre || orden.sucursal)}</div>
    <div class="direccion">
      ${escapeHtml(sucursal.direccion || '')}<br/>
      ${escapeHtml(sucursal.ciudad || '')}<br/>
      WhatsApp: ${escapeHtml(sucursal.whatsapp || '')}
    </div>
  </div>
  <div class="linea"></div>
  <div class="bloque">
    Empleado: ${escapeHtml(meseroNombre || 'Benditas Club')}<br/>
    TPV: ${escapeHtml(tpv)}
  </div>
  <div class="linea"></div>
  <div class="bloque">
    Cliente: ${escapeHtml(orden.clienteNombre || 'Público en general')}<br/>
    ${orden.direccion ? `${escapeHtml(orden.direccion)}<br/>` : ''}
    ${orden.clienteTelefono ? escapeHtml(orden.clienteTelefono) : ''}
  </div>
  <div class="linea"></div>
  ${filasItems}
  <div class="linea"></div>
  <div class="fila"><span>Puntos obtenidos</span><span>${puntosGanados}</span></div>
  ${balancePuntos != null ? `<div class="fila"><span>Balance de puntos</span><span>${Number(balancePuntos).toFixed(2)}</span></div>` : ''}
  <div class="linea"></div>
  <div class="total"><span>Total</span><span>$${orden.total}.00</span></div>
  <div class="fila"><span>${escapeHtml(METODO_PAGO_LABEL[orden.metodoPago] || 'Pendiente')}</span><span>$${orden.total}.00</span></div>
  ${orden.notas ? `<div class="notas"><b>Notas:</b><br/>${escapeHtml(orden.notas)}</div>` : ''}
  <div class="propina">PROPINA SUGERIDA 10%</div>
  <div class="footer">&iexcl;Gracias por su compra!<br/>S&iacute;guenos @benditasclub</div>
  <div class="folio-final"><span>${fecha}</span><span>#${folio}</span></div>
</body>
</html>`;

  const ventana = window.open('', '_blank', 'width=420,height=640');
  if (!ventana) {
    alert('No se pudo abrir la ventana de impresión — revisa que el navegador no esté bloqueando ventanas emergentes para este sitio.');
    return;
  }
  ventana.document.open();
  ventana.document.write(html);
  ventana.document.close();
  ventana.onload = () => {
    ventana.focus();
    ventana.print();
  };
}
