import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Actualiza el estado para que el siguiente renderizado muestre la UI alternativa
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary atrapó un error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '2rem',
                    margin: '2rem',
                    border: '1px solid #f87171',
                    backgroundColor: '#fef2f2',
                    borderRadius: '12px',
                    color: '#991b1b',
                    fontFamily: 'sans-serif'
                }}>
                    <h2>¡Vaya! Algo salió mal.</h2>
                    <p>La aplicación ha encontrado un error inesperado.</p>

                    <details style={{ whiteSpace: 'pre-wrap', marginTop: '1rem', cursor: 'pointer' }}>
                        <summary>Ver detalles técnicos del error</summary>
                        <div style={{ marginTop: '10px', fontSize: '0.85rem', fontFamily: 'monospace', background: 'rgba(0,0,0,0.05)', padding: '10px', borderRadius: '6px' }}>
                            <p style={{fontWeight: 'bold', color: '#dc2626'}}>
                                {this.state.error && this.state.error.toString()}
                            </p>
                            <br />
                            {this.state.errorInfo?.componentStack}
                        </div>
                    </details>

                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            marginTop: '1.5rem',
                            padding: '0.75rem 1.5rem',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Recargar Página
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;