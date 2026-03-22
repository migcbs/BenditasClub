import "./Banner.css";

const BannerAvisos = () => {
  // Con 6-8 veces es suficiente para llenar el ancho y que el loop no se note
  const mensaje = "alitas n' more";
  const items = Array(15).fill(mensaje); 

  return (
    <div className="banner-container">
      <div className="banner-track">
        {/* Renderizamos dos grupos iguales para el loop infinito */}
        <div className="banner-group">
          {items.map((msg, i) => (
            <span key={`a-${i}`} className="banner-text">
              {msg}
            </span>
          ))}
        </div>
        <div className="banner-group" aria-hidden="true">
          {items.map((msg, i) => (
            <span key={`b-${i}`} className="banner-text">
              {msg}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerAvisos;