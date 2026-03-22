// src/components/pedido/utils/formatters.js

import { CONFIG_PEDIDO } from "./constants";

export const formatearMoneda = (cantidad) => {
  return new Intl.NumberFormat(CONFIG_PEDIDO.LOCALE, {
    style: "currency",
    currency: CONFIG_PEDIDO.MONEDA
  }).format(cantidad);
};

export const formatearTelefono = (telefono) => {
  // ejemplo básico para México
  const cleaned = telefono.replace(/\D/g, "");

  if (cleaned.length !== 10) return telefono;

  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
};

export const capitalizarTexto = (texto) => {
  if (!texto) return "";
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};