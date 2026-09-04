import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './CookieConsent.css';

const STORAGE_KEY = 'bc_cookie_consent';

const CookieConsent = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const aceptar = () => {
    window.localStorage.setItem(STORAGE_KEY, 'aceptado');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Aviso de cookies">
      <p>
        Usamos almacenamiento local para mantener tu sesión y tu carrito — no usamos cookies de
        publicidad ni de rastreo. Más info en nuestro{' '}
        <Link to="/privacidad">aviso de privacidad</Link>.
      </p>
      <button type="button" className="cookie-banner-btn" onClick={aceptar}>Entendido</button>
    </div>
  );
};

export default CookieConsent;
