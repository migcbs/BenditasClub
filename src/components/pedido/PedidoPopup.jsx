// src/components/pedido/PedidoPopup.jsx
import React from "react";
import { ThemeProvider, Box, IconButton } from "@mui/material";
import { motion } from "framer-motion";
import { X } from "lucide-react";

import PasoCliente   from "./components/PasoCliente";
import PasoProductos from "./components/PasoProductos";
import PasoResumen   from "./components/PasoResumen";

import { usePedido } from "./hooks/usePedido";
import { theme, glassSx } from "../../shared/theme";

const PedidoPopup = ({ onClose }) => {
  const {
    paso, siguientePaso, pasoAnterior, resetPedido,
    cliente, errores, handleChange,
    carrito, agregarProducto, eliminarProducto, actualizarCantidad,
    total,
  } = usePedido();

  return (
    <ThemeProvider theme={theme}>
      <Box
        onClick={(e) => e.target === e.currentTarget && onClose()}
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 1300,
          display: "flex",
          alignItems: { xs: "flex-end", sm: "center" },
          justifyContent: "center",
          background: "rgba(10, 8, 10, 0.7)",
          backdropFilter: "blur(4px)",
        }}
      >
        <motion.div
          initial={{ opacity: 0.6, y: 40, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: "100%", maxWidth: 900 }}
        >
          <Box
            sx={{
              ...glassSx,
              position: "relative",
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              borderRadius: { xs: "24px 24px 0 0", sm: 6 },
              p: { xs: 2.5, sm: 4 },
              // Fondo con capas de degradado radial: sensación de profundidad
              // detrás del vidrio, sutil parallax visual sin depender de scroll.
              backgroundImage:
                "radial-gradient(circle at 15% 0%, rgba(230,130,168,0.18), transparent 45%), radial-gradient(circle at 100% 100%, rgba(246,180,59,0.12), transparent 45%)",
            }}
          >
            <IconButton
              onClick={onClose}
              aria-label="Cerrar"
              sx={{ position: "absolute", top: 12, right: 12 }}
            >
              <X size={20} />
            </IconButton>

            {paso === 1 && (
              <PasoCliente
                cliente={cliente}
                errores={errores}
                handleChange={handleChange}
                siguientePaso={siguientePaso}
              />
            )}

            {paso === 2 && (
              <PasoProductos
                cliente={cliente}
                carrito={carrito}
                agregarProducto={agregarProducto}
                eliminarProducto={eliminarProducto}
                actualizarCantidad={actualizarCantidad}
                siguientePaso={siguientePaso}
                pasoAnterior={pasoAnterior}
                total={total}
              />
            )}

            {paso === 3 && (
              <PasoResumen
                cliente={cliente}
                carrito={carrito}
                pasoAnterior={pasoAnterior}
                resetPedido={resetPedido}
                onClose={onClose}
              />
            )}
          </Box>
        </motion.div>
      </Box>
    </ThemeProvider>
  );
};

export default PedidoPopup;
