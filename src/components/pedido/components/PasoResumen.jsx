// src/components/pedido/components/PasoResumen.jsx
import React, { useMemo } from "react";
import { Box, Typography, Card, Button, Chip } from "@mui/material";
import { motion } from "framer-motion";
import { enviarPedidoWhatsApp } from "../services/whatsappService";
import { calcularSubtotal, calcularSubtotalItem, formatearMoneda } from "../services/pedidoServices";
import { TIPO_PEDIDO } from "../utils/constants";

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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h1" sx={{ fontSize: 22 }}>Confirmar pedido</Typography>

      <Card elevation={0} sx={{ background: "rgba(36,26,32,0.05)", borderRadius: 3, p: 2 }}>
        <Typography variant="h2" sx={{ fontSize: 15, mb: 1 }}>Cliente</Typography>
        <Typography variant="body2"><b>Nombre:</b> {cliente.nombre || "—"}</Typography>
        <Typography variant="body2"><b>Teléfono:</b> {cliente.telefono || "—"}</Typography>
        <Typography variant="body2"><b>Sucursal:</b> {cliente.sucursal?.toUpperCase() || "—"}</Typography>

        {cliente.tipoPedido === TIPO_PEDIDO.DOMICILIO ? (
          <>
            <Typography variant="body2"><b>Tipo:</b> 🛵 A domicilio</Typography>
            <Typography variant="body2"><b>Dirección:</b> {cliente.direccion || "—"}</Typography>
          </>
        ) : (
          <Typography variant="body2"><b>Tipo:</b> 🏪 Para recoger</Typography>
        )}

        {cliente.comentarios && (
          <Typography variant="body2"><b>Comentarios:</b> {cliente.comentarios}</Typography>
        )}
      </Card>

      <Card elevation={0} sx={{ background: "rgba(36,26,32,0.05)", borderRadius: 3, p: 2 }}>
        <Typography variant="h2" sx={{ fontSize: 15, mb: 1 }}>Productos</Typography>

        {carritoVacio ? (
          <Typography color="text.secondary">No se han agregado productos.</Typography>
        ) : (
          carrito.map((item, index) => {
            const subtotal = calcularSubtotalItem(item);
            const etiquetas = [
              ...(item.configurables || []).map((c) => {
                if (c.sabores?.length > 0) return `🌶 ${c.type ? `${c.type}: ` : ""}${c.sabores.join(", ")}`;
                if (c.opcion) return `➤ ${c.type ? `${c.type}: ` : ""}${c.opcion}`;
                return null;
              }).filter(Boolean),
              ...(item.opcionElegida ? [`➤ ${item.opcionElegida}`] : []),
            ];
            return (
              <Box key={item.id || index} sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", py: 1, borderBottom: "1px solid rgba(36,26,32,0.06)" }}>
                <Box>
                  <Typography sx={{ fontWeight: 600 }}>{item.cantidad || 1}× {item.nombre}</Typography>
                  {etiquetas.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.5 }}>
                      {etiquetas.map((texto, i) => <Chip key={i} label={texto} size="small" variant="outlined" />)}
                    </Box>
                  )}
                </Box>
                <Typography sx={{ fontWeight: 700, color: "#c98a1f" }}>{formatearMoneda(subtotal)}</Typography>
              </Box>
            );
          })
        )}
      </Card>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <Typography variant="h2" sx={{ fontSize: 20 }}>Total: {formatearMoneda(total)}</Typography>
        {cliente.tipoPedido === TIPO_PEDIDO.DOMICILIO && (
          <Typography variant="caption" color="text.secondary">+ costo de envío por confirmar</Typography>
        )}
      </Box>

      <Box sx={{ display: "flex", gap: 1 }}>
        <Button onClick={pasoAnterior} fullWidth>Atrás</Button>
        <motion.div style={{ flex: 2 }} whileTap={{ scale: 0.97 }}>
          <Button
            fullWidth
            variant="contained"
            onClick={confirmarPedido}
            disabled={carritoVacio}
            sx={{ background: "linear-gradient(135deg, #25D366, #128C7E)", color: "#fff" }}
          >
            Enviar por WhatsApp
          </Button>
        </motion.div>
      </Box>
    </Box>
  );
};

export default PasoResumen;
