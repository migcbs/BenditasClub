// src/shared/ErrorBoundary.jsx
// Red de seguridad para pantallas que corren sin supervisión en tablets del
// restaurante (POS, cocina, admin, perfil de cliente). Sin esto, cualquier
// error de render deja la pantalla en blanco/rota sin forma de recuperarse
// salvo que alguien sepa recargar manualmente — inaceptable a mitad de
// turno. Muestra un mensaje claro y un botón para reintentar.
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('❌ Error no controlado en la interfaz:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif',
            background: '#fff8f0',
            color: '#241a20',
          }}
        >
          <h2 style={{ margin: 0 }}>Algo salió mal en esta pantalla</h2>
          <p style={{ margin: 0, color: '#6e5c66', maxWidth: 420 }}>
            {this.props.label || 'Ocurrió un error inesperado.'} Ningún pedido ni dato se perdió — solo hay que recargar.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '12px 24px',
              fontWeight: 700,
              fontSize: 16,
              color: '#fff8f0',
              background: 'linear-gradient(135deg, #d1477f, #c98a1f)',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            Recargar pantalla
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
