import { useState, useEffect, useRef } from "react";
import img1 from "../assets/1.jpg";
import img2 from "../assets/2.jpg";
import img3 from "../assets/3.jpg";
import logo from "../assets/logo.png";
import PedidoPopup from "./pedido/PedidoPopup";
import "./Home.css";

const images = [img1, img2, img3];

const Home = () => {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showPedido, setShowPedido] = useState(false);
  const touchStartX = useRef(null);
  const activeImageRef = useRef(null);

  // Carrusel automático con reset de progreso
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrent((c) => (c + 1) % images.length);
          return 0;
        }
        return prev + 2;
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Parallax con limpieza de transform al cambiar de slide
  useEffect(() => {
    // IMPORTANTE: Limpiar el estilo al cambiar de imagen para evitar "recortes" visuales
    if (activeImageRef.current) {
      activeImageRef.current.style.transform = `translate3d(0, 0, 0)`;
    }

    const handleScroll = () => {
      const offset = window.scrollY;
      // Solo aplicamos parallax si estamos cerca del top para ahorrar GPU
      if (activeImageRef.current && offset < window.innerHeight) {
        activeImageRef.current.style.transform = `translate3d(0, ${offset * 0.25}px, 0)`;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [current]); // Se dispara cada vez que la imagen activa cambia

  const handleTouchStart = (e) => (touchStartX.current = e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      setCurrent((p) => (deltaX > 0 ? (p - 1 + images.length) % images.length : (p + 1) % images.length));
      setProgress(0);
    }
  };

  return (
    <section className="home-section" id="home" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
      {/* Contenedor de Imágenes - El "Escenario" */}
      <div className="home-bg-container">
        {images.map((src, index) => (
          <img
            key={index}
            ref={index === current ? activeImageRef : null}
            src={src}
            alt="Delicious Wings"
            className={`home-bg-img ${index === current ? "active" : ""}`}
            loading={index === 0 ? "eager" : "lazy"}
          />
        ))}
      </div>

      {/* Contenido Centrado que Scrollea Normal */}
      <div className="home-main-overlay">
        <div className="home-content-wrap">
          <img src={logo} alt="Benditas Club Logo" className="home-hero-logo" />
          <button className="home-order-btn" onClick={() => setShowPedido(true)}>
            ¡Haz tu pedido en línea!
          </button>
        </div>
      </div>

      {/* Navegación Inferior */}
      <div className="home-nav-ui">
        {images.map((_, index) => (
          <div key={index} className="home-dot" onClick={() => { setCurrent(index); setProgress(0); }}>
            {index === current && <div className="home-dot-progress" style={{ width: `${progress}%` }} />}
          </div>
        ))}
      </div>

      {showPedido && <PedidoPopup onClose={() => setShowPedido(false)} />}
    </section>
  );
};

export default Home;