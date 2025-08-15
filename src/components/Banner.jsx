import "../Styles.css";

const mensajesOriginales = [
  "10% DE DESCUENTO EN PEDIDOS A DOMICILIO TODO EL MES DE AGOSTO (NO APLICA EN PROMOCIONES)",
  "10% DE DESCUENTO EN PEDIDOS A DOMICILIO TODO EL MES DE AGOSTO (NO APLICA EN PROMOCIONES)",
  "10% DE DESCUENTO EN PEDIDOS A DOMICILIO TODO EL MES DE AGOSTO (NO APLICA EN PROMOCIONES)",

];

const BannerAvisos = () => {
  // Duplicamos los mensajes para crear el efecto de loop infinito en CSS
  const mensajesDuplicados = [...mensajesOriginales, ...mensajesOriginales];

  return (
    <div className="banner-avisos">
      <div className="mensaje-slider">
        <div className="mensaje-slider-inner">
          {mensajesDuplicados.map((msg, i) => (
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