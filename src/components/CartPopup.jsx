// src/components/CartPopup.jsx
// ✅ Estilos Neo-Pop consistentes con Shop.css
// ✅ Compatible con campos nuevos: precio, nombre, varianteNombre, cantidad
// ✅ Mantiene lógica de formulario + WhatsApp original

import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingCart, Send, User, Phone, MapPin, Home, Building, Package } from 'lucide-react';

const WHATSAPP_NUMEROS = {
  Coatepec: '522284032836',
  Xico:     '522283544463',
};

const CartPopup = ({ cartItems, onClose, removeFromCart, clearCart }) => {

  // Soporte para ambos naming conventions (price/precio, name/nombre, etc.)
  const getPrice  = (item) => item.price  ?? item.precio  ?? 0;
  const getNombre = (item) => item.name   ?? item.nombre  ?? '';
  const getVariante = (item) => item.variantName ?? item.varianteNombre ?? '';
  const getCantidad = (item) => item.quantity ?? item.cantidad ?? 1;

  const totalAmount = cartItems.reduce(
    (total, item) => total + getPrice(item) * getCantidad(item), 0
  );

  const [showForm,       setShowForm]       = useState(false);
  const [nombre,         setNombre]         = useState('');
  const [telefono,       setTelefono]       = useState('');
  const [metodo,         setMetodo]         = useState('');
  const [direccion,      setDireccion]      = useState('');
  const [sucursal,       setSucursal]       = useState('');
  const [ordenId,        setOrdenId]        = useState('');
  const [errores,        setErrores]        = useState({});

  useEffect(() => {
    if (!showForm) resetForm();
    if (cartItems.length === 0) { setShowForm(false); resetForm(); }
  }, [showForm, cartItems.length]);

  const resetForm = () => {
    setNombre(''); setTelefono(''); setMetodo('');
    setDireccion(''); setSucursal(''); setOrdenId(''); setErrores({});
  };

  const validar = () => {
    const e = {};
    if (!nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!telefono.trim()) e.telefono = 'El teléfono es obligatorio';
    else if (!/^\d{10}$/.test(telefono.trim())) e.telefono = 'Debe tener 10 dígitos';
    if (!metodo) e.metodo = 'Elige un método de entrega';
    if (metodo === 'delivery' && !direccion.trim()) e.direccion = 'La dirección es obligatoria';
    if (!sucursal) e.sucursal = 'Elige una sucursal';
    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const generarMensaje = (numOrden) => {
    let msg = `🛍️ *BENDITAS CLUB — Pedido Merch*\n`;
    msg    += `━━━━━━━━━━━━━━━━━━━\n`;
    msg    += `🔖 *Orden:* ${numOrden}\n`;
    msg    += `👤 *Cliente:* ${nombre}\n`;
    msg    += `📱 *Tel:* ${telefono}\n`;
    msg    += `🏪 *Sucursal:* ${sucursal}\n`;

    if (metodo === 'delivery') {
      msg  += `🛵 *Entrega:* A domicilio\n`;
      msg  += `📍 *Dirección:* ${direccion}\n`;
    } else {
      msg  += `🏪 *Entrega:* Recoger en sucursal\n`;
    }

    msg    += `\n🛒 *Productos:*\n`;
    msg    += `━━━━━━━━━━━━━━━━━━━\n`;

    cartItems.forEach((item, i) => {
      const variante = getVariante(item);
      const precio   = getPrice(item);
      const qty      = getCantidad(item);
      msg += `${i + 1}. *${getNombre(item)}*`;
      if (variante && variante !== 'Único' && variante !== 'Default') {
        msg += ` (${variante})`;
      }
      msg += ` x${qty} — $${(precio * qty).toFixed(2)}\n`;
    });

    msg += `\n━━━━━━━━━━━━━━━━━━━\n`;
    msg += `💰 *Total: $${totalAmount.toFixed(2)} MXN*\n`;
    msg += `¡Espero su confirmación!`;

    return encodeURIComponent(msg);
  };

  const enviarPedido = () => {
    if (!validar()) return;

    const numOrden = `BC-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000).toString().padStart(3,'0')}`;
    setOrdenId(numOrden);

    const numero = WHATSAPP_NUMEROS[sucursal];
    if (!numero) { alert('Número no configurado para esta sucursal.'); return; }

    window.open(`https://wa.me/${numero}?text=${generarMensaje(numOrden)}`, '_blank');
  };

  const confirmarVaciar = () => {
    if (window.confirm('¿Vaciar el carrito?')) clearCart();
  };

  return (
    <div className="cart-popup-overlay" onClick={onClose}>
      <div className="cart-popup" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="cart-popup-header">
          <h2>
            {showForm ? 'Datos del pedido' : 'Tu carrito'}
          </h2>
          <button className="cart-popup-close" onClick={onClose}>×</button>
        </div>

        {/* Carrito vacío */}
        {cartItems.length === 0 && (
          <p className="cart-popup-empty">
            Tu carrito está vacío — ¡agrega algo del merch!
          </p>
        )}

        {/* Vista: lista del carrito */}
        {cartItems.length > 0 && !showForm && (
          <>
            <div className="cart-popup-items">
              {cartItems.map(item => (
                <div key={`${item.id}-${item.variantId ?? item.varianteId}`} className="cart-item">
                  <img
                    src={item.image ?? item.imagen}
                    alt={getNombre(item)}
                    className="cart-item-image"
                  />
                  <div className="cart-item-info">
                    <p className="cart-item-name">{getNombre(item)}</p>
                    {getVariante(item) && getVariante(item) !== 'Único' && (
                      <p className="cart-item-variant">{getVariante(item)}</p>
                    )}
                    <p className="cart-item-qty">{getCantidad(item)} pza{getCantidad(item) > 1 ? 's' : ''}</p>
                  </div>
                  <p className="cart-item-price">
                    ${(getPrice(item) * getCantidad(item)).toFixed(2)}
                  </p>
                  <button
                    className="cart-item-remove"
                    onClick={() => removeFromCart(item.id, item.variantId ?? item.varianteId)}
                    aria-label="Eliminar"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="cart-popup-footer">
              <div className="cart-popup-total">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)} MXN</span>
              </div>
              <div className="cart-popup-actions">
                <button className="cart-btn-clear" onClick={confirmarVaciar}>
                  Vaciar
                </button>
                <button className="cart-btn-whatsapp" onClick={() => setShowForm(true)}>
                  <Send size={15} /> Pedir
                </button>
              </div>
            </div>
          </>
        )}

        {/* Vista: formulario de pedido */}
        {cartItems.length > 0 && showForm && (
          <div className="cart-form">

            <div className="cart-form-group">
              <input
                type="text"
                placeholder="Tu nombre"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                className={errores.nombre ? 'cart-input-error' : ''}
              />
              {errores.nombre && <span className="cart-form-error">{errores.nombre}</span>}
            </div>

            <div className="cart-form-group">
              <input
                type="tel"
                placeholder="Teléfono (10 dígitos)"
                value={telefono}
                maxLength={10}
                onChange={e => setTelefono(e.target.value)}
                className={errores.telefono ? 'cart-input-error' : ''}
              />
              {errores.telefono && <span className="cart-form-error">{errores.telefono}</span>}
            </div>

            <div className="cart-form-group">
              <label className="cart-form-label">¿Cómo lo quieres?</label>
              <div className="cart-metodo-btns">
                <button
                  type="button"
                  className={`cart-metodo-btn ${metodo === 'delivery' ? 'activo' : ''}`}
                  onClick={() => setMetodo('delivery')}
                >
                  🛵 A domicilio
                </button>
                <button
                  type="button"
                  className={`cart-metodo-btn ${metodo === 'pickup' ? 'activo' : ''}`}
                  onClick={() => { setMetodo('pickup'); setDireccion(''); }}
                >
                  🏪 Recoger
                </button>
              </div>
              {errores.metodo && <span className="cart-form-error">{errores.metodo}</span>}
            </div>

            {metodo === 'delivery' && (
              <div className="cart-form-group">
                <input
                  type="text"
                  placeholder="Calle, número, colonia..."
                  value={direccion}
                  onChange={e => setDireccion(e.target.value)}
                  className={errores.direccion ? 'cart-input-error' : ''}
                />
                {errores.direccion && <span className="cart-form-error">{errores.direccion}</span>}
              </div>
            )}

            <div className="cart-form-group">
              <label className="cart-form-label">¿A qué sucursal?</label>
              <div className="cart-metodo-btns">
                {Object.keys(WHATSAPP_NUMEROS).map(s => (
                  <button
                    key={s}
                    type="button"
                    className={`cart-metodo-btn ${sucursal === s ? 'activo' : ''}`}
                    onClick={() => setSucursal(s)}
                  >
                    📍 {s}
                  </button>
                ))}
              </div>
              {errores.sucursal && <span className="cart-form-error">{errores.sucursal}</span>}
            </div>

            <div className="cart-popup-footer">
              <div className="cart-popup-actions">
                <button className="cart-btn-clear" onClick={() => setShowForm(false)}>
                  Atrás
                </button>
                <button className="cart-btn-whatsapp" onClick={enviarPedido}>
                  <Send size={14} /> Enviar por WhatsApp
                </button>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default CartPopup;