// src/components/pedido/components/PasoResumen.jsx
// ✅ Total calculado con calcularSubtotal (fuente única)
// ✅ Sabores / configurables visibles en el resumen
// ✅ enviarPedidoWhatsApp recibe tipoPedido correctamente

import React, { useMemo } from "react";
import { enviarPedidoWhatsApp } from "../services/whatsappService";
import { calcularSubtotal, calcularSubtotalItem, formatearMoneda } from "../services/pedidoServices";
import { TIPO_PEDIDO } from "../utils/constants";
import "../styles/resumen.css";

const PasoResumen = ({ cliente = {}, carrito = [], pasoAnterior, resetPedido, onClose }) => {

  const total       = useMemo(() => calcularSubtotal(carrito), [carrito]);
  const carritoVacio = !carrito || carrito.length === 0;

  const confirmarPedido = () => {
    if (carritoVacio) return;

    const exito = enviarPedidoWhatsApp(cliente, carrito);

    if (exito) {
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

        {cliente.comentarios && (
          <p><strong>Comentarios:</strong> {cliente.comentarios}</p>
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

      {/* ── Acciones ── */}
      <div className="acciones">
        <button onClick={pasoAnterior}>Atrás</button>
        <button
          className="btn-primary"
          onClick={confirmarPedido}
          disabled={carritoVacio}
        >
          Enviar por WhatsApp
        </button>
      </div>

    </div>
  );
};

export default PasoResumen;