// src/components/CartPopup.jsx
import React, { useState, useEffect } from 'react';
import { X, Trash2, ShoppingCart, Send, User, Phone, MapPin, Home, Building, Package } from 'lucide-react'; // Nuevos iconos

const whatsappNumbers = {
    'Coatepec': '522284032836', // Reemplaza con el número de Xalapa
    'Xico': '522283544463', // Reemplaza con el número de Coatepec
    // Añade más sucursales si es necesario
};

const CartPopup = ({ cartItems, onClose, removeFromCart, clearCart }) => {
    const totalAmount = cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

    // *** NUEVOS ESTADOS DEL FORMULARIO DE PEDIDO ***
    const [showOrderForm, setShowOrderForm] = useState(false);
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState(''); // 'pickup' o 'delivery'
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [selectedSucursal, setSelectedSucursal] = useState('');
    const [orderNumber, setOrderNumber] = useState('');
    const [formErrors, setFormErrors] = useState({});

    // Resetear el formulario cuando se abre/cierra o vacía el carrito
    useEffect(() => {
        if (!showOrderForm) { // Si el formulario se oculta (o popup se cierra)
            resetFormData();
        }
        if (cartItems.length === 0) { // Si el carrito se vacía
            setShowOrderForm(false);
            resetFormData();
        }
    }, [showOrderForm, cartItems.length]); // Dependencias para resetear

    const resetFormData = () => {
        setCustomerName('');
        setCustomerPhone('');
        setDeliveryMethod('');
        setDeliveryAddress('');
        setSelectedSucursal('');
        setOrderNumber('');
        setFormErrors({});
    };


    const handleClearCart = () => {
        if (window.confirm('¿Estás seguro de que quieres vaciar el carrito?')) {
            clearCart();
        }
    };

    const generateOrderNumber = () => {
        const timestamp = Date.now().toString().slice(-6); // Últimos 6 dígitos del timestamp
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3 dígitos aleatorios
        return `BC-${timestamp}-${random}`;
    };

    const validateForm = () => {
        const errors = {};
        if (!customerName.trim()) {
            errors.customerName = 'El nombre es obligatorio.';
        }
        if (!customerPhone.trim()) {
            errors.customerPhone = 'El teléfono es obligatorio.';
        } else if (!/^\d{10}$/.test(customerPhone.trim())) { // Asumiendo 10 dígitos para teléfonos en México
            errors.customerPhone = 'Formato de teléfono inválido (10 dígitos).';
        }
        if (!deliveryMethod) {
            errors.deliveryMethod = 'Debes seleccionar un método de entrega.';
        }
        if (deliveryMethod === 'delivery' && !deliveryAddress.trim()) {
            errors.deliveryAddress = 'La dirección es obligatoria para envíos a domicilio.';
        }
        if (!selectedSucursal) {
            errors.selectedSucursal = 'Debes seleccionar una sucursal.';
        }
        if (cartItems.length === 0) {
            errors.cart = 'El carrito está vacío.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const getWhatsAppMessage = () => {
        let message = '¡Hola! Me gustaría hacer un pedido desde Benditas Club.\n\n';

        if (orderNumber) {
            message += `*Número de Pedido:* ${orderNumber}\n`;
        }
        message += `*Cliente:* ${customerName}\n`;
        message += `*Teléfono:* ${customerPhone}\n`;

        message += `*Método de Entrega:* ${deliveryMethod === 'pickup' ? 'Recoger en Sucursal:' : 'Entrega a Domicilio'}\n`;

        if (deliveryMethod === 'delivery') {
            message += `*Dirección:* ${deliveryAddress}\n`;
        }
        message += ` ${selectedSucursal}\n\n`;

        message += '*Detalles del Pedido:*\n';
        cartItems.forEach(item => {
            message += `- ${item.name}`;
            if (item.variantName && item.variantName !== 'Único' && item.variantName !== 'Default') {
                message += ` (${item.variantName})`;
            }
            message += `: ${item.quantity} x $${item.price.toFixed(2)} = $${(item.quantity * item.price).toFixed(2)}\n`;
        });
        message += `\n*Total a pagar: $${totalAmount.toFixed(2)} MXN*\n\n`;
        message += '¡Espero tu confirmación!';

        return encodeURIComponent(message);
    };

    const handleSendWhatsAppOrder = () => {
        if (!validateForm()) {
            alert('Por favor, completa todos los campos obligatorios del formulario.');
            return;
        }

        const newOrderNum = generateOrderNumber();
        setOrderNumber(newOrderNum); // Actualizar el estado con el número de pedido

        const targetWhatsappNumber = whatsappNumbers[selectedSucursal];
        if (!targetWhatsappNumber) {
            alert('Número de WhatsApp no configurado para la sucursal seleccionada.');
            return;
        }

        const message = getWhatsAppMessage(); // Generar mensaje con el nuevo número de pedido
        window.open(`https://wa.me/${targetWhatsappNumber}?text=${message}`, '_blank');
        
        // Opcional: Vaciar el carrito y cerrar el popup después de enviar el pedido
        // clearCart();
        // onClose();
    };


    return (
        <div className="cart-popup-overlay" onClick={onClose}>
            <div className="cart-popup" onClick={(e) => e.stopPropagation()}>
                <button className="close-popup-btn" onClick={onClose}>
                    <X size={24} />
                </button>
                <h2>Tu Carrito <ShoppingCart size={28} /></h2>

                {cartItems.length === 0 ? (
                    <p className="empty-cart-message">Tu carrito está vacío. ¡Empieza a llenarlo con tus productos favoritos!</p>
                ) : (
                    <>
                        {!showOrderForm ? ( // Vista de resumen del carrito
                            <>
                                <div className="cart-items-list">
                                    {cartItems.map(item => (
                                        <div key={`${item.id}-${item.variantId}`} className="cart-item">
                                            <img src={item.image} alt={item.name} className="cart-item-image" />
                                            <div className="cart-item-details">
                                                <span className="cart-item-name">
                                                    {item.name} {item.variantName && item.variantName !== 'Único' && item.variantName !== 'Default' ? `(${item.variantName})` : ''}
                                                </span>
                                                <span className="cart-item-price">${item.price.toFixed(2)} x {item.quantity}</span>
                                                <span className="cart-item-subtotal">Subtotal: ${(item.price * item.quantity).toFixed(2)}</span>
                                            </div>
                                            <button className="remove-item-btn" onClick={() => removeFromCart(item.id, item.variantId)}>
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div className="cart-summary">
                                    <h3>Total: ${totalAmount.toFixed(2)} MXN</h3>
                                </div>

                                <div className="cart-actions">
                                    <button className="clear-cart-btn" onClick={handleClearCart}>
                                        <Trash2 size={20} style={{ marginRight: '8px' }} /> Vaciar Carrito
                                    </button>
                                    <button className="whatsapp-order-btn" onClick={() => setShowOrderForm(true)}>
                                        <Send size={20} style={{ marginRight: '8px' }} /> Proceder al Pedido
                                    </button>
                                </div>
                            </>
                        ) : ( // Vista del formulario de pedido
                            <div className="order-form-container">
                                <h3 className="form-title"><Package size={28} /> Detalles del Pedido</h3>
                                <p className="form-description">Por favor, completa tus datos para finalizar el pedido.</p>

                                <div className="form-group">
                                    <label htmlFor="customerName"><User size={18} /> Nombre Completo <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        id="customerName"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        required
                                    />
                                    {formErrors.customerName && <span className="error-message">{formErrors.customerName}</span>}
                                </div>

                                <div className="form-group">
                                    <label htmlFor="customerPhone"><Phone size={18} /> Teléfono (10 dígitos) <span className="required">*</span></label>
                                    <input
                                        type="tel"
                                        id="customerPhone"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        maxLength="10"
                                        required
                                    />
                                    {formErrors.customerPhone && <span className="error-message">{formErrors.customerPhone}</span>}
                                </div>

                                <div className="form-group">
                                    <label><MapPin size={18} /> Método de Entrega <span className="required">*</span></label>
                                    <div className="radio-group">
                                        <label>
                                            <input
                                                type="radio"
                                                value="delivery"
                                                checked={deliveryMethod === 'delivery'}
                                                onChange={() => setDeliveryMethod('delivery')}
                                            /> Entrega a Domicilio <Home size={18} style={{verticalAlign: 'middle'}}/>
                                        </label>
                                        <label>
                                            <input
                                                type="radio"
                                                value="pickup"
                                                checked={deliveryMethod === 'pickup'}
                                                onChange={() => {
                                                    setDeliveryMethod('pickup');
                                                    setDeliveryAddress(''); // Limpiar dirección si cambia a recoger
                                                }}
                                            /> Recoger en Sucursal <Building size={18} style={{verticalAlign: 'middle'}}/>
                                        </label>
                                    </div>
                                    {formErrors.deliveryMethod && <span className="error-message">{formErrors.deliveryMethod}</span>}
                                </div>

                                {deliveryMethod === 'delivery' && (
                                    <div className="form-group">
                                        <label htmlFor="deliveryAddress"><MapPin size={18} /> Domicilio Completo <span className="required">*</span></label>
                                        <textarea
                                            id="deliveryAddress"
                                            value={deliveryAddress}
                                            onChange={(e) => setDeliveryAddress(e.target.value)}
                                            rows="3"
                                            required
                                        ></textarea>
                                        {formErrors.deliveryAddress && <span className="error-message">{formErrors.deliveryAddress}</span>}
                                    </div>
                                )}

                                <div className="form-group">
                                    <label htmlFor="selectedSucursal"><Building size={18} /> Sucursal de Origen <span className="required">*</span></label>
                                    <select
                                        id="selectedSucursal"
                                        value={selectedSucursal}
                                        onChange={(e) => setSelectedSucursal(e.target.value)}
                                        required
                                    >
                                        <option value="">-- Selecciona una sucursal --</option>
                                        {Object.keys(whatsappNumbers).map(sucursalName => (
                                            <option key={sucursalName} value={sucursalName}>{sucursalName}</option>
                                        ))}
                                    </select>
                                    {formErrors.selectedSucursal && <span className="error-message">{formErrors.selectedSucursal}</span>}
                                </div>

                                <div className="form-actions-bottom">
                                    <button className="back-to-cart-btn" onClick={() => setShowOrderForm(false)}>
                                        Volver al Carrito
                                    </button>
                                    <button className="whatsapp-order-btn" onClick={handleSendWhatsAppOrder}>
                                        <Send size={20} style={{ marginRight: '8px' }} /> Enviar Pedido por WhatsApp
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CartPopup;