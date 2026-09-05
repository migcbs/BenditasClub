import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CUSTOMER_TOKEN_KEY } from '../customer/CustomerAuth';
import './WelcomePromoPopup.css';

// sessionStorage (no localStorage): el usuario pidió que reaparezca en
// cada visita nueva, no solo una vez para siempre en el dispositivo —
// sessionStorage se limpia al cerrar la pestaña/navegador, así que una
// visita nueva de verdad vuelve a mostrarlo, pero no en cada clic interno
// dentro de la misma sesión de navegación.
const DISMISS_KEY = 'bc_promo_popup_visto';

// Campaña temporal: 1.5 meses desde que se publicó. Para extenderla o
// terminarla antes, solo hay que mover esta fecha — no hay nada que
// configurar en el admin para esto (es una promo puntual, no una
// recurrente, así que no vale la pena una pantalla de admin para ella).
const PROMO_EXPIRA = new Date('2026-10-20T23:59:59-06:00');

const WelcomePromoPopup = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const yaRegistrado = window.localStorage.getItem(CUSTOMER_TOKEN_KEY);
    const yaLoVioEstaVisita = window.sessionStorage.getItem(DISMISS_KEY);
    const expirada = Date.now() > PROMO_EXPIRA.getTime();
    if (yaRegistrado || yaLoVioEstaVisita || expirada) return;

    const timer = setTimeout(() => setVisible(true), 900);
    return () => clearTimeout(timer);
  }, []);

  const cerrar = () => {
    window.sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
  };

  const registrarse = () => {
    window.sessionStorage.setItem(DISMISS_KEY, '1');
    setVisible(false);
    navigate('/registro');
  };

  if (!visible) return null;

  return (
    <div className="promo-popup-overlay" role="dialog" aria-modal="true" aria-label="Promoción de bienvenida" onClick={cerrar}>
      <div className="promo-popup-card" onClick={(e) => e.stopPropagation()}>
        <button type="button" className="promo-popup-close" onClick={cerrar} aria-label="Cerrar">×</button>
        <span className="promo-popup-badge">🎉 Oferta de bienvenida</span>
        <h2 className="promo-popup-title">10% OFF<br />en tu primer pedido</h2>
        <p className="promo-popup-text">
          Regístrate gratis en Benditas Club y el descuento se aplica solo — sin cupones,
          sin letras chiquitas.
        </p>
        <button type="button" className="promo-popup-cta" onClick={registrarse}>Regístrate y gana 10%</button>
        <button type="button" className="promo-popup-later" onClick={cerrar}>Ahora no</button>
      </div>
    </div>
  );
};

export default WelcomePromoPopup;
