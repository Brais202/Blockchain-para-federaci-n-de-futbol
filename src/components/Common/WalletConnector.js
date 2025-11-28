import React, { useState } from 'react';
import { useContracts } from './ContractContext';
import './WalletConnector.css';

const WalletConnector = () => {
  const { cuenta, conectarWallet, loading, error } = useContracts();
  const [mostrarModal, setMostrarModal] = useState(false);

  const manejarConexion = async () => {
    if (!cuenta) {
      await conectarWallet();
    }
    setMostrarModal(false);
  };

  if (loading) {
    return (
      <div className="wallet-connector loading">
        <div className="spinner"></div>
        <span>Conectando...</span>
      </div>
    );
  }

  return (
    <div className="wallet-connector">
      {error && (
        <div className="error-banner">
          ⚠️ {error}
          <button onClick={conectarWallet}>Reintentar</button>
        </div>
      )}

      {!cuenta ? (
        <button 
          onClick={manejarConexion}
          className="connect-wallet-btn"
        >
          🔗 Conectar Wallet
        </button>
      ) : (
        <div className="wallet-connected">
          <div className="wallet-indicator">
            <div className="connection-dot"></div>
            <span>Conectado</span>
          </div>
          <div className="wallet-address">
            {cuenta.substring(0, 8)}...{cuenta.substring(36)}
          </div>
        </div>
      )}

      {mostrarModal && (
        <div className="wallet-modal">
          <div className="modal-content">
            <h3>Conectar Wallet</h3>
            <p>Para usar la aplicación, necesitas conectar tu wallet de MetaMask</p>
            <button onClick={manejarConexion}>
              Conectar MetaMask
            </button>
            <button onClick={() => setMostrarModal(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnector;
