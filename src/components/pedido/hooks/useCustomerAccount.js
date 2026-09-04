// src/components/pedido/hooks/useCustomerAccount.js
// Si el cliente tiene sesión iniciada, trae su nombre/teléfono y sus
// direcciones guardadas para precargar el paso 1 del pedido — así no
// tiene que volver a escribirlos cada vez. Invitados no llaman nada.

import { useEffect, useState } from "react";
import { customerApi } from "../../../customer/customerApi";
import { CUSTOMER_TOKEN_KEY } from "../../../customer/CustomerAuth";

export const useCustomerAccount = () => {
  const [cuenta, setCuenta] = useState(null);
  const [direcciones, setDirecciones] = useState([]);

  useEffect(() => {
    const token = window.localStorage.getItem(CUSTOMER_TOKEN_KEY);
    if (!token) return;

    let live = true;
    Promise.all([customerApi.profile(token), customerApi.addresses(token)])
      .then(([profile, addressList]) => {
        if (!live) return;
        setCuenta(profile.user);
        setDirecciones(addressList);
      })
      .catch(() => {
        // Sesión vencida/ inválida: se sigue como invitado, sin bloquear el pedido.
      });
    return () => { live = false; };
  }, []);

  return { cuenta, direcciones };
};
