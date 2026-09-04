// src/components/pedido/components/TransferenciaPopup.jsx
// Se abre desde el paso de resumen cuando el cliente elige pagar por
// transferencia en vez de WhatsApp directo. Muestra el CLABE de la
// sucursal elegida (configurado por el admin), un botón para copiarlo, y
// deja claro que el pedido solo se acepta al mandar el comprobante.

import React, { useEffect, useState } from "react";
import { getBranchSettings } from "../services/pedidoServices";
import "../styles/transferencia.css";

const TransferenciaPopup = ({ sucursal, onClose, onEnviarComprobante }) => {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    let vivo = true;
    getBranchSettings(sucursal)
      .then((res) => { if (vivo) setDatos(res); })
      .catch(() => { if (vivo) setError("No se pudo cargar la información de la cuenta. Intenta de nuevo."); });
    return () => { vivo = false; };
  }, [sucursal]);

  const copiarClabe = async () => {
    if (!datos?.clabe) return;
    try {
      await navigator.clipboard.writeText(datos.clabe);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (_) {
      setError("No se pudo copiar automáticamente — cópialo manualmente.");
    }
  };

  return (
    <div className="transferencia-overlay" onClick={onClose}>
      <div className="transferencia-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="transferencia-cerrar" onClick={onClose} aria-label="Cerrar">×</button>

        <h3 className="transferencia-titulo">Pagar por transferencia</h3>

        {error && <p className="transferencia-error">{error}</p>}

        {!datos && !error && <p className="transferencia-cargando">Cargando datos de la cuenta...</p>}

        {datos && !datos.clabe && (
          <p className="transferencia-error">
            Esta sucursal todavía no tiene una cuenta configurada para transferencias. Elige "Enviar por WhatsApp" y pregunta ahí cómo pagar.
          </p>
        )}

        {datos?.clabe && (
          <>
            <div className="transferencia-datos">
              {datos.banco && <p><strong>Banco:</strong> {datos.banco}</p>}
              {datos.titular && <p><strong>Titular:</strong> {datos.titular}</p>}
              <label className="transferencia-clabe-label">CLABE interbancaria</label>
              <div className="transferencia-clabe-row">
                <span className="transferencia-clabe">{datos.clabe}</span>
                <button type="button" className="transferencia-copiar" onClick={copiarClabe}>
                  {copiado ? "¡Copiado!" : "Copiar"}
                </button>
              </div>
            </div>

            <p className="transferencia-aviso">
              Tu pedido solo se aceptará y se preparará hasta que mandes la captura o el comprobante
              de tu transferencia por WhatsApp.
            </p>

            <button type="button" className="btn-primary-form transferencia-btn-enviar" onClick={onEnviarComprobante}>
              Ya transferí, enviar comprobante por WhatsApp
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TransferenciaPopup;
