// src/components/pedido/services/whatsappService.js

import { calcularSubtotal, calcularSubtotalItem } from "./pedidoServices";

const WHATSAPP_NUMEROS = {
  xico:     "522283544463",
  coatepec: "522284032836",
};

export const generarMensajeWhatsApp = (cliente = {}, carrito = [], ordenId = "0001", metodoPago = null) => {
  const {
    nombre      = "",
    telefono    = "",
    direccion   = "",
    comentarios = "",
    sucursal    = "",
    tipoPedido  = "",
    costoEnvio  = 0,
    envioExacto = false,
    elegibleDescuentoBienvenida = false,
  } = cliente;

  const total = calcularSubtotal(carrito);
  const descuentoBienvenida = elegibleDescuentoBienvenida ? Math.round(total * 0.10) : 0;

  let texto  = `🐣 *BENDITAS CLUB — Nuevo Pedido*\n`;
  texto     += `━━━━━━━━━━━━━━━━━━━\n`;
  texto     += `👤 *Cliente:* ${nombre}\n`;
  texto     += `📱 *Tel:* ${telefono}\n`;
  texto     += `🏪 *Sucursal:* ${sucursal.toUpperCase()}\n`;

  if (tipoPedido === "domicilio") {
    texto += `🛵 *Tipo:* A Domicilio\n`;
    texto += `📍 *Dirección:* ${direccion}\n`;
  } else {
    texto += `🏪 *Tipo:* Para Recoger\n`;
    texto += `🔖 *Orden #:* ${ordenId}\n`;
  }

  texto += `\n🍗 *Pedido:*\n`;
  texto += `━━━━━━━━━━━━━━━━━━━\n`;

  if (!carrito || carrito.length === 0) {
    texto += `_(sin productos)_\n`;
  } else {
    carrito.forEach((item, i) => {
      const subtotal = calcularSubtotalItem(item);
      texto += `${i + 1}. *${item.nombre}* x${item.cantidad || 1} — $${subtotal.toFixed(2)}\n`;

      if (item.configurables?.length > 0) {
        item.configurables.forEach((c) => {
          if (c.sabores?.length > 0) {
            texto += `   🌶 ${c.label || c.type || "Sabores"}: ${c.sabores.join(", ")}\n`;
          }
          if (c.opcion) {
            texto += `   ➤ ${c.label || c.type || "Opción"}: ${c.opcion}\n`;
          }
        });
      }

      if (item.opcionElegida) {
        texto += `   ➤ ${item.opcionElegida}\n`;
      }
    });
  }

  if (comentarios?.trim()) {
    texto += `\n💬 *Comentarios:*\n${comentarios.trim()}\n`;
  }

  texto += `\n━━━━━━━━━━━━━━━━━━━\n`;

  if (tipoPedido === "domicilio") {
    texto += `🍗 *Productos: $${total.toFixed(2)} MXN*\n`;
    if (descuentoBienvenida > 0) texto += `🎉 *10% de bienvenida: -$${descuentoBienvenida.toFixed(2)} MXN*\n`;
    texto += `🛵 *Envío${envioExacto ? "" : " estimado"}: $${Number(costoEnvio).toFixed(2)} MXN*\n`;
    texto += `💰 *Total${envioExacto ? "" : " estimado"}: $${(total - descuentoBienvenida + Number(costoEnvio)).toFixed(2)} MXN*\n`;
  } else {
    if (descuentoBienvenida > 0) texto += `🎉 *10% de bienvenida: -$${descuentoBienvenida.toFixed(2)} MXN*\n`;
    texto += `💰 *Total estimado: $${(total - descuentoBienvenida).toFixed(2)} MXN*\n`;
  }

  if (metodoPago === "transferencia") {
    texto += `🏦 *Pago: Transferencia* — adjunto la captura del comprobante en este chat.\n`;
  }

  const numeroWA = WHATSAPP_NUMEROS[sucursal.toLowerCase()];

  if (!numeroWA) {
    console.warn(`[WhatsApp] No hay número registrado para la sucursal: "${sucursal}"`);
    return null;
  }

  return `https://wa.me/${numeroWA}?text=${encodeURIComponent(texto)}`;
};

export const enviarPedidoWhatsApp = (cliente = {}, carrito = [], ordenId = "0001", metodoPago = null) => {
  const link = generarMensajeWhatsApp(cliente, carrito, ordenId, metodoPago);
  if (!link) {
    console.error("[WhatsApp] No se pudo generar el link — sucursal no reconocida.");
    return false;
  }
  window.open(link, "_blank");
  return true;
};