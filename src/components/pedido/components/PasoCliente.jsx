// src/components/pedido/components/PasoCliente.jsx
import React from "react";
import { Box, TextField, Typography, Chip, Button } from "@mui/material";
import { motion } from "framer-motion";

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
    <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography variant="h1" sx={{ fontSize: 22 }}>Tu pedido</Typography>

      <TextField
        name="nombre"
        label="Tu nombre"
        value={cliente.nombre || ""}
        onChange={handleChange}
        error={Boolean(errores.nombre)}
        helperText={errores.nombre}
        autoComplete="name"
        fullWidth
      />

      <TextField
        type="tel"
        name="telefono"
        label="Teléfono (10 dígitos)"
        value={cliente.telefono || ""}
        onChange={handleChange}
        error={Boolean(errores.telefono)}
        helperText={errores.telefono}
        slotProps={{ htmlInput: { maxLength: 10 } }}
        autoComplete="tel"
        fullWidth
      />

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>¿A qué sucursal pides?</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label="📍 Xico"
            onClick={() => handleSucursal("xico")}
            color={cliente.sucursal === "xico" ? "primary" : "default"}
            variant={cliente.sucursal === "xico" ? "filled" : "outlined"}
            sx={{ fontWeight: 600, px: 1 }}
          />
          <Chip
            label="📍 Coatepec"
            onClick={() => handleSucursal("coatepec")}
            color={cliente.sucursal === "coatepec" ? "primary" : "default"}
            variant={cliente.sucursal === "coatepec" ? "filled" : "outlined"}
            sx={{ fontWeight: 600, px: 1 }}
          />
        </Box>
        {errores.sucursal && <Typography variant="caption" color="error">{errores.sucursal}</Typography>}
      </Box>

      <Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>¿Cómo lo quieres?</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label="🛵 A domicilio"
            onClick={() => handleTipoPedido(DOMICILIO)}
            color={cliente.tipoPedido === DOMICILIO ? "primary" : "default"}
            variant={cliente.tipoPedido === DOMICILIO ? "filled" : "outlined"}
            sx={{ fontWeight: 600, px: 1 }}
          />
          <Chip
            label="🏪 Para recoger"
            onClick={() => handleTipoPedido(RECOGER)}
            color={cliente.tipoPedido === RECOGER ? "primary" : "default"}
            variant={cliente.tipoPedido === RECOGER ? "filled" : "outlined"}
            sx={{ fontWeight: 600, px: 1 }}
          />
        </Box>
        {errores.tipoPedido && <Typography variant="caption" color="error">{errores.tipoPedido}</Typography>}
      </Box>

      {cliente.tipoPedido === DOMICILIO && (
        <motion.div initial={{ opacity: 0.6, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }}>
          <TextField
            name="direccion"
            label="Calle, número, colonia..."
            value={cliente.direccion || ""}
            onChange={handleChange}
            error={Boolean(errores.direccion)}
            helperText={errores.direccion}
            autoComplete="street-address"
            fullWidth
          />
        </motion.div>
      )}

      <TextField
        name="comentarios"
        label="Notas: sin cebolla, timbre descompuesto..."
        value={cliente.comentarios || ""}
        onChange={handleChange}
        multiline
        rows={2}
        fullWidth
      />

      <motion.div whileTap={{ scale: 0.97 }}>
        <Button
          type="submit"
          fullWidth
          size="large"
          variant="contained"
          disabled={!puedeAvanzar}
          sx={{ background: "linear-gradient(135deg, #d1477f, #c98a1f)", color: "#171217" }}
        >
          Ver menú
        </Button>
      </motion.div>
    </Box>
  );
};

export default PasoCliente;
