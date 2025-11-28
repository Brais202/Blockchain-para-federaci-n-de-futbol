import React, { createContext, useContext, useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { addresses, abis } from '../../contracts';

const ContractContext = createContext();

export const useContracts = () => {
  const context = useContext(ContractContext);
  if (!context) {
    throw new Error('useContracts debe usarse dentro de ContractProvider');
  }
  return context;
};

export const ContractProvider = ({ children }) => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [fichajeContract, setFichajeContract] = useState(null);
  const [cuenta, setCuenta] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    inicializarContracts();
  }, []);

  const inicializarContracts = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask no detectado');
      }

      // Configurar provider y signer
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      setProvider(web3Provider);

      // Obtener cuenta conectada
      const accounts = await web3Provider.listAccounts();
      if (accounts.length > 0) {
        setCuenta(accounts[0]);
        const web3Signer = web3Provider.getSigner();
        setSigner(web3Signer);
      }

      // Instanciar contratos
      const contratoFichajes = new ethers.Contract(
        addresses.fichajes,
        abis.fichajes,
        web3Provider
      );
      setFichajeContract(contratoFichajes);

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const conectarWallet = async () => {
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      await inicializarContracts();
    } catch (err) {
      setError('Error conectando wallet: ' + err.message);
    }
  };

  const value = {
    provider,
    signer,
    fichajeContract,
    cuenta,
    loading,
    error,
    conectarWallet,
    reinicializar: inicializarContracts
  };

  return (
    <ContractContext.Provider value={value}>
      {children}
    </ContractContext.Provider>
  );
};
