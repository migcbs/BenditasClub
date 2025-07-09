import '../Styles.css';
import img4 from '../assets/4.jpg';
import img5 from '../assets/5.jpg';
import img6 from '../assets/6.jpg';
import img7 from '../assets/7.jpg';
import img8 from '../assets/8.jpg';
import img9 from '../assets/9.jpg';
import img10 from '../assets/10.jpg';
import img11 from '../assets/11.jpg';
import img12 from '../assets/12.jpg';

import menu1 from '../assets/menu1.jpg';
import menu2 from '../assets/menu2.jpg';
import menu3 from '../assets/menu3.jpg';
import menu4 from '../assets/menu4.jpg';
import menu5 from '../assets/menu5.jpg';
import menu6 from '../assets/menu6.jpg';
import menu7 from '../assets/menu7.jpg';
import menu8 from '../assets/menu8.jpg';
import menu9 from '../assets/menu9.jpg';
import menu10 from '../assets/menu10.jpg';

import { useEffect, useRef, useState } from 'react';

const images = [img4, img5, img6, img7, img8, img9, img10, img11, img12];
const menuImages = [menu1, menu2, menu3, menu4, menu5, menu6, menu7, menu8, menu9, menu10];

const Menu = () => {
  const gridRef = useRef(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const grid = gridRef.current;
      if (!grid) return;

      const items = grid.querySelectorAll('.menu-item');
      items.forEach((item, i) => {
        const rawOffset = window.scrollY * 0.005 * (i % 2 === 0 ? -1 : 1);
        const offset = Math.max(Math.min(rawOffset, 3), -3);
        item.style.transform = `translateY(${offset}px)`;
      });

      clearTimeout(grid._resetTimer);
      grid._resetTimer = setTimeout(() => {
        items.forEach(item => {
          item.style.transform = 'translateY(0)';
        });
      }, 200);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <section className="menu-gallery" ref={gridRef} id="menu">
        {images.map((src, index) => (
          <div key={index} className="menu-item">
            <img src={src} alt={`Producto ${index + 4}`} />
          </div>
        ))}

      </section>
        <div className="BotonMenu">
          <button onClick={() => setShowPopup(true)} className="open-menu-btn">
            Consulta nuestro menú
          </button>
        </div>

      {showPopup && (
        <div className="popup-overlay" onClick={() => setShowPopup(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowPopup(false)}>×</button>
            <div className="menu-slider">
              {menuImages.map((img, i) => (
                <img key={i} src={img} alt={`Página ${i + 1}`} className="menu-slide" />
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Menu;