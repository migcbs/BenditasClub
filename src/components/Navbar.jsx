// src/components/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { UserRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { CUSTOMER_TOKEN_KEY } from '../customer/CustomerAuth';
import LoginPopup from '../customer/LoginPopup';
import './Navbar.css';

// Mismo ícono que la pestaña del navegador (logo192.jpg / .ico en public/) —
// es el isotipo circular, no el lockup ancho con texto (ese no cabe en un
// círculo de 46px). Archivo servido tal cual desde public/, sin import.
const LOGO_ICON = `${process.env.PUBLIC_URL}/logo192.jpg`;

// Lee el token en cada render (no via estado) para reflejar login/logout
// que ocurren en otra pantalla (ej. CustomerProfile) sin necesitar un
// contexto global — suficiente para un ícono que solo cambia de link.
const clienteHaIniciadoSesion = () => Boolean(window.localStorage.getItem(CUSTOMER_TOKEN_KEY));

const SECTIONS = ['home', 'menu', 'ubicaciones'];
const LINKS = [
  { to: '/#home', section: 'home', label: 'Home' },
  { to: '/#menu', section: 'menu', label: 'Menú' },
  { to: '/#ubicaciones', section: 'ubicaciones', label: 'Ubicación' },
  { to: '/shop', section: null, label: 'Shop' },
];

// Resorte compartido por el shell y su contenido — la misma sensación
// "elástica" en ambos es lo que vende el efecto de gota líquida al pasar
// de píldora ancha a botón circular.
const SHELL_SPRING = { type: 'spring', stiffness: 300, damping: 28, mass: 0.9 };

const NavLinks = ({ onClose, onAccountClick }) => (
  <>
    <li><Link to="/#home"        onClick={onClose}>Home</Link></li>
    <li><Link to="/#menu"        onClick={onClose}>Menú</Link></li>
    <li><Link to="/#ubicaciones" onClick={onClose}>Ubicación</Link></li>
    <li><Link to="/shop"         onClick={onClose}>Shop</Link></li>
    <li className="navbar-cuenta-item">
      {clienteHaIniciadoSesion() ? (
        <Link to="/perfil" onClick={onClose} className="navbar-cuenta-icon" aria-label="Mi cuenta">
          <UserRound />
        </Link>
      ) : (
        <button
          type="button"
          className="navbar-cuenta-icon"
          aria-label="Iniciar sesión"
          onClick={() => { onClose(); onAccountClick(); }}
        >
          <UserRound />
        </button>
      )}
    </li>
    <li className="social-icons-item">
      <div className="social-icons">
        <a href="https://www.facebook.com/benditasclub" target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebookF /></a>
        <a href="https://www.instagram.com/benditasclub/" target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram /></a>
        <a href="https://wa.me/522285982684" target="_blank" rel="noreferrer" aria-label="WhatsApp"><FaWhatsapp /></a>
      </div>
    </li>
  </>
);

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [seccionActiva, setSeccionActiva] = useState('home');
  const [showLogin, setShowLogin] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const enLanding = location.pathname === '/';

  // Cerrar con tecla Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { setMenuOpen(false); setShowLogin(false); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Desktop: la cápsula completa se colapsa a un solo botón (como el
  // hamburguesa de mobile) en cuanto se empieza a deslizar la página.
  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy: el puntito activo sigue la sección que cruza la mitad de
  // la pantalla en vez de marcar las tres a la vez — solo aplica en la
  // landing, donde existen los tres <section> con esos ids. Se calcula en
  // el mismo listener de scroll (getBoundingClientRect), no con
  // IntersectionObserver: los navegadores pausan esos callbacks cuando la
  // pestaña pierde visibilidad, lo que lo hacía imposible de verificar en
  // vivo durante el desarrollo — esta forma es igual de correcta y no
  // depende de que la pestaña esté en foco.
  useEffect(() => {
    if (!enLanding) return;
    const onScroll = () => {
      const mitad = window.innerHeight / 2;
      let activa = SECTIONS[0];
      for (const id of SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.top <= mitad && rect.bottom >= mitad) { activa = id; break; }
      }
      setSeccionActiva(activa);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [enLanding]);

  const toggleMenu = () => setMenuOpen((p) => !p);
  const closeMenu  = () => setMenuOpen(false);

  const handleLoginSuccess = () => {
    setShowLogin(false);
    navigate('/perfil');
  };

  return (
    <>
      {/* ── Desktop: un solo "shell" que se transforma de píldora ancha a
          botón circular al hacer scroll, en vez de dos elementos separados
          que se cruzan en opacidad — layout + spring hacen que se sienta
          como una gota que se contrae, no un simple fundido. ── */}
      <motion.div
        layout
        transition={SHELL_SPRING}
        className={`navbar-shell ${isScrolled ? 'is-collapsed' : 'is-expanded'} ${isScrolled && menuOpen ? 'abierto' : ''}`}
        onClick={isScrolled ? toggleMenu : undefined}
        role={isScrolled ? 'button' : undefined}
        aria-label={isScrolled ? (menuOpen ? 'Cerrar menú' : 'Abrir menú') : undefined}
      >
        <AnimatePresence mode="wait" initial={false}>
          {!isScrolled ? (
            <motion.div
              key="expanded"
              className="navbar-shell-row"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link to="/#home" className="nav-logo-btn" aria-label="Benditas Club — inicio">
                <img src={LOGO_ICON} alt="" width={38} height={38} />
              </Link>

              <ul className="nav-pill">
                {LINKS.map(({ to, section, label }) => {
                  const activo = section
                    ? enLanding && seccionActiva === section
                    : location.pathname === '/shop';
                  return (
                    <li key={to}>
                      <Link to={to} className={activo ? 'is-active' : ''}>{label}</Link>
                    </li>
                  );
                })}
              </ul>

              {clienteHaIniciadoSesion() ? (
                <Link to="/perfil" className="nav-account-pill" aria-label="Mi cuenta">
                  <UserRound size={20} />
                </Link>
              ) : (
                <button type="button" className="nav-account-pill" aria-label="Iniciar sesión" onClick={() => setShowLogin(true)}>
                  <UserRound size={20} />
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              className="navbar-shell-row is-collapsed-row"
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.4 }}
              transition={{ duration: 0.2, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="pill-linea" />
              <span className="pill-linea" />
              <span className="pill-linea" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Mobile: cápsula flotante ── */}
      <button
        className={`mobile-pill ${menuOpen ? 'abierto' : ''}`}
        onClick={toggleMenu}
        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        <span className="pill-linea" />
        <span className="pill-linea" />
        <span className="pill-linea" />
      </button>

      {/* ── Menú fullscreen (mobile, y desktop cuando está colapsado) ── */}
      {menuOpen && (
        <div className="fullscreen-menu-overlay" onClick={closeMenu}>
          {/* Clic en el fondo cierra — clic en el contenido no */}
          <div className="fullscreen-menu-inner" onClick={e => e.stopPropagation()}>
            <ul className="mobile-menu-links">
              <NavLinks onClose={closeMenu} onAccountClick={() => setShowLogin(true)} />
            </ul>
          </div>
        </div>
      )}

      {showLogin && (
        <LoginPopup onClose={() => setShowLogin(false)} onSuccess={handleLoginSuccess} />
      )}
    </>
  );
};

export default Navbar;
