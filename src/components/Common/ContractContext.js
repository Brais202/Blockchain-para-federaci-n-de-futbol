import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { addresses, abis } from '../../contracts/src/contracts';

const ContractContext = createContext();

export const useContracts = () => {
    const context = useContext(ContractContext);
    if (!context) throw new Error('useContracts debe usarse dentro de ContractProvider');
    return context;
};

export const ContractProvider = ({ children }) => {
    const [provider, setProvider] = useState(null);
    const [signer, setSigner] = useState(null);
    const [fichajeContract, setFichajeContract] = useState(null);
    const [cuenta, setCuenta] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const conectarContrato = async (signerOrProvider) => {
        try {
            const contrato = new ethers.Contract(addresses.fichajes, abis.fichajes, signerOrProvider);
            setFichajeContract(contrato);
        } catch (err) { console.error("Error instanciando contrato:", err); }
    };

    const inicializar = useCallback(async () => {
        const usuarioDesconectado = localStorage.getItem('isDisconnected') === 'true';

        if (window.ethereum) {
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);

            if (!usuarioDesconectado) {
                try {
                    const accounts = await web3Provider.listAccounts();
                    if (accounts.length > 0) {
                        setCuenta(accounts[0]);
                        const web3Signer = web3Provider.getSigner();
                        setSigner(web3Signer);
                        conectarContrato(web3Signer);
                    } else {
                        conectarContrato(web3Provider);
                    }
                } catch (err) { console.error(err); }
            } else {
                conectarContrato(web3Provider);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => { inicializar(); }, [inicializar]);

    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                const usuarioDesconectado = localStorage.getItem('isDisconnected') === 'true';
                if (usuarioDesconectado && accounts.length > 0) return;

                if (accounts.length > 0) {
                    setCuenta(accounts[0]);
                    if (provider) {
                        const web3Signer = provider.getSigner();
                        setSigner(web3Signer);
                        conectarContrato(web3Signer);
                    }
                } else {
                    setCuenta('');
                    setSigner(null);
                    if (provider) conectarContrato(provider);
                }
            };

            const handleChainChanged = () => window.location.reload();
            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            return () => {
                if (window.ethereum.removeListener) {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                }
            }
        }
    }, [provider]);

    const conectarWallet = async () => {
        if (!window.ethereum) return alert("Instala MetaMask");
        try {
            setLoading(true);
            localStorage.removeItem('isDisconnected');
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            setCuenta(accounts[0]);
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);
            const web3Signer = web3Provider.getSigner();
            setSigner(web3Signer);
            conectarContrato(web3Signer);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const desconectar = () => {
        setCuenta('');
        setSigner(null);
        setFichajeContract(null);
        if (provider) conectarContrato(provider);
        localStorage.setItem('isDisconnected', 'true');
    };

    const value = { provider, signer, fichajeContract, cuenta, loading, error, conectarWallet, desconectar };

    return <ContractContext.Provider value={value}>{children}</ContractContext.Provider>;
};