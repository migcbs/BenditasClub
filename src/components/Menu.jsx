import { useEffect, useRef, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  motion,
  useScroll,
  useSpring,
  useTransform,
  useMotionValue,
  useVelocity,
  useAnimationFrame,
  wrap,
} from 'framer-motion';
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

const allImages  = [img4, img5, img6, img7, img8, img9, img10, img11, img12];
const menuImages = [menu1, menu2, menu3, menu4, menu5, menu6, menu7, menu8, menu9, menu10];

// Adaptación del componente "ScrollVelocity" (framer-motion) a este proyecto
// (CRA, sin Tailwind/TS): dos filas de fotos que se deslizan solas y
// aceleran/invierten dirección según qué tan rápido y hacia dónde se
// scrollea la página — igual que el prompt de referencia, con las fotos
// del menú en vez de logos de producto.
const ScrollVelocityRow = ({ images, velocity }) => {
  const baseX = useMotionValue(0);
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 100 });
  const velocityFactor = useTransform(smoothVelocity, [0, 10000], [0, 5], { clamp: false });
  const x = useTransform(baseX, (v) => `${wrap(0, -50, v)}%`);
  const directionFactor = useRef(velocity < 0 ? -1 : 1);

  useAnimationFrame((t, delta) => {
    let moveBy = directionFactor.current * Math.abs(velocity) * (delta / 1000);
    if (velocityFactor.get() < 0) directionFactor.current = -1;
    else if (velocityFactor.get() > 0) directionFactor.current = 1;
    moveBy += directionFactor.current * moveBy * velocityFactor.get();
    baseX.set(baseX.get() + moveBy);
  });

  // Duplicado x2 para que el wrap(0,-50,...) sea un loop continuo sin corte visible.
  const loop = [...images, ...images];

  return (
    <div className="menu-marquee-row">
      <motion.div className="menu-marquee-track" style={{ x }}>
        {loop.map((src, i) => (
          <div className="menu-marquee-item" key={i}>
            <img src={src} alt="Platillo Benditas Club" loading="lazy" />
          </div>
        ))}
      </motion.div>
    </div>
  );
};

const Menu = () => {
  const [showPopup, setShowPopup] = useState(false);
  const rowA = allImages;
  const rowB = [...allImages].reverse();

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

      <div className="menu-marquee-wrap">
        <ScrollVelocityRow images={rowA} velocity={3} />
        <ScrollVelocityRow images={rowB} velocity={-3} />
      </div>

      <div className="BotonMenu">
        <button onClick={() => setShowPopup(true)} className="open-menu-btn">
          Consulta nuestro menú
          <span className="open-menu-btn-icon">
            <ArrowRight size={18} />
          </span>
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
