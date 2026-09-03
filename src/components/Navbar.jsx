// src/components/Navbar.jsx

import React, { useState, useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { CircleUserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CUSTOMER_TOKEN_KEY } from '../customer/CustomerAuth';
import './Navbar.css';

// Lee el token en cada render (no via estado) para reflejar login/logout
// que ocurren en otra pantalla (ej. CustomerProfile) sin necesitar un
// contexto global — suficiente para un ícono que solo cambia de link.
const clienteHaIniciadoSesion = () => Boolean(window.localStorage.getItem(CUSTOMER_TOKEN_KEY));

const SocialIcons = () => (
  <li className="social-icons-item">
    <div className="social-icons">
      <a href="https://www.facebook.com/benditasclub" target="_blank" rel="noreferrer" aria-label="Facebook"><FaFacebookF /></a>
      <a href="https://www.instagram.com/benditasclub/" target="_blank" rel="noreferrer" aria-label="Instagram"><FaInstagram /></a>
      <a href="https://wa.me/522285982684" target="_blank" rel="noreferrer" aria-label="WhatsApp"><FaWhatsapp /></a>
    </div>
  </li>
);

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
    <SocialIcons />
  </>
);

const Navbar = () => {
  const [menuOpen,   setMenuOpen]   = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Cerrar con tecla Escape
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const toggleMenu = () => setMenuOpen(p => !p);
  const closeMenu  = () => setMenuOpen(false);

  return (
    <>
      {/* ── Desktop navbar ── */}
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        <div className="navbar-links-container">
          <ul className="navbar-links">
            <NavLinks onClose={closeMenu} />
          </ul>
        </div>
      </nav>

      {/* ── Mobile: cápsula flotante ── */}
      <button
        className={`mobile-pill ${menuOpen ? 'abierto' : ''} ${isScrolled ? 'scrolled' : ''}`}
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

            {/* Botón cerrar dentro del menú */}

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
