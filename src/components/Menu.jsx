import { useEffect, useRef, useState } from 'react';
import './Menu.css';

import img4  from '../assets/4.jpg';
import img5  from '../assets/5.jpg';
import img6  from '../assets/6.jpg';
import img7  from '../assets/7.jpg';
import img8  from '../assets/8.jpg';
import img9  from '../assets/9.jpg';
import img10 from '../assets/10.jpg';
import img11 from '../assets/11.jpg';
import img12 from '../assets/12.jpg';

import menu1  from '../assets/menu1.jpg';
import menu2  from '../assets/menu2.jpg';
import menu3  from '../assets/menu3.jpg';
import menu4  from '../assets/menu4.jpg';
import menu5  from '../assets/menu5.jpg';
import menu6  from '../assets/menu6.jpg';
import menu7  from '../assets/menu7.jpg';
import menu8  from '../assets/menu8.jpg';
import menu9  from '../assets/menu9.jpg';
import menu10 from '../assets/menu10.jpg';

const allImages  = [img4, img5, img6, img7, img8, img9, img10, img11, img12]; // 9 — desktop (3×3)
const menuImages = [menu1, menu2, menu3, menu4, menu5, menu6, menu7, menu8, menu9, menu10];

const Menu = () => {
  const gridRef   = useRef(null);
  const [showPopup, setShowPopup] = useState(false);
  const [isMobile,  setIsMobile]  = useState(window.innerWidth < 768);

  // Detectar mobile para cortar el array
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Mobile: 8 imágenes (4×2), Desktop/iPad: 9 imágenes (3×3)
  const images = isMobile ? allImages.slice(0, 8) : allImages;

  // Parallax sutil
  useEffect(() => {
    const handleScroll = () => {
      const grid = gridRef.current;
      if (!grid) return;
      grid.querySelectorAll('.menu-item').forEach((item, i) => {
        const speed = i % 2 === 0 ? 0.05 : 0.08;
        const yPos  = window.scrollY * speed;
        item.style.transform = `translate3d(0, ${Math.sin(yPos * 0.1) * 12}px, 0)`;
      });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Bloqueo scroll del body con popup abierto
  useEffect(() => {
    document.body.style.overflow = showPopup ? 'hidden' : 'auto';
  }, [showPopup]);

  return (
    <section className="menu-container" id="menu">
      <div className="menu-header">
        <h2 className="menu-title">Nuestro Menú</h2>
        <p className="menu-subtitle">Antójate con lo más bendito</p>
      </div>

      <div className="menu-grid" ref={gridRef}>
        {images.map((src, index) => (
          <div key={index} className="menu-item">
            <div className="image-wrapper">
              <img src={src} alt={`Producto ${index + 4}`} loading="lazy" />
            </div>
          </div>
        ))}
      </div>

      <div className="BotonMenu">
        <button onClick={() => setShowPopup(true)} className="open-menu-btn">
          Consulta nuestro menú
        </button>
      </div>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowPopup(false)}>
              <span>×</span>
            </button>
            <div className="menu-scroll-area">
              <div className="menu-images-list">
                {menuImages.map((img, i) => (
                  <div key={i} className="menu-page-wrapper">
                    <img src={img} alt={`Menú Pág ${i + 1}`} className="menu-page-img" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Menu;