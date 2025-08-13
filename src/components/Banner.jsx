import { useState, useEffect } from "react";
import "../Styles.css";

const mensajes = [
  "10% DE DESCUENTO EN PEDIDOS A DOMICILIO TODO EL MES DE AGOSTO",
  "10% DE DESCUENTO EN PEDIDOS A DOMICILIO TODO EL MES DE AGOSTO",
  "10% DE DESCUENTO EN PEDIDOS A DOMICILIO TODO EL MES DE AGOSTO",
  "10% DE DESCUENTO EN PEDIDOS A DOMICILIO TODO EL MES DE AGOSTO",
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