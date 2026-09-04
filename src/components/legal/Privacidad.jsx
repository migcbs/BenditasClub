import { useDocumentMeta } from '../../shared/useDocumentMeta';
import './Legal.css';

const HOY = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

const Privacidad = () => {
  useDocumentMeta({
    title: 'Aviso de privacidad | Benditas Club',
    description: 'Cómo Benditas Club protege y usa tus datos personales al crear una cuenta o hacer un pedido en línea.',
  });
  return (
  <main className="legal-page">
    <article className="legal-card">
      <span className="customer-kicker">Benditas Club</span>
      <h1>Aviso de privacidad</h1>
      <p className="legal-updated">Última actualización: {HOY}</p>

      <p>
        Benditas Club ("nosotros"), con sucursales en Xico y Coatepec, Veracruz, es responsable
        del tratamiento de tus datos personales conforme a la Ley Federal de Protección de Datos
        Personales en Posesión de los Particulares.
      </p>

      <h2>1. Datos que recabamos</h2>
      <ul>
        <li>Datos de contacto: nombre, teléfono y correo electrónico.</li>
        <li>Dirección(es) que guardes en tu cuenta para pedidos a domicilio.</li>
        <li>Historial de pedidos y datos de tu tarjeta de fidelidad.</li>
        <li>Contraseña (almacenada siempre cifrada, nunca en texto plano).</li>
      </ul>
      <p>No solicitamos ni almacenamos datos de tarjetas bancarias — el pago se hace en sucursal.</p>

      <h2>2. Para qué usamos tus datos</h2>
      <ul>
        <li>Procesar y dar seguimiento a tus pedidos (Recepción, cocina y caja de la sucursal correspondiente).</li>
        <li>Contactarte sobre el estado de un pedido.</li>
        <li>Operar tu cuenta y tu tarjeta de fidelidad.</li>
        <li>Mejorar el servicio (por ejemplo, estadísticas internas de ventas — nunca compartidas con terceros).</li>
      </ul>

      <h2>3. Con quién compartimos tus datos</h2>
      <p>
        Solo con el personal de la sucursal (recepción, cocina, caja) necesario para preparar y
        entregar tu pedido. No vendemos ni rentamos tus datos a terceros.
      </p>

      <h2>4. Cookies</h2>
      <p>
        Usamos almacenamiento local del navegador para mantener tu sesión iniciada y recordar tus
        preferencias del carrito de pedido. No usamos cookies de publicidad ni de rastreo de
        terceros. Puedes borrar esta información desde la configuración de tu navegador en
        cualquier momento; si lo haces, tendrás que iniciar sesión de nuevo.
      </p>

      <h2>5. Tus derechos (ARCO)</h2>
      <p>
        Puedes Acceder, Rectificar, Cancelar tus datos, u Oponerte a su uso, en cualquier momento:
        edita tu nombre, teléfono y direcciones directamente desde tu perfil, o escríbenos a{' '}
        <a href="mailto:benditasclub@gmail.com">benditasclub@gmail.com</a> para solicitar la
        eliminación completa de tu cuenta.
      </p>

      <h2>6. Cambios a este aviso</h2>
      <p>
        Si actualizamos este aviso de forma relevante, lo publicaremos en esta misma página con
        una nueva fecha de actualización.
      </p>

      <div className="legal-disclaimer">
        Este texto es una plantilla general de aviso de privacidad para un negocio en México y no
        sustituye asesoría legal. Se recomienda que un abogado lo revise y ajuste antes de
        considerarlo definitivo.
      </div>
    </article>
  </main>
  );
};

export default Privacidad;
