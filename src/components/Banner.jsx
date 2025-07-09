import { useState, useEffect } from "react";
import "../Styles.css";

const mensajes = [
  "10% de descuento en pedidos a domicilio",
  "Envío gratis en órdenes mayores a $500",
  "¡Nuevo menú de temporada disponible ya!",
];

const BannerAvisos = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % mensajes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="banner-avisos">
      <div className="mensaje-slider">
        <div
          className="mensaje-slider-inner"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {mensajes.map((msg, i) => (
            <p key={i} className="mensaje-horizontal">
              {msg}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerAvisos;