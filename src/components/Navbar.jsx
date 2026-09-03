// src/components/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { CircleUserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { CUSTOMER_TOKEN_KEY } from '../customer/CustomerAuth';
import logo from '../assets/logo.png';
import './Navbar.css';

// Lee el token en cada render (no via estado) para reflejar login/logout
// que ocurren en otra pantalla (ej. CustomerProfile) sin necesitar un
// contexto global — suficiente para un ícono que solo cambia de link.
const clienteHaIniciadoSesion = () => Boolean(window.localStorage.getItem(CUSTOMER_TOKEN_KEY));

const LINKS = [
  { to: '/#home', label: 'Home' },
  { to: '/#menu', label: 'Menú' },
  { to: '/#ubicaciones', label: 'Ubicación' },
  { to: '/shop', label: 'Shop' },
];

const NavLinks = ({ onClose }) => (
  <>
    <li><Link to="/#home"        onClick={onClose}>Home</Link></li>
    <li><Link to="/#menu"        onClick={onClose}>Menú</Link></li>
    <li><Link to="/#ubicaciones" onClick={onClose}>Ubicación</Link></li>
    <li><Link to="/shop"         onClick={onClose}>Shop</Link></li>
    <li className="navbar-cuenta-item">
      {clienteHaIniciadoSesion() ? (
        <Link to="/perfil" onClick={onClose} className="navbar-cuenta-icon" aria-label="Mi cuenta">
          <CircleUserRound />
        </Link>
      ) : (
        <Link to="/login" onClick={onClose}>Cuenta</Link>
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
  const location = useLocation();

  // Cerrar con tecla Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleMenu = () => setMenuOpen(p => !p);
  const closeMenu  = () => setMenuOpen(false);
  const sesionIniciada = clienteHaIniciadoSesion();

  return (
    <>
      {/* ── Desktop: cápsula flotante (logo · pill de links · cuenta) ── */}
      <motion.nav
        className="navbar-float"
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      >
        <Link to="/#home" className="nav-logo-btn" aria-label="Benditas Club — inicio">
          <img src={logo} alt="" width={52} height={52} />
        </Link>

        <ul className="nav-pill">
          {LINKS.map(({ to, label }) => {
            const activo = to === '/shop' ? location.pathname === '/shop' : location.pathname === '/';
            return (
              <li key={to}>
                <Link to={to} className={activo ? 'is-active' : ''}>{label}</Link>
              </li>
            );
          })}
        </ul>

        {sesionIniciada ? (
          <Link to="/perfil" className="nav-account-pill" aria-label="Mi cuenta">
            <CircleUserRound size={18} />
          </Link>
        ) : (
          <Link to="/login" className="nav-account-pill">Cuenta</Link>
        )}
      </motion.nav>

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

      {/* ── Mobile: menú fullscreen ── */}
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
