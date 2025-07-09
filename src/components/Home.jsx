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

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      const image = document.querySelector(".home-image.active");
      if (image) {
        image.style.transform = `translateY(${offset * 0.2}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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