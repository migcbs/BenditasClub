// src/components/pedido/components/PasoResumen.jsx
// ✅ Total calculado con calcularSubtotal (fuente única)
// ✅ Sabores / configurables visibles en el resumen
// ✅ enviarPedidoWhatsApp recibe tipoPedido correctamente

import React, { useMemo, useState } from "react";
import { enviarPedidoWhatsApp } from "../services/whatsappService";
import { calcularSubtotal, calcularSubtotalItem, calcularTotalConEnvio, formatearMoneda, guardarPedidoEnCuenta } from "../services/pedidoServices";
import { customerApi } from "../../../customer/customerApi";
import { TIPO_PEDIDO } from "../utils/constants";
import TransferenciaPopup from "./TransferenciaPopup";
import "../styles/resumen.css";

const PasoResumen = ({ cliente = {}, carrito = [], pasoAnterior, resetPedido, onClose, handleChange }) => {

  const total       = useMemo(() => calcularSubtotal(carrito), [carrito]);
  const carritoVacio = !carrito || carrito.length === 0;
  const [showTransferencia, setShowTransferencia] = useState(false);
  const [cuponInput, setCuponInput] = useState(cliente.cuponCodigo || "");
  const [aplicandoCupon, setAplicandoCupon] = useState(false);
  const [cuponError, setCuponError] = useState("");

  const esDomicilio = cliente.tipoPedido === TIPO_PEDIDO.DOMICILIO;
  const costoEnvio = esDomicilio ? (cliente.costoEnvio || 0) : 0;
  // Un cupón escrito a mano reemplaza al 10% de bienvenida en vez de
  // sumarse — mismo criterio que el servidor al crear el pedido de
  // verdad (ver index.js), esto es solo para que el cliente vea el
  // mismo total antes de mandar el WhatsApp.
  const descuentoBienvenida = !cliente.cuponAplicado && cliente.elegibleDescuentoBienvenida ? Math.round(total * 0.10) : 0;
  const descuentoCupon = cliente.cuponAplicado ? (cliente.descuentoCupon || 0) : 0;
  const totalConEnvio = useMemo(
    () => calcularTotalConEnvio(carrito, costoEnvio) - descuentoBienvenida - descuentoCupon,
    [carrito, costoEnvio, descuentoBienvenida, descuentoCupon]
  );

  const aplicarCupon = async () => {
    if (!cuponInput.trim()) return;
    setAplicandoCupon(true);
    setCuponError("");
    try {
      const resultado = await customerApi.validarCupon(cuponInput.trim(), total);
      if (!resultado.valido) {
        setCuponError(resultado.error || "Cupón no válido");
        handleChange({ target: { name: "cuponAplicado", value: false } });
        return;
      }
      handleChange({ target: { name: "cuponCodigo", value: cuponInput.trim().toUpperCase() } });
      handleChange({ target: { name: "descuentoCupon", value: resultado.descuento } });
      handleChange({ target: { name: "cuponAplicado", value: true } });
    } catch (error) {
      setCuponError("No se pudo validar el cupón — inténtalo de nuevo.");
    } finally {
      setAplicandoCupon(false);
    }
  };

  const quitarCupon = () => {
    setCuponInput("");
    setCuponError("");
    handleChange({ target: { name: "cuponAplicado", value: false } });
    handleChange({ target: { name: "cuponCodigo", value: "" } });
    handleChange({ target: { name: "descuentoCupon", value: 0 } });
  };

  const confirmarPedido = (metodoPago = null) => {
    if (carritoVacio) return;

    const exito = enviarPedidoWhatsApp(cliente, carrito, "0001", metodoPago);

    if (exito) {
      // Best effort: no bloquea ni retrasa el flujo de WhatsApp, que sigue
      // siendo el camino principal para todos los clientes (con o sin cuenta).
      guardarPedidoEnCuenta(cliente, carrito);
      setShowTransferencia(false);
      resetPedido?.();
      onClose?.();
    } else {
      alert("No se pudo abrir WhatsApp. Verifica que la sucursal esté seleccionada.");
    }
  };

  return (
    <div className="paso-resumen">

      <h2 className="titulo-seccion">Confirmar pedido</h2>

      {/* ── Datos del cliente ── */}
      <div className="resumen-seccion">
        <h3>Cliente</h3>
        <p><strong>Nombre:</strong> {cliente.nombre || "—"}</p>
        <p><strong>Teléfono:</strong> {cliente.telefono || "—"}</p>
        <p><strong>Sucursal:</strong> {cliente.sucursal?.toUpperCase() || "—"}</p>

        {cliente.tipoPedido === TIPO_PEDIDO.DOMICILIO ? (
          <>
            <p><strong>Tipo:</strong> 🛵 A domicilio</p>
            <p><strong>Dirección:</strong> {cliente.direccion || "—"}</p>
          </>
        ) : (
          <p><strong>Tipo:</strong> 🏪 Para recoger</p>
        )}
      </div>

      {/* ── Productos ── */}
      <div className="resumen-seccion">
        <h3>Productos</h3>

        {carritoVacio ? (
          <p>No se han agregado productos.</p>
        ) : (
          carrito.map((item, index) => {
            const subtotal = calcularSubtotalItem(item);
            return (
              <div key={item.id || index} className="resumen-item">
                <div className="resumen-item-info">
                  <span className="resumen-item-nombre">
                    {item.cantidad || 1}× {item.nombre}
                  </span>

                  {/* Sabores / configurables */}
                  {item.configurables?.map((c, i) => {
                    if (c.sabores?.length > 0) {
                      return (
                        <span key={i} className="resumen-sabor">
                          🌶 {c.type ? `${c.type}: ` : ""}{c.sabores.join(", ")}
                        </span>
                      );
                    }
                    if (c.opcion) {
                      return (
                        <span key={i} className="resumen-sabor">
                          ➤ {c.type ? `${c.type}: ` : ""}{c.opcion}
                        </span>
                      );
                    }
                    return null;
                  })}

                  {item.opcionElegida && (
                    <span className="resumen-sabor">➤ {item.opcionElegida}</span>
                  )}
                </div>

                <span className="resumen-item-precio">
                  {formatearMoneda(subtotal)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* ── Cupón (opcional) ── */}
      <div className="resumen-seccion resumen-cupon">
        <h3>¿Tienes un cupón?</h3>
        {cliente.cuponAplicado ? (
          <div className="cupon-aplicado">
            <span>🎟️ <b>{cliente.cuponCodigo}</b> aplicado — −{formatearMoneda(descuentoCupon)}</span>
            <button type="button" onClick={quitarCupon}>Quitar</button>
          </div>
        ) : (
          <div className="cupon-form">
            <input
              type="text"
              placeholder="Código de cupón (opcional)"
              value={cuponInput}
              onChange={(e) => { setCuponInput(e.target.value.toUpperCase()); setCuponError(""); }}
            />
            <button type="button" onClick={aplicarCupon} disabled={aplicandoCupon || !cuponInput.trim()}>
              {aplicandoCupon ? "..." : "Aplicar"}
            </button>
          </div>
        )}
        {cuponError && <span className="error">{cuponError}</span>}
      </div>

      {/* ── Total ── */}
      <div className="resumen-total">
        {esDomicilio && <p className="resumen-envio-nota">Productos: {formatearMoneda(total)}</p>}
        {descuentoBienvenida > 0 && (
          <p className="resumen-envio-nota resumen-descuento">🎉 10% de bienvenida: −{formatearMoneda(descuentoBienvenida)}</p>
        )}
        {descuentoCupon > 0 && (
          <p className="resumen-envio-nota resumen-descuento">🎟️ Cupón {cliente.cuponCodigo}: −{formatearMoneda(descuentoCupon)}</p>
        )}
        {esDomicilio && (
          <p className="resumen-envio-nota">
            🛵 Envío{cliente.envioExacto ? "" : " estimado"}: {formatearMoneda(costoEnvio)}
            {!cliente.envioExacto && " (se confirma al recibir tu pedido)"}
          </p>
        )}
        <h3>Total: {formatearMoneda(esDomicilio ? totalConEnvio : total - descuentoBienvenida - descuentoCupon)}</h3>
      </div>

      {/* ── Notas (se piden hasta el último paso, justo antes de enviar) ── */}
      <div className="form-group resumen-notas">
        <textarea
          name="comentarios"
          placeholder="Notas: sin cebolla, timbre descompuesto..."
          value={cliente.comentarios || ""}
          onChange={handleChange}
          rows={2}
        />
      </div>

      {/* ── Acciones ── */}
      <div className="acciones">
        <button onClick={pasoAnterior}>Atrás</button>
        <button
          className="btn-primary"
          onClick={() => confirmarPedido(null)}
          disabled={carritoVacio}
        >
          Enviar por WhatsApp
        </button>
      </div>

      <button
        type="button"
        className="btn-transferencia"
        onClick={() => setShowTransferencia(true)}
        disabled={carritoVacio || !cliente.sucursal}
      >
        🏦 Pagar por transferencia
      </button>

      {showTransferencia && (
        <TransferenciaPopup
          sucursal={cliente.sucursal}
          onClose={() => setShowTransferencia(false)}
          onEnviarComprobante={() => confirmarPedido("transferencia")}
        />
      )}

    </div>
  );
};

export default PasoResumen;