// src/pos/ProductGrid.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Chip, Alert, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { getProducts } from '../shared/staffApi';
import SaboresPicker from './SaboresPicker';

const ProductGrid = ({ onAgregar }) => {
  const [productos, setProductos] = useState([]);
  const [categoriaActiva, setCategoriaActiva] = useState(null);
  const [productoConSabores, setProductoConSabores] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getProducts()
      .then((data) => {
        setProductos(data);
        if (data.length > 0) setCategoriaActiva(data[0].category.nombre);
      })
      .catch((e) => setError(e.message));
  }, []);

  const categorias = useMemo(
    () => [...new Set(productos.map((p) => p.category.nombre))],
    [productos]
  );

  const productosVisibles = useMemo(
    () => productos.filter((p) => p.category.nombre === categoriaActiva),
    [productos, categoriaActiva]
  );

  const handleClickProducto = (producto) => {
    if (producto.maxSabores) {
      setProductoConSabores(producto);
    } else {
      onAgregar(producto, []);
    }
  };

  return (
    <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {error && <Alert severity="error" sx={{ m: 1.5 }}>{error}</Alert>}
      <Box sx={{ display: 'flex', gap: 1, p: 1.5, overflowX: 'auto' }}>
        {categorias.map((cat) => (
          <Chip
            key={cat}
            label={cat}
            onClick={() => setCategoriaActiva(cat)}
            color={categoriaActiva === cat ? 'primary' : 'default'}
            variant={categoriaActiva === cat ? 'filled' : 'outlined'}
            sx={{ fontWeight: 600 }}
          />
        ))}
      </Box>
      <Grid container spacing={1.5} sx={{ p: 1.5, overflowY: 'auto' }}>
        {productosVisibles.map((producto) => (
          <Grid key={producto.id} size={{ xs: 6, sm: 4, md: 3 }}>
            <motion.div whileTap={{ scale: 0.95 }} whileHover={{ y: -3 }}>
              <Box
                component="button"
                type="button"
                onClick={() => handleClickProducto(producto)}
                sx={{
                  width: '100%',
                  textAlign: 'left',
                  p: 1.75,
                  borderRadius: 3,
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'text.primary',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 0.5,
                }}
              >
                <strong>{producto.nombre}</strong>
                <span style={{ color: '#f6b43b', fontWeight: 700 }}>${producto.precio}</span>
              </Box>
            </motion.div>
          </Grid>
        ))}
      </Grid>

      {productoConSabores && (
        <SaboresPicker
          producto={productoConSabores}
          categoria={productoConSabores.category.nombre}
          onConfirmar={(sabores) => {
            onAgregar(productoConSabores, sabores);
            setProductoConSabores(null);
          }}
          onCancelar={() => setProductoConSabores(null)}
        />
      )}
    </Box>
  );
};

export default ProductGrid;
