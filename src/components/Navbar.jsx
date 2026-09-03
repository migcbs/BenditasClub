// src/components/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { CircleUserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { CUSTOMER_TOKEN_KEY } from '../customer/CustomerAuth';
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

const NavLinks = ({ onClose }) => (
  <>
    <li><Link to="/#home"        onClick={onClose}>Home</Link></li>
    <li><Link to="/#menu"        onClick={onClose}>Menú</Link></li>
    <li><Link to="/#ubicaciones" onClick={onClose}>Ubicación</Link></li>
    <li><Link to="/shop"         onClick={onClose}>Shop</Link></li>
    <li className="navbar-cuenta-item">
      <Link
        to={clienteHaIniciadoSesion() ? '/perfil' : '/login'}
        onClick={onClose}
        className="navbar-cuenta-icon"
        aria-label="Mi cuenta"
      >
        <CircleUserRound />
      </Link>
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
  const location = useLocation();
  const enLanding = location.pathname === '/';

  // Cerrar con tecla Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
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
  const cuentaTo = clienteHaIniciadoSesion() ? '/perfil' : '/login';

  return (
    <>
      {/* ── Desktop: cápsula flotante (logo · pill de links · cuenta) ──
          Se oculta al hacer scroll; el botón colapsado la reemplaza. */}
      <div className={`navbar-float ${isScrolled ? 'is-hidden' : ''}`}>
        <motion.div
          className="navbar-float-inner"
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link to="/#home" className="nav-logo-btn" aria-label="Benditas Club — inicio">
            <img src={LOGO_ICON} alt="" width={46} height={46} />
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

          <Link to={cuentaTo} className="nav-account-pill" aria-label="Mi cuenta">
            <CircleUserRound size={18} />
          </Link>
        </motion.div>
      </div>

      {/* ── Desktop: botón colapsado (aparece al deslizar) ── */}
      <button
        className={`nav-collapsed-btn ${isScrolled ? 'is-visible' : ''} ${menuOpen ? 'abierto' : ''}`}
        onClick={toggleMenu}
        aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
      >
        <span className="pill-linea" />
        <span className="pill-linea" />
        <span className="pill-linea" />
      </button>

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
              <NavLinks onClose={closeMenu} />
            </ul>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
