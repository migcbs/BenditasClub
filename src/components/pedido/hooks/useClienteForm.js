// src/components/pedido/hooks/useClienteForm.js

import { useState } from "react";
import { validarCliente } from "../utils/validators";
import { componerDireccion } from "../services/pedidoServices";

const initialState = {
  nombre:     "",
  telefono:   "",
  direccion:  "",
  // Campos sueltos de la dirección manual — `direccion` se recompone solo
  // a partir de estos en cuanto cambia alguno (ver DIRECCION_FIELDS abajo).
  // Cuando el cliente elige una dirección guardada en vez de escribir una
  // nueva, PasoCliente pone `direccion`/`codigoPostal` directo y deja estos
  // vacíos — no hace falta desglosarla de vuelta.
  calle:       "",
  numero:      "",
  colonia:     "",
  referencias: "",
  codigoPostal:"",
  costoEnvio:  0,
  envioExacto: false,
  comentarios:"",
  sucursal:   "",
  tipoPedido: "",   // "domicilio" | "recoger"
};

const DIRECCION_FIELDS = ["calle", "numero", "colonia", "referencias", "codigoPostal"];

export const useClienteForm = () => {

  const [cliente, setCliente]   = useState(initialState);
  const [errores, setErrores]   = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setCliente((prev) => {
      const next = { ...prev, [name]: value };
      if (DIRECCION_FIELDS.includes(name)) {
        next.direccion = componerDireccion(next);
      }
      return next;
    });

    // Limpia el error del campo que acaba de cambiar
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: undefined }));
    }

    // Si cambia el tipo de pedido a "recoger", limpia el error de dirección
    if (name === "tipoPedido" && value === "recoger") {
      setErrores((prev) => ({ ...prev, direccion: undefined }));
    }

    // calle/numero/etc. recomponen `direccion` arriba — si ya queda con
    // contenido, también se limpia el error de dirección (validarCliente
    // valida el string compuesto, no los campos sueltos).
    if (DIRECCION_FIELDS.includes(name) && errores.direccion) {
      setErrores((prev) => ({ ...prev, direccion: undefined }));
    }
  };

  const validar = () => {
    const nuevosErrores = validarCliente(cliente);
    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const resetCliente = () => {
    setCliente(initialState);
    setErrores({});
  };

  return {
    cliente,
    errores,
    handleChange,
    validar,
    resetCliente,
    setCliente,
  };
};