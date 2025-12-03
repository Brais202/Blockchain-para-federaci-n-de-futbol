import React from 'react';
import { Navigate } from 'react-router-dom';
import { useContracts } from './ContractContext';
import { useRoles } from './RoleDetector';

const Home = () => {
    // 1. Obtenemos el estado global
    const { cuenta, conectarWallet } = useContracts();
    const { esFederacion, esClubAutorizado, loading } = useRoles();

    // ---------------------------------------------------------
    // LÓGICA DE REDIRECCIÓN AUTOMÁTICA
    // ---------------------------------------------------------

    // A. Si está conectado y ya sabemos sus roles (no está cargando)
    if (cuenta && !loading) {
        if (esFederacion) {
            return <Navigate to="/federacion" replace />;
        }
        if (esClubAutorizado) {
            return <Navigate to="/club" replace />;
        }
        // Si no es ninguno de los dos, dejamos que se renderice el mensaje de error abajo
    }

    // ---------------------------------------------------------
    // RENDERIZADO DE LA INTERFAZ
    // ---------------------------------------------------------

    return (
        <div className="home-container">
            <div className="home-card">

                {/* ENCABEZADO */}
                <div className="home-header">
                    <span className="logo-emoji">⚽</span>
                    <h1>Sistema de Fichajes RFEF</h1>
                    <p className="subtitle">Plataforma descentralizada de gestión deportiva</p>
                </div>

                {/* CONTENIDO VARIABLE SEGÚN ESTADO */}

                {!cuenta ? (
                    // CASO 1: NO CONECTADO
                    <div className="login-section">
                        <p>Bienvenido. Para acceder al panel de gestión de tu Club o de la Federación, es necesario conectar tu Wallet.</p>
                        <button onClick={conectarWallet} className="btn-connect-home">
                            🦊 Conectar MetaMask
                        </button>
                    </div>
                ) : loading ? (
                    // CASO 2: CARGANDO PERMISOS
                    <div className="loading-section">
                        <div className="spinner"></div>
                        <p>Verificando credenciales en la Blockchain...</p>
                    </div>
                ) : (
                    // CASO 3: CONECTADO PERO SIN ROL (ERROR)
                    <div className="error-section">
                        <div className="status-badge error">Acceso Restringido</div>
                        <h3>Cuenta no autorizada</h3>
                        <p>La dirección conectada no tiene permisos registrados:</p>
                        <code className="wallet-address">{cuenta}</code>
                        <p className="help-text">Si representas a un Club, contacta con la Federación para ser dado de alta en el Smart Contract.</p>
                    </div>
                )}

            </div>

            {/* ESTILOS INTERNOS PARA QUE SE VEA BIEN AL INSTANTE */}
            <style>{`
        .home-container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 80vh;
          background-color: #f1f5f9;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
        }

        .home-card {
          background: white;
          padding: 3rem;
          border-radius: 20px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          text-align: center;
          max-width: 500px;
          width: 100%;
          border: 1px solid #e2e8f0;
        }

        .home-header {
          margin-bottom: 2rem;
        }

        .logo-emoji {
          font-size: 4rem;
          display: block;
          margin-bottom: 1rem;
        }

        h1 {
          color: #0f172a;
          margin: 0;
          font-size: 1.8rem;
          font-weight: 700;
        }

        .subtitle {
          color: #64748b;
          margin-top: 0.5rem;
        }

        /* Botón Conectar */
        .btn-connect-home {
          background: linear-gradient(135deg, #f6851b 0%, #e2761b 100%);
          color: white;
          border: none;
          padding: 1rem 2rem;
          font-size: 1.1rem;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
          margin-top: 1.5rem;
          width: 100%;
        }

        .btn-connect-home:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(246, 133, 27, 0.3);
        }

        /* Spinner */
        .spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #3b82f6;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Error Box */
        .error-section {
          background-color: #fef2f2;
          border: 1px solid #fee2e2;
          padding: 2rem;
          border-radius: 12px;
        }

        .status-badge.error {
          background-color: #fee2e2;
          color: #991b1b;
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          display: inline-block;
          margin-bottom: 1rem;
        }

        .wallet-address {
          display: block;
          background: rgba(255,255,255,0.5);
          padding: 0.5rem;
          border-radius: 6px;
          font-family: monospace;
          word-break: break-all;
          margin: 1rem 0;
          font-size: 0.9rem;
          color: #ef4444;
        }

        .help-text {
          font-size: 0.85rem;
          color: #991b1b;
        }
      `}</style>
        </div>
    );
};

export default Home;