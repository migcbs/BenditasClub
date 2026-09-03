// src/components/pedido/components/ProductoCard.jsx

import React, { useState } from "react";
import { Box, Button, Typography } from "@mui/material";
import { motion } from "framer-motion";
import SelectorSabores from "./SelectorSabores";

// Productos que requieren configuración antes de agregar
const requiereSelector = (producto) => {
  const nombre = producto.nombre?.toLowerCase() || "";
  return (
    nombre.includes("alita") ||
    nombre.includes("boneless") ||
    nombre.includes("papas") ||
    nombre.includes("papa") ||
    nombre.includes("box") ||
    nombre.includes("burgy") ||
    nombre.includes("bonely") ||
    nombre.includes("doggy") ||
    nombre.includes("kids") ||
    // Bebidas con opciones (micheladas, agua de sabor, etc.)
    (producto.opciones && producto.opciones.length > 0)
  );
};

const ProductoCard = React.memo(({ producto, agregarProducto }) => {
  const [mostrarSelector, setMostrarSelector] = useState(false);

  const handleAgregar = () => {
    if (requiereSelector(producto)) {
      setMostrarSelector(true);
    } else {
      agregarProducto({ ...producto, id: producto.nombre });
    }
  };

  const handleConfirmarSabores = (configurables) => {
    // Construir ID único con todas las selecciones
    const keyParts = configurables.map(c =>
      c.sabores?.length > 0
        ? c.sabores.join("-")
        : c.opcion || ""
    ).filter(Boolean);

    const id = keyParts.length > 0
      ? `${producto.nombre}|${keyParts.join("|")}`
      : producto.nombre;

    // Para bebidas con opción simple, guardar también en opcionElegida
    const opcionSimple = configurables.length === 1 && configurables[0].opcion
      ? configurables[0].opcion
      : undefined;

    agregarProducto({
      ...producto,
      id,
      configurables: configurables.length > 0 ? configurables : undefined,
      opcionElegida: opcionSimple,
    });
    setMostrarSelector(false);
  };

  return (
    <>
      <motion.div whileHover={{ y: -3 }} whileTap={{ scale: 0.97 }}>
        <Box
          sx={{
            borderRadius: 3,
            border: "1px solid rgba(36,26,32,0.08)",
            background: "rgba(36,26,32,0.05)",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 0.75,
            height: "100%",
          }}
        >
          <Typography sx={{ fontWeight: 700 }}>{producto.nombre}</Typography>

          {producto.descripcion && (
            <Typography variant="body2" color="text.secondary">{producto.descripcion}</Typography>
          )}

          <Typography sx={{ color: "#c98a1f", fontWeight: 700 }}>${producto.precio}</Typography>

          <Button
            variant="outlined"
            size="small"
            onClick={handleAgregar}
            sx={{ mt: "auto", alignSelf: "flex-start" }}
          >
            + Agregar
          </Button>
        </Box>
      </motion.div>

      {mostrarSelector && (
        <SelectorSabores
          producto={producto}
          onConfirmar={handleConfirmarSabores}
          onCancelar={() => setMostrarSelector(false)}
        />
      )}
    </>
  );
});

export default ProductoCard;