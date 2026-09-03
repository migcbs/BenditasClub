// src/components/pedido/components/CategoriaTabs.jsx
import React from "react";
import { Box, Chip } from "@mui/material";

// Recibe categorias como prop para permitir filtrado externo (ej. domicilio)
const CategoriaTabs = React.memo(({ categorias = [], categoriaActiva, setCategoriaActiva }) => {
  return (
    <Box sx={{ display: "flex", gap: 1, overflowX: "auto", pb: 1 }}>
      {categorias.map((cat) => (
        <Chip
          key={cat}
          label={cat}
          onClick={() => setCategoriaActiva(cat)}
          color={categoriaActiva === cat ? "primary" : "default"}
          variant={categoriaActiva === cat ? "filled" : "outlined"}
          sx={{ fontWeight: 600, flexShrink: 0 }}
        />
      ))}
    </Box>
  );
});

export default CategoriaTabs;
