// src/components/pedido/components/PasoCliente.jsx

import React from "react";
import "../styles/cliente.css";

// Valores locales — sin depender del import de constants
const DOMICILIO = "domicilio";
const RECOGER   = "recoger";

const PasoCliente = ({ cliente = {}, errores = {}, handleChange, siguientePaso }) => {

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
          <input
            type="text"
            name="direccion"
            placeholder="Calle, número, colonia..."
            value={cliente.direccion || ""}
            onChange={handleChange}
            className={errores.direccion ? "input-error shake" : ""}
            autoComplete="street-address"
          />
          {errores.direccion && <span className="error">{errores.direccion}</span>}
        </div>
      )}

      {/* ── Comentarios ── */}
      <div className="form-group">
        <textarea
          name="comentarios"
          placeholder="Notas: sin cebolla, timbre descompuesto..."
          value={cliente.comentarios || ""}
          onChange={handleChange}
          rows={2}
        />
      </div>

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