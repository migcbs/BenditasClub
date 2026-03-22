// src/components/pedido/hooks/useClienteForm.js

import { useState } from "react";
import { validarCliente } from "../utils/validators";

const initialState = {
  nombre:     "",
  telefono:   "",
  direccion:  "",
  comentarios:"",
  sucursal:   "",
  tipoPedido: "",   // "domicilio" | "recoger"
};

export const useClienteForm = () => {

  const [cliente, setCliente]   = useState(initialState);
  const [errores, setErrores]   = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;

    setCliente((prev) => ({ ...prev, [name]: value }));

    // Limpia el error del campo que acaba de cambiar
    if (errores[name]) {
      setErrores((prev) => ({ ...prev, [name]: undefined }));
    }

    // Si cambia el tipo de pedido a "recoger", limpia el error de dirección
    if (name === "tipoPedido" && value === "recoger") {
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