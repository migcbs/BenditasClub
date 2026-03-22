// src/components/pedido/utils/validators.js

import { MENSAJES_ERROR } from "./constants";

/**
 * Limpia un teléfono dejando solo dígitos.
 * Acepta: "228 123 4567", "228-123-4567", "2281234567"
 */
const limpiarTelefono = (tel = "") => tel.replace(/\D/g, "");

/**
 * Valida los datos del cliente.
 * La dirección solo es requerida si el tipo de pedido es "domicilio".
 */
export const validarCliente = (cliente) => {
  const errores = {};

  if (!cliente.nombre?.trim()) {
    errores.nombre = MENSAJES_ERROR.NOMBRE_REQUERIDO;
  }

  const telLimpio = limpiarTelefono(cliente.telefono);
  if (!telLimpio) {
    errores.telefono = MENSAJES_ERROR.TELEFONO_REQUERIDO;
  } else if (telLimpio.length !== 10) {
    errores.telefono = MENSAJES_ERROR.TELEFONO_INVALIDO;
  }

  if (!cliente.sucursal) {
    errores.sucursal = MENSAJES_ERROR.SUCURSAL_REQUERIDA;
  }

  if (!cliente.tipoPedido) {
    errores.tipoPedido = MENSAJES_ERROR.TIPO_PEDIDO_REQUERIDO;
  }

  if (!cliente.sucursal) {
    errores.sucursal = MENSAJES_ERROR.SUCURSAL_REQUERIDA;
  }

  if (!cliente.tipoPedido) {
    errores.tipoPedido = MENSAJES_ERROR.TIPO_PEDIDO_REQUERIDO;
  }

  // Dirección solo requerida para pedidos a domicilio
  if (cliente.tipoPedido === "domicilio" && !cliente.direccion?.trim()) {
    errores.direccion = MENSAJES_ERROR.DIRECCION_REQUERIDA;
  }

  return errores;
};

export const esCarritoValido = (carrito) => {
  return Array.isArray(carrito) && carrito.length > 0;
};