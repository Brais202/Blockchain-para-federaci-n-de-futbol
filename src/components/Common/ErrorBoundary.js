import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
    
    // En producción, enviar a servicio de logging
    console.error('Error capturado por ErrorBoundary:', error, errorInfo);
  }

  reiniciarAplicacion = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h2>⚠️ Algo salió mal</h2>
            <p>La aplicación encontró un error inesperado.</p>
            
            <details className="error-details">
              <summary>Detalles técnicos (para desarrollo)</summary>
              <p>{this.state.error && this.state.error.toString()}</p>
              <pre>{this.state.errorInfo.componentStack}</pre>
            </details>

            <div className="error-actions">
              <button onClick={this.reiniciarAplicacion} className="btn-primary">
                🔄 Reiniciar Aplicación
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="btn-secondary"
              >
                🏠 Ir al Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
