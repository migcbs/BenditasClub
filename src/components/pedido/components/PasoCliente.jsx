// src/components/pedido/components/PasoCliente.jsx

import React, { useEffect, useState } from "react";
import { getDeliveryFee, formatearMoneda } from "../services/pedidoServices";
import "../styles/cliente.css";

// Valores locales — sin depender del import de constants
const DOMICILIO = "domicilio";
const RECOGER   = "recoger";
const OTRA_DIRECCION = "__otra__";

const PasoCliente = ({ cliente = {}, errores = {}, handleChange, direcciones = [], siguientePaso }) => {
  // Las direcciones llegan de una llamada async (useCustomerAccount), así
  // que no pueden fijarse en el estado inicial — si no, con direcciones=[]
  // en el primer render se queda para siempre en modo "otra dirección"
  // aunque luego lleguen. Solo se guarda si el cliente pidió explícitamente
  // usar el campo libre; mostrar el selector es automático en cuanto hay
  // direcciones y el cliente no pidió lo contrario.
  const [modoManualOtra, setModoManualOtra] = useState(false);
  const mostrarSelectorGuardadas = direcciones.length > 0 && !modoManualOtra;
  const [envioError, setEnvioError] = useState("");
  const [buscandoEnvio, setBuscandoEnvio] = useState(false);

  const handleDireccionGuardada = (e) => {
    const idSeleccionado = e.target.value;
    if (idSeleccionado === OTRA_DIRECCION) {
      setModoManualOtra(true);
      handleChange({ target: { name: "direccion", value: "" } });
      handleChange({ target: { name: "codigoPostal", value: "" } });
    } else {
      const guardada = direcciones.find((d) => d.id === idSeleccionado);
      handleChange({ target: { name: "direccion", value: guardada?.direccion || "" } });
      handleChange({ target: { name: "codigoPostal", value: guardada?.codigoPostal || "" } });
    }
  };

  // Estimado por CP en cuanto hay 5 dígitos y ya se sabe la sucursal — sin
  // geocodificación real, ver server/delivery.js. Un CP de 4 dígitos
  // (todavía escribiéndose) no dispara la búsqueda.
  useEffect(() => {
    if (cliente.tipoPedido !== DOMICILIO || !cliente.sucursal || !/^\d{5}$/.test(cliente.codigoPostal || "")) {
      return undefined;
    }
    let vivo = true;
    setBuscandoEnvio(true);
    setEnvioError("");
    const timeout = setTimeout(() => {
      getDeliveryFee(cliente.sucursal, cliente.codigoPostal)
        .then((resultado) => {
          if (!vivo) return;
          handleChange({ target: { name: "costoEnvio", value: resultado.costoEnvio } });
          handleChange({ target: { name: "envioExacto", value: resultado.exacto } });
        })
        .catch(() => { if (vivo) setEnvioError("No se pudo estimar el envío — se confirma por WhatsApp."); })
        .finally(() => { if (vivo) setBuscandoEnvio(false); });
    }, 400);
    return () => { vivo = false; clearTimeout(timeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cliente.tipoPedido, cliente.sucursal, cliente.codigoPostal]);

  const handleSubmit = (e) => {
    e.preventDefault();
    siguientePaso();
  };

  const handleSucursal = (valor) => {
    handleChange({ target: { name: "sucursal", value: valor } });
  };

  const handleTipoPedido = (valor) => {
    handleChange({ target: { name: "tipoPedido", value: valor } });
  };

  const puedeAvanzar =
    cliente.nombre?.trim() &&
    cliente.telefono?.trim() &&
    cliente.sucursal &&
    cliente.tipoPedido &&
    (cliente.tipoPedido === RECOGER || cliente.direccion?.trim());

  return (
    <form className="paso-cliente" onSubmit={handleSubmit}>

      <h2 className="titulo-seccion">Tu pedido</h2>

      {/* ── Nombre ── */}
      <div className="form-group">
        <input
          type="text"
          name="nombre"
          placeholder="Tu nombre"
          value={cliente.nombre || ""}
          onChange={handleChange}
          className={errores.nombre ? "input-error shake" : ""}
          autoComplete="name"
        />
        {errores.nombre && <span className="error">{errores.nombre}</span>}
      </div>

      {/* ── Teléfono ── */}
      <div className="form-group">
        <input
          type="tel"
          name="telefono"
          placeholder="Teléfono (10 dígitos)"
          value={cliente.telefono || ""}
          onChange={handleChange}
          className={errores.telefono ? "input-error shake" : ""}
          maxLength={10}
          autoComplete="tel"
        />
        {errores.telefono && <span className="error">{errores.telefono}</span>}
      </div>

      {/* ── Sucursal ── */}
      <div className="form-group">
        <label>¿A qué sucursal pides?</label>
        <div className="sucursal-options">
          <button
            type="button"
            className={`btn-sucursal ${cliente.sucursal === "xico" ? "activo" : ""}`}
            onClick={() => handleSucursal("xico")}
          >
            📍 Xico
          </button>
          <button
            type="button"
            className={`btn-sucursal ${cliente.sucursal === "coatepec" ? "activo" : ""}`}
            onClick={() => handleSucursal("coatepec")}
          >
            📍 Coatepec
          </button>
        </div>
        {errores.sucursal && <span className="error">{errores.sucursal}</span>}
      </div>

      {/* ── Tipo de pedido ── */}
      <div className="form-group">
        <label>¿Cómo lo quieres?</label>
        <div className="sucursal-options">
          <button
            type="button"
            className={`btn-sucursal ${cliente.tipoPedido === DOMICILIO ? "activo" : ""}`}
            onClick={() => handleTipoPedido(DOMICILIO)}
          >
            🛵 A domicilio
          </button>
          <button
            type="button"
            className={`btn-sucursal ${cliente.tipoPedido === RECOGER ? "activo" : ""}`}
            onClick={() => handleTipoPedido(RECOGER)}
          >
            🏪 Para recoger
          </button>
        </div>
        {errores.tipoPedido && <span className="error">{errores.tipoPedido}</span>}
      </div>

      {/* ── Dirección (solo si es domicilio) ── */}
      {cliente.tipoPedido === DOMICILIO && (
        <div className="form-group direccion-animada">
          {mostrarSelectorGuardadas ? (
            <select
              onChange={handleDireccionGuardada}
              defaultValue=""
              className={errores.direccion ? "input-error shake" : ""}
            >
              <option value="" disabled>Elige una dirección guardada</option>
              {direcciones.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.etiqueta ? `${d.etiqueta}: ` : ""}{d.direccion}
                </option>
              ))}
              <option value={OTRA_DIRECCION}>Otra dirección...</option>
            </select>
          ) : (
            <>
              <div className="direccion-campos">
                <input
                  type="text"
                  name="calle"
                  placeholder="Calle"
                  value={cliente.calle || ""}
                  onChange={handleChange}
                  className={errores.direccion ? "input-error shake" : ""}
                  autoComplete="address-line1"
                />
                <input
                  type="text"
                  name="numero"
                  placeholder="Número"
                  value={cliente.numero || ""}
                  onChange={handleChange}
                  className={errores.direccion ? "input-error shake" : ""}
                />
                <input
                  type="text"
                  name="colonia"
                  placeholder="Colonia y referencias"
                  value={cliente.colonia || ""}
                  onChange={handleChange}
                  autoComplete="address-line2"
                />
                <input
                  type="text"
                  name="referencias"
                  placeholder="Referencias: entre calles, portón, color de casa..."
                  value={cliente.referencias || ""}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  name="codigoPostal"
                  placeholder="Código postal"
                  value={cliente.codigoPostal || ""}
                  onChange={handleChange}
                  inputMode="numeric"
                  maxLength={5}
                />
              </div>
              {direcciones.length > 0 && (
                <button type="button" className="btn-usar-guardada" onClick={() => setModoManualOtra(false)}>
                  Usar una dirección guardada
                </button>
              )}
            </>
          )}
          {errores.direccion && <span className="error">{errores.direccion}</span>}

          {cliente.codigoPostal && (
            <p className="envio-estimado">
              {buscandoEnvio ? "Calculando envío..." : envioError ? envioError : (
                <>
                  🛵 Envío {cliente.envioExacto ? "" : "estimado "}: <strong>{formatearMoneda(cliente.costoEnvio || 0)}</strong>
                  {!cliente.envioExacto && " (se confirma al recibir tu pedido)"}
                </>
              )}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        className="btn-primary-form"
        disabled={!puedeAvanzar}
      >
        Ver menú
      </button>

    </form>
  );
};

export default PasoCliente;