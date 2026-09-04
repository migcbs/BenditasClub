import './AmbientStars.css';

// Fondo de estrellas fijo detrás de toda la landing — mismo efecto que el
// portafolio (capa con radial-gradients apilados que forman puntitos, con
// un drift lento), pero en negro en vez de blanco porque aquí el fondo base
// es crema (#fff8f0), no negro. z-index negativo: queda detrás de todo el
// contenido, y solo se asoma en las secciones sin fondo propio opaco
// (Hero de foto y Footer negro lo tapan por completo, que es lo esperado).
const AmbientStars = () => (
  <div className="ambient-bg" aria-hidden="true">
    <div className="ambient-bg-stars" />
  </div>
);

export default AmbientStars;
