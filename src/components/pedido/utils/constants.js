// src/components/pedido/utils/constants.js

export const PASOS_PEDIDO = {
  CLIENTE: 1,
  PRODUCTOS: 2,
  RESUMEN: 3,
};

export const TIPO_PEDIDO = {
  DOMICILIO: "domicilio",
  RECOGER:   "recoger",
};

export const SUCURSALES = {
  XICO:      "xico",
  COATEPEC:  "coatepec",
};

export const MENSAJES_ERROR = {
  NOMBRE_REQUERIDO:      "El nombre es obligatorio",
  TELEFONO_REQUERIDO:    "El teléfono es obligatorio",
  TELEFONO_INVALIDO:     "El teléfono debe tener 10 dígitos",
  SUCURSAL_REQUERIDA:    "Elige una sucursal",
  TIPO_PEDIDO_REQUERIDO: "Elige si es a domicilio o para recoger",
  DIRECCION_REQUERIDA:   "La dirección es obligatoria para pedidos a domicilio",
};

export const CONFIG_PEDIDO = {
  MONEDA:              "MXN",
  LOCALE:              "es-MX",
  COSTO_ENVIO_DEFAULT: 0,
};

export const WHATSAPP_NUMEROS = {
  [SUCURSALES.XICO]:     "522283544463",
  [SUCURSALES.COATEPEC]: "522284032836",
};