import { useState, useEffect, useRef } from "react";
import img1 from "../assets/1.jpg";
import img2 from "../assets/2.jpg";
import img3 from "../assets/3.jpg";
import logo from "../assets/logo.png";
import PedidoPopup from "./PedidoPopup";
import "../Styles.css";

const images = [img1, img2, img3];

const Home = () => {
  const [current, setCurrent] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showPedido, setShowPedido] = useState(false);
  const touchStartX = useRef(null);

  // Efecto para el carrusel automático con barra de progreso
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

  const goToSlide = (index) => {
    setCurrent(index);
    setProgress(0);
  };

  // Manejadores para el control del carrusel por touch
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 50)
      setCurrent((prev) => (prev - 1 + images.length) % images.length);
    else if (deltaX < -50)
      setCurrent((prev) => (prev + 1) % images.length);
    setProgress(0);
  };

  // Efecto para el paralaje en el scroll
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY; // Obtiene la posición actual de scroll
      const image = document.querySelector(".home-image.active"); // Selecciona la imagen activa
      if (image) {
        // Aplica la transformación translateY basada en el scroll
        image.style.transform = `translateY(${offset * 0.2}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll); // Agrega el listener de scroll
    
    // --- ADECUACIÓN CLAVE AQUÍ ---
    // Ejecuta handleScroll una vez al montar el componente.
    // Esto asegura que la imagen se posicione correctamente desde el inicio,
    // incluso si la página ya tiene un desplazamiento inicial.
    handleScroll(); 
    // --- FIN DE ADECUACIÓN ---

    return () => window.removeEventListener("scroll", handleScroll); // Limpia el listener al desmontar
  }, []); // El array de dependencias vacío asegura que este efecto se ejecute solo una vez al montar

  return (
    <>
      <section
        className="home"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        id="home"
      >
        <div className="home-images">
          {images.map((src, index) => (
            <img
              key={index}
              src={src}
              alt={`Home ${index}`}
              className={`home-image ${index === current ? "active" : ""}`}
            />
          ))}
        </div>

        <div className="home-overlay">
          <img
            src={logo}
            alt="Restaurante Delicioso Logo"
            className="home-logo"
          />
          <button className="order-button" onClick={() => setShowPedido(true)}>
            ¡Haz tu pedido en línea!
          </button>
        </div>

        <div className="home-indicators">
          {images.map((_, index) => (
            <div
              key={index}
              className={`indicator ${index === current ? "active" : ""}`}
              onClick={() => goToSlide(index)}
            >
              {index === current && (
                <div className="progress" style={{ width: `${progress}%` }} />
              )}
            </div>
          ))}
        </div>
      </section>

      {showPedido && <PedidoPopup onClose={() => setShowPedido(false)} />}
    </>
  );
};

export default Home;