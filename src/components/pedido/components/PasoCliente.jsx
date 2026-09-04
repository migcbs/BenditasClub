// src/components/pedido/components/PasoCliente.jsx

import React, { useState } from "react";
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

  const handleDireccionGuardada = (e) => {
    const valor = e.target.value;
    if (valor === OTRA_DIRECCION) {
      setModoManualOtra(true);
      handleChange({ target: { name: "direccion", value: "" } });
    } else {
      handleChange({ target: { name: "direccion", value: valor } });
    }
  };

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
                <option key={d.id} value={d.direccion}>
                  {d.etiqueta ? `${d.etiqueta}: ` : ""}{d.direccion}
                </option>
              ))}
              <option value={OTRA_DIRECCION}>Otra dirección...</option>
            </select>
          ) : (
            <>
              <input
                type="text"
                name="direccion"
                placeholder="Calle, número, colonia..."
                value={cliente.direccion || ""}
                onChange={handleChange}
                className={errores.direccion ? "input-error shake" : ""}
                autoComplete="street-address"
              />
              {direcciones.length > 0 && (
                <button type="button" className="btn-usar-guardada" onClick={() => setModoManualOtra(false)}>
                  Usar una dirección guardada
                </button>
              )}
            </>
          )}
          {errores.direccion && <span className="error">{errores.direccion}</span>}
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