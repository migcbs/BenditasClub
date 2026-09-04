import { useDocumentMeta } from '../../shared/useDocumentMeta';
import './Legal.css';

const HOY = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

const Terminos = () => {
  useDocumentMeta({
    title: 'Términos y condiciones | Benditas Club',
    description: 'Términos y condiciones de uso y pedidos en línea de Benditas Club, Xico y Coatepec, Veracruz.',
  });
  return (
  <main className="legal-page">
    <article className="legal-card">
      <span className="customer-kicker">Benditas Club</span>
      <h1>Términos y condiciones</h1>
      <p className="legal-updated">Última actualización: {HOY}</p>

      <h2>1. Sobre este sitio</h2>
      <p>
        Este sitio (benditasclub.mx) es operado por Benditas Club, con sucursales en Xico y
        Coatepec, Veracruz. Al usar el sitio para consultar el menú, crear una cuenta o hacer un
        pedido en línea, aceptas estos términos.
      </p>

      <h2>2. Pedidos en línea</h2>
      <ul>
        <li>Los precios, promociones y disponibilidad del menú pueden cambiar sin previo aviso.</li>
        <li>Un pedido enviado a través del sitio no se considera confirmado hasta que la sucursal correspondiente lo acepta (verás su estado como "en revisión" mientras tanto).</li>
        <li>La sucursal puede rechazar un pedido (por ejemplo, fuera de horario, zona de entrega no cubierta o falta de disponibilidad) — en ese caso se te indicará el motivo y no se te realizará ningún cobro por ese pedido.</li>
        <li>El pago se realiza directamente en sucursal o al momento de la entrega, según el método que ahí se ofrezca.</li>
        <li>Los tiempos de entrega/preparación son estimados y pueden variar según la demanda.</li>
      </ul>

      <h2>3. Cuentas de cliente</h2>
      <p>
        Eres responsable de mantener la confidencialidad de tu contraseña y de la actividad que
        ocurra en tu cuenta. Puedes usar el sitio para pedir sin crear una cuenta; crear una te
        permite guardar tus datos de contacto, direcciones y ver tu historial de pedidos y tarjeta
        de fidelidad.
      </p>

      <h2>4. Programa de fidelidad</h2>
      <p>
        Las recompensas y sellos de la tarjeta de fidelidad son definidos y pueden ser modificados
        por el restaurante en cualquier momento. Las recompensas no son transferibles ni
        canjeables por efectivo.
      </p>

      <h2>5. Uso aceptable</h2>
      <p>
        No debes usar el sitio para enviar información falsa, intentar acceder a cuentas de
        otras personas, ni interferir con su funcionamiento normal.
      </p>

      <h2>6. Contacto</h2>
      <p>
        Dudas o aclaraciones sobre un pedido o tu cuenta:{' '}
        <a href="mailto:benditasclub@gmail.com">benditasclub@gmail.com</a> o por WhatsApp a la
        sucursal correspondiente.
      </p>

      <div className="legal-disclaimer">
        Este texto es una plantilla general para un negocio de pedidos en línea en México y no
        sustituye asesoría legal. Se recomienda que un abogado lo revise y ajuste antes de
        considerarlo definitivo.
      </div>
    </article>
  </main>
  );
};

export default Terminos;
