import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { addresses, abis } from '../../contracts';

const Header = () => {
  const [cuenta, setCuenta] = useState('');
  const [esFederacion, setEsFederacion] = useState(false);
  const [balance, setBalance] = useState('0');
  const location = useLocation();

  useEffect(() => {
    conectarWallet();
  }, []);

  const obtenerContratoFichajes = async (provider) => {
    return new ethers.Contract(addresses.fichajes, abis.fichajes, provider);
  };

  const conectarWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ 
          method: 'eth_requestAccounts' 
        });
        setCuenta(accounts[0]);
        
        // Verificar si es federación
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const contratoFichajes = await obtenerContratoFichajes(provider);
        const direccionFederacion = await contratoFichajes.federacion();
        
        setEsFederacion(accounts[0].toLowerCase() === direccionFederacion.toLowerCase());
        
        // Obtener balance
        const balanceWei = await provider.getBalance(accounts[0]);
        setBalance(ethers.utils.formatEther(balanceWei).substring(0, 6));
        
      } catch (error) {
        console.error("Error conectando wallet:", error);
      }
    }
  };

  const desconectarWallet = () => {
    setCuenta('');
    setEsFederacion(false);
    setBalance('0');
  };

  return (
    <header className="app-header">
      <div className="header-content">
        {/* Logo y Título */}
        <div className="header-brand">
          <Link to="/" className="brand-link">
            <span className="logo">⚽</span>
            <h1 className="app-title">Sistema de Fichajes - RFEF</h1>
          </Link>
        </div>

        {/* Navegación */}
        <nav className="header-nav">
          <Link 
            to="/club" 
            className={`nav-link ${location.pathname === '/club' ? 'active' : ''}`}
          >
            🏠 Panel del Club
          </Link>
          
          {esFederacion && (
            <Link 
              to="/federacion" 
              className={`nav-link ${location.pathname === '/federacion' ? 'active' : ''}`}
            >
              🏛️ Panel Federación
            </Link>
          )}
        </nav>

        {/* Información de Wallet */}
        <div className="wallet-info">
          {cuenta ? (
            <div className="connected-wallet">
              <div className="wallet-details">
                <span className="balance">{balance} ETH</span>
                <span className="address">
                  {cuenta.substring(0, 6)}...{cuenta.substring(38)}
                </span>
                {esFederacion && (
                  <span className="federation-badge">Federación</span>
                )}
              </div>
              <button 
                onClick={desconectarWallet}
                className="disconnect-btn"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <button onClick={conectarWallet} className="connect-btn">
              🔗 Conectar Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;