import './Footer.css';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer id="contacto" className="footer">
      <div className="footer-container">
        {/* Parte Superior: Branding y Social */}
        <div className="footer-main">
          <h4 className="footer-logo-text">BENDITAS CLUB</h4>
          <p className="footer-tagline">Alitas n' More • Coatepec & Xico</p>
          
          <div className="social-icons">
            <a href="https://www.facebook.com/benditasclub" target="_blank" rel="noreferrer" className="social-link">
              <FaFacebookF />
            </a>
            <a href="https://www.instagram.com/benditasclub/" target="_blank" rel="noreferrer" className="social-link">
              <FaInstagram />
            </a>
            <a href="https://wa.me/522285982684" target="_blank" rel="noreferrer" className="social-link">
              <FaWhatsapp />
            </a>
          </div>
        </div>

        {/* Parte Inferior: Links y Legal Centrados */}
        <div className="footer-bottom">
          <div className="footer-links-group">
            <a href="mailto:benditasclub@gmail.com" className="footer-email">
              benditasclub@gmail.com
            </a>
            <p className="footer-copyright">
              &copy; {new Date().getFullYear()} Benditas Club. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;