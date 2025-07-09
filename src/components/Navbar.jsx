import React, { useState, useEffect } from 'react';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';
import { Link } from 'react-router-dom';

import '../Styles.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-links-container">
        <ul className={`navbar-links ${menuOpen ? 'active' : ''}`}>
          {/* Usa Link para la navegación interna con hash */}
          <li><Link to="/#home" onClick={() => setMenuOpen(false)}>Home</Link></li>
          <li><Link to="/#menu" onClick={() => setMenuOpen(false)}>Menú</Link></li>
          <li><Link to="/#ubicaciones" onClick={() => setMenuOpen(false)}>Ubicación</Link></li>
          {/* Este Link te llevará a la nueva página /shop */}
          <li><Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link></li>
        <div className="social-icons">
                  <a href="https://www.facebook.com/benditasclub" target="_blank" rel="noreferrer">
                    <FaFacebookF />
                  </a>
                  <a href="https://www.instagram.com/benditasclub/" target="_blank" rel="noreferrer">
                    <FaInstagram />
                  </a>
                  <a href="https://wa.me/522284032836" target="_blank" rel="noreferrer">
                    <FaWhatsapp />
                  </a>
        </div>
        </ul>
      </div>

      {/* Ícono hamburguesa */}
      <div className="hamburger" onClick={toggleMenu} aria-label="Toggle menu" role="button" tabIndex={0} onKeyPress={(e) => e.key === 'Enter' && toggleMenu()}>
        <div style={{ transform: menuOpen ? 'rotate(45deg) translate(5px, 5px)' : 'none' }} />
        <div style={{ opacity: menuOpen ? 0 : 1, transition: 'opacity 0.3s ease' }} />
        <div style={{ transform: menuOpen ? 'rotate(-45deg) translate(5px, -5px)' : 'none' }} />
      </div>
    </nav>
  );
};

export default Navbar;