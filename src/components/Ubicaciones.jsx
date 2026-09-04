import { Clock, MapPin } from 'lucide-react';
import './Ubicaciones.css';

const SUCURSALES = [
  {
    nombre: 'Sucursal Coatepec',
    direccion: 'Melchor Ocampo 14, Centro',
    horario: 'Abierto: 2:00 PM - 10:30 PM',
    src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d316.95557164501884!2d-96.96110024255444!3d19.453418546098355!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85db2dc4753daab5%3A0x9e6406675e43d488!2sBenditas%20Club%20Coatepec!5e0!3m2!1ses!2smx!4v1771378188365!5m2!1ses!2smx',
  },
  {
    nombre: 'Sucursal Xico',
    direccion: 'Av. Hidalgo 212, Centro',
    horario: 'Abierto: 2:00 PM - 10:30 PM',
    src: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d314.64456324807566!2d-97.01060125355265!3d19.422401026136058!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x85c4d4a890c128ad%3A0xe2a5124319451363!2sBenditas%20Club%20Xico!5e0!3m2!1ses!2smx!4v1771378316793!5m2!1ses!2smx',
  },
];

const Ubicaciones = () => {
  return (
    <section className="ubicaciones-section" id="ubicaciones">
      <div className="ubicaciones-header">
        <h2 className="ubicaciones-title">Visítanos</h2>
        <p className="ubicaciones-tagline">Te esperamos en nuestras dos casas</p>
      </div>

      <div className="mapas-wrapper">
        {SUCURSALES.map((s) => (
          <div className="mapa-card" key={s.nombre}>
            <div className="mapa-info">
              <h4>
                <MapPin size={18} />
                {s.nombre}
              </h4>
              <p>{s.direccion}</p>
              <span className="horario">
                <Clock size={13} />
                {s.horario}
              </span>
            </div>
            <div className="mapa-frame-container">
              <iframe
                src={s.src}
                width="100%"
                height="100%"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={s.nombre}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Ubicaciones;
