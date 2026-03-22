// src/components/Navbar.jsx
// ✅ Social icons dentro de <li> — HTML válido
// ✅ Lógica sin cambios

import React, { useState, useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Navbar.css';

const SocialIcons = () => (
  <li className="social-icons-item">
    <div className="social-icons">
      <a href="https://www.facebook.com/benditasclub" target="_blank" rel="noreferrer" aria-label="Facebook">
        <FaFacebookF />
      </a>
      <a href="https://www.instagram.com/benditasclub/" target="_blank" rel="noreferrer" aria-label="Instagram">
        <FaInstagram />
      </a>
      <a href="https://wa.me/522285982684" target="_blank" rel="noreferrer" aria-label="WhatsApp">
        <FaWhatsapp />
      </a>
    </div>
  </li>
);

const NavLinks = ({ onClose }) => (
  <>
    <li><Link to="/#home"       onClick={onClose}>Home</Link></li>
    <li><Link to="/#menu"       onClick={onClose}>Menú</Link></li>
    <li><Link to="/#ubicaciones"onClick={onClose}>Ubicación</Link></li>
    <li><Link to="/shop"        onClick={onClose}>Shop</Link></li>
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

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu  = () => setMenuOpen(false);

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        {!menuOpen && (
          <div className="navbar-links-container">
            <ul className="navbar-links">
              <NavLinks onClose={closeMenu} />
            </ul>
          </div>
        )}

        {!menuOpen && (
          <div
            className="hamburger"
            onClick={toggleMenu}
            role="button"
            aria-label="Abrir menú"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && toggleMenu()}
          >
            <div /><div /><div />
          </div>
        )}
      </nav>

      {menuOpen && (
        <div className="fullscreen-menu-overlay">
          <div
            className="hamburger active"
            onClick={toggleMenu}
            role="button"
            aria-label="Cerrar menú"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && toggleMenu()}
          >
            <div /><div /><div />
          </div>

          <ul className="mobile-menu-links">
            <NavLinks onClose={closeMenu} />
          </ul>
        </div>
      )}
    </>
  );
};

export default Navbar;