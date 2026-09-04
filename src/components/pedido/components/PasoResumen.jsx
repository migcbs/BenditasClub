// src/components/pedido/components/PasoResumen.jsx
// ✅ Total calculado con calcularSubtotal (fuente única)
// ✅ Sabores / configurables visibles en el resumen
// ✅ enviarPedidoWhatsApp recibe tipoPedido correctamente

import React, { useMemo, useState } from "react";
import { enviarPedidoWhatsApp } from "../services/whatsappService";
import { calcularSubtotal, calcularSubtotalItem, formatearMoneda, guardarPedidoEnCuenta } from "../services/pedidoServices";
import { TIPO_PEDIDO } from "../utils/constants";
import TransferenciaPopup from "./TransferenciaPopup";
import "../styles/resumen.css";

const PasoResumen = ({ cliente = {}, carrito = [], pasoAnterior, resetPedido, onClose, handleChange }) => {

  const total       = useMemo(() => calcularSubtotal(carrito), [carrito]);
  const carritoVacio = !carrito || carrito.length === 0;
  const [showTransferencia, setShowTransferencia] = useState(false);

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

      {/* ── Total ── */}
      <div className="resumen-total">
        <h3>Total: {formatearMoneda(total)}</h3>
        {cliente.tipoPedido === TIPO_PEDIDO.DOMICILIO && (
          <p className="resumen-envio-nota">+ costo de envío por confirmar</p>
        )}
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