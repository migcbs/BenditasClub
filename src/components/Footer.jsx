import '../Styles.css';
import { FaFacebookF, FaInstagram, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer id="contacto" className="footer">
      <div className="footer-content">
        <p>&copy; 2025 Benditas Club. Todos los derechos reservados.</p>
        <p>Contáctanos: benditasclub@gmail.com</p>

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
      </div>
    </footer>
  );
};

export default Footer;