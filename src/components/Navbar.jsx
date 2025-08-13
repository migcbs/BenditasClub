import React, { useState, useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import '../Styles.css';

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <>
      <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
        {/* Renderiza los links de escritorio si el menú móvil NO está abierto */}
        {!menuOpen && (
          <div className="navbar-links-container">
            <ul className="navbar-links">
              <li><Link to="/#home" onClick={() => setMenuOpen(false)}>Home</Link></li>
              <li><Link to="/#menu" onClick={() => setMenuOpen(false)}>Menú</Link></li>
              <li><Link to="/#ubicaciones" onClick={() => setMenuOpen(false)}>Ubicación</Link></li>
              <li><Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link></li>
              <div className="social-icons">
                <a href="https://www.facebook.com/benditasclub" target="_blank" rel="noreferrer">
                  <FaFacebookF />
                </a>
                <a href="https://www.instagram.com/benditasclub/" target="_blank" rel="noreferrer">
                  <FaInstagram />
                </a>
                <a href="https://wa.me/522285982684" target="_blank" rel="noreferrer">
                  <FaWhatsapp />
                </a>
              </div>
            </ul>
          </div>
        )}

        {/* El botón de la hamburguesa NORMAL (cuando el menú está cerrado) */}
        {!menuOpen && ( // Solo muestra la hamburguesa si el menú NO está abierto
          <div
            className="hamburger" // Sin clase 'active' aquí
            onClick={toggleMenu}
            aria-label="Toggle menu"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && toggleMenu()}
          >
            <div />
            <div />
            <div />
          </div>
        )}
      </nav>

      {/* EL MENÚ DE PANTALLA COMPLETA (cuando el menú está abierto) */}
      {menuOpen && (
        <div className="fullscreen-menu-overlay">
          {/* El botón de cerrar (la 'X') DENTRO del overlay */}
          <div
            className="hamburger active" // Con clase 'active' para la 'X'
            onClick={toggleMenu}
            aria-label="Close menu"
            role="button"
            tabIndex={0}
            onKeyPress={(e) => e.key === 'Enter' && toggleMenu()}
          >
            <div />
            <div />
            <div />
          </div>

          {/* El contenido del menú móvil */}
          <ul className="mobile-menu-links"> {/* Cambiado a una clase más específica */}
            <li><Link to="/#home" onClick={() => setMenuOpen(false)}>Home</Link></li>
            <li><Link to="/#menu" onClick={() => setMenuOpen(false)}>Menú</Link></li>
            <li><Link to="/#ubicaciones" onClick={() => setMenuOpen(false)}>Ubicación</Link></li>
            <li><Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link></li>
            <div className="social-icons">
              <a href="https://www.facebook.com/benditasclub" target="_blank" rel="noreferrer">
                <FaFacebookF />
              </a>
              <a href="https://www.instagram.com/benditasclub/" target="_blank" rel="noreferrer">
                <FaInstagram />
              </a>
              <a href="https://wa.me/522285982684" target="_blank" rel="noreferrer">
                <FaWhatsapp />
              </a>
            </div>
          </ul>
        </div>
      )}
    </>
  );
};

export default Navbar;