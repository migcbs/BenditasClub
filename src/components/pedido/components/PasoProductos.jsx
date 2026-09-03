// src/components/pedido/components/PasoProductos.jsx
import React, { useState, useMemo } from "react";
import { Box, Grid, Typography, Button } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import CategoriaTabs  from "./CategoriaTabs";
import ProductoCard   from "./ProductoCard";
import CarritoItem    from "./CarritoItem";

import { categorias, obtenerProductosPorCategoria, calcularSubtotal, formatearMoneda } from "../services/pedidoServices";

// Categorías que NO se muestran en pedidos a domicilio
const CATEGORIAS_SOLO_LOCAL = ["Cerveza", "Preparados"];

const PasoProductos = ({
  cliente,
  carrito,
  agregarProducto,
  eliminarProducto,
  actualizarCantidad,
  siguientePaso,
  pasoAnterior,
}) => {
  const esDomicilio = cliente?.tipoPedido === "domicilio";

  // Filtrar categorías según tipo de pedido
  const categoriasVisibles = useMemo(
    () => esDomicilio
      ? categorias.filter(c => !CATEGORIAS_SOLO_LOCAL.includes(c))
      : categorias,
    [esDomicilio]
  );

  const [categoriaActiva, setCategoriaActiva] = useState("Alitas");
  const [toastVisible,    setToastVisible]    = useState(false);
  const [productoAgregado,setProductoAgregado]= useState("");

  // Si la categoría activa queda fuera por cambio de tipo, resetear a Alitas
  const categoriaFinal = categoriasVisibles.includes(categoriaActiva)
    ? categoriaActiva
    : "Alitas";

  const productos    = useMemo(() => obtenerProductosPorCategoria(categoriaFinal), [categoriaFinal]);
  const total        = useMemo(() => calcularSubtotal(carrito), [carrito]);
  const carritoVacio = carrito.length === 0;

  const handleAgregarProducto = (producto) => {
    agregarProducto(producto);
    setProductoAgregado(producto.nombre);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 1500);
  };

  return (
    <Box sx={{ display: "flex", flexDirection: { xs: "column", md: "row" }, gap: 2.5, position: "relative" }}>

      {/* ── Productos ── */}
      <Box sx={{ flex: 2, minWidth: 0 }}>
        <CategoriaTabs
          categorias={categoriasVisibles}
          categoriaActiva={categoriaFinal}
          setCategoriaActiva={setCategoriaActiva}
        />

        <Grid container spacing={1.5} sx={{ mt: 0.5, maxHeight: { md: 420 }, overflowY: { md: "auto" } }}>
          {productos.map((producto, idx) => (
            <Grid key={`${producto.nombre}-${idx}`} size={{ xs: 6, sm: 4 }}>
              <ProductoCard producto={producto} agregarProducto={handleAgregarProducto} />
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* ── Carrito ── */}
      <Box sx={{ flex: 1, minWidth: { md: 280 }, display: "flex", flexDirection: "column" }}>
        <Typography variant="h2" sx={{ fontSize: 18, mb: 1 }}>Tu pedido</Typography>

        <Box sx={{ maxHeight: { md: 320 }, overflowY: "auto" }}>
          {carrito.map(item => (
            <CarritoItem
              key={item.id}
              item={item}
              actualizarCantidad={actualizarCantidad}
              eliminarProducto={eliminarProducto}
            />
          ))}
          {carritoVacio && <Typography color="text.secondary">Agrega productos al carrito 😎</Typography>}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", fontWeight: 800, fontSize: 20, my: 1.5 }}>
          <span>Total</span>
          <span>{formatearMoneda(total)}</span>
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button onClick={pasoAnterior} fullWidth>Atrás</Button>
          <motion.div style={{ flex: 2 }} whileTap={{ scale: 0.97 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={siguientePaso}
              disabled={carritoVacio}
              sx={{ background: "linear-gradient(135deg, #d1477f, #c98a1f)", color: "#171217" }}
            >
              Continuar
            </Button>
          </motion.div>
        </Box>
      </Box>

      <AnimatePresence>
        {toastVisible && (
          <motion.div
            initial={{ opacity: 0.6, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)" }}
          >
            <Box sx={{ background: "#5fd88f", color: "#0d1f14", px: 2, py: 1, borderRadius: 3, fontWeight: 700 }}>
              ✓ {productoAgregado} agregado
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

    </Box>
  );
};

export default PasoProductos;
