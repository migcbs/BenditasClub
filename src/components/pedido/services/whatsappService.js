// src/components/pedido/services/whatsappService.js
// ✅ Lógica domicilio vs. recoger correctamente separada
// ✅ Sabores de configurables incluidos en el mensaje
// ✅ Total calculado con calcularSubtotal (fuente única)

import { calcularSubtotal, calcularSubtotalItem } from "./pedidoServices";

// Números locales — sin depender del import de constants
const WHATSAPP_NUMEROS = {
  xico:      "522283544463",
  coatepec:  "522284032836",
};

/**
 * Genera el texto del mensaje de WhatsApp y devuelve el link wa.me listo.
 */
export const generarMensajeWhatsApp = (cliente = {}, carrito = [], ordenId = "0001") => {
  const {
    nombre      = "",
    telefono    = "",
    direccion   = "",
    comentarios = "",
    sucursal    = "",
    tipoPedido  = "",
  } = cliente;

  const total = calcularSubtotal(carrito);

  // ── Encabezado ──
  let texto = `🐣 *BENDITAS CLUB — Nuevo Pedido*\n`;
  texto    += `━━━━━━━━━━━━━━━━━━━\n`;
  texto    += `👤 *Cliente:* ${nombre}\n`;
  texto    += `📱 *Tel:* ${telefono}\n`;
  texto    += `🏪 *Sucursal:* ${sucursal.toUpperCase()}\n`;

  // ── Tipo de pedido ──
  if (tipoPedido === "domicilio") {
    texto += `🛵 *Tipo:* A Domicilio\n`;
    texto += `📍 *Dirección:* ${direccion}\n`;
  } else {
    texto += `🏪 *Tipo:* Para Recoger\n`;
    texto += `🔖 *Orden #:* ${ordenId}\n`;
  }

  // ── Productos ──
  texto += `\n🍗 *Pedido:*\n`;
  texto += `━━━━━━━━━━━━━━━━━━━\n`;

  if (!carrito || carrito.length === 0) {
    texto += `_(sin productos)_\n`;
  } else {
    carrito.forEach((item, i) => {
      const subtotal = calcularSubtotalItem(item);
      texto += `${i + 1}. *${item.nombre}* x${item.cantidad || 1} — $${subtotal.toFixed(2)}\n`;

      // Mostrar sabores / configurables si existen
      if (item.configurables && item.configurables.length > 0) {
        item.configurables.forEach((c) => {
          if (c.sabores && c.sabores.length > 0) {
            texto += `   🌶 ${c.type || "Sabores"}: ${c.sabores.join(", ")}\n`;
          }
          if (c.opcion) {
            texto += `   ➤ ${c.type || "Opción"}: ${c.opcion}\n`;
          }
        });
      }

      // Mostrar opción simple si existe (ej. bebidas con variante)
      if (item.opcionElegida) {
        texto += `   ➤ ${item.opcionElegida}\n`;
      }
    });
  }

  // ── Comentarios ──
  if (comentarios?.trim()) {
    texto += `\n💬 *Comentarios:*\n${comentarios.trim()}\n`;
  }

  // ── Total ──
  texto += `\n━━━━━━━━━━━━━━━━━━━\n`;
  texto += `💰 *Total estimado: $${total.toFixed(2)} MXN*\n`;

  if (tipoPedido === TIPO_PEDIDO.DOMICILIO) {
    texto += `_(más costo de envío por confirmar)_\n`;
  }

  // ── Número de WhatsApp según sucursal ──
  const numeroWA = WHATSAPP_NUMEROS[sucursal.toLowerCase()];

  if (!numeroWA) {
    console.warn(`[WhatsApp] No hay número registrado para la sucursal: "${sucursal}"`);
    return null;
  }

  return `https://wa.me/${numeroWA}?text=${encodeURIComponent(texto)}`;
};

/**
 * Abre WhatsApp directamente en una nueva pestaña.
 * Devuelve true si se abrió correctamente, false si falló.
 */
export const enviarPedidoWhatsApp = (cliente = {}, carrito = [], ordenId = "0001") => {
  const link = generarMensajeWhatsApp(cliente, carrito, ordenId);

  if (!link) {
    console.error("[WhatsApp] No se pudo generar el link — sucursal no reconocida.");
    return false;
  }

  window.open(link, "_blank");
  return true;
};