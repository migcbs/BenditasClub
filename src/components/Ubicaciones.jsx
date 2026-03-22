import { useEffect, useRef } from 'react';
import './Ubicaciones.css';

const Ubicaciones = () => {
  const sectionRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

      if (isVisible) {
        const speed = 0.05;
        const yPos = (window.scrollY - sectionRef.current.offsetTop) * speed;
        const maps = sectionRef.current.querySelectorAll('.mapa-card');
        
        maps.forEach((map, i) => {
          const direction = i % 2 === 0 ? 1 : -1;
          map.style.transform = `translate3d(0, ${yPos * direction}px, 0)`;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="ubicaciones-section" id="ubicaciones" ref={sectionRef}>
      <div className="ubicaciones-header">
        <h3 className="ubicaciones-title">Visítanos</h3>
        <p className="ubicaciones-tagline">Te esperamos en nuestras dos casas</p>
      </div>

      <div className="mapas-wrapper">
        {/* Sucursal Coatepec */}
        <div className="mapa-card">
          <div className="mapa-info">
            <h4>Sucursal Coatepec</h4>
            <p>Melchor Ocampo 14, Centro</p>
            <span className="horario">Abierto: 1:00 PM - 10:30 PM</span>
          </div>
          <div className="mapa-frame-container">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d316.95557164501884!2d-96.96110024255444!3d19.453418546098355!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85db2dc4753daab5%3A0x9e6406675e43d488!2sBenditas%20Club%20Coatepec!5e0!3m2!1ses!2smx!4v1771378188365!5m2!1ses!2smx"
              width="100%"
              height="100%"
              style={{ border: 0 }} // Objeto en lugar de string
              allowFullScreen={true} // camelCase y valor booleano
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade" // camelCase
              title="Sucursal Coatepec"
            ></iframe>
          </div>
        </div>

        {/* Sucursal Xico */}
        <div className="mapa-card">
          <div className="mapa-info">
            <h4>Sucursal Xico</h4>
            <p>Av. Hidalgo 212, Centro</p>
            <span className="horario">Abierto: 1:00 PM - 10:30 PM</span>
          </div>
          <div className="mapa-frame-container">
            <iframe
              // Pegamos el src del primer bloque que pusiste
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d314.64456324807566!2d-97.01060125355265!3d19.422401026136058!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85c4d4a890c128ad%3A0xe2a5124319451363!2sBenditas%20Club%20Xico!5e0!3m2!1ses!2smx!4v1771378316793!5m2!1ses!2smx"
              width="100%" // Cambiamos 600 por 100% para que sea responsivo
              height="100%" // Cambiamos 450 por 100% para que llene el contenedor
              style={{ border: 0 }} // El objeto que React sí entiende
              allowFullScreen={true} // CamelCase y booleano
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade" // CamelCase
              title="Sucursal Xico"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Ubicaciones;