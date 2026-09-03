// src/components/pedido/components/CarritoItem.jsx
import React from "react";
import { Box, Typography, Chip, IconButton } from "@mui/material";
import { Minus, Plus, X } from "lucide-react";
import { calcularSubtotalItem } from "../services/pedidoServices";

const CarritoItem = React.memo(({ item, actualizarCantidad, eliminarProducto }) => {

  const handleDisminuir = () => {
    if (item.cantidad > 1) {
      actualizarCantidad(item.id, item.cantidad - 1);
    }
  };

  const handleAumentar  = () => actualizarCantidad(item.id, item.cantidad + 1);
  const handleEliminar  = () => eliminarProducto(item.id);

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
    <Box sx={{ background: "rgba(36,26,32,0.04)", borderRadius: 3, p: 1.75, mb: 1 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <Typography sx={{ fontWeight: 700 }}>{item.nombre}</Typography>
        <Typography sx={{ fontWeight: 700, color: "#c98a1f" }}>${subtotal.toFixed(2)}</Typography>
      </Box>

      {etiquetas.length > 0 && (
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
          {etiquetas.map((texto, i) => (
            <Chip key={i} label={texto} size="small" variant="outlined" />
          ))}
        </Box>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={handleDisminuir} aria-label="Disminuir"><Minus size={14} /></IconButton>
          <Typography sx={{ fontWeight: 700, minWidth: 16, textAlign: "center" }}>{item.cantidad}</Typography>
          <IconButton size="small" onClick={handleAumentar} aria-label="Aumentar"><Plus size={14} /></IconButton>
        </Box>
        <IconButton size="small" onClick={handleEliminar} aria-label="Eliminar producto"><X size={14} /></IconButton>
      </Box>
    </Box>
  );
});

export default CarritoItem;
