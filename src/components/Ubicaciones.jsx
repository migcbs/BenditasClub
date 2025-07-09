import { useEffect, useRef } from 'react';
import '../Styles.css';

const Ubicaciones = () => {
  const ubicacionesRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      const section = ubicacionesRef.current;
      if (!section) return;

      const offset = window.scrollY * 0.02; // efecto sutil

      const title = section.querySelector('h3');
      const paragraphs = section.querySelectorAll('p');
      const maps = section.querySelectorAll('.mapa');

      if (title) title.style.transform = `translateY(${offset * -0.2}px)`;


      maps.forEach((map, i) => {
        map.style.transform = `translateY(${offset * 0.2}px)`;
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="ubicaciones" id="ubicaciones" ref={ubicacionesRef}>
      <h3>¿Dónde estamos?</h3>

      <div className="mapa-container">
        <div className="mapa">
          <h4>Sucursal Coatepec</h4>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.049387193714!2d-96.96353162389501!3d19.453437381830465!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85db2dc4753daab5%3A0x9e6406675e43d488!2sBenditas%20Club%20Coatepec!5e0!3m2!1ses!2smx!4v1751336478615!5m2!1ses!2smx"
            loading="lazy"
            allowFullScreen=""
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
        <div className="mapa">
          <h4>Sucursal Xico</h4>
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3762.7676879098135!2d-97.01292332389559!3d19.422440981854745!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85c4d4a890c128ad%3A0xe2a5124319451363!2sBenditas%20Club%20Xico!5e0!3m2!1ses!2smx!4v1751336444519!5m2!1ses!2smx"
            loading="lazy"
            allowFullScreen=""
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </section>
  );
};

export default Ubicaciones;