import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import {abis, addresses} from "../../contracts/src/contracts";

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

    // --- CONECTAR CONTRATO (Auxiliar) ---
    const conectarContrato = async (signerOrProvider) => {
        try {
            const contrato = new ethers.Contract(addresses.fichajes, abis.fichajes, signerOrProvider);
            setFichajeContract(contrato);
        } catch (err) { console.error("Error instanciando contrato:", err); }
    };

    // --- INICIALIZAR ---
    const inicializar = useCallback(async () => {
        // 1. Verificamos si el usuario pulsó "SALIR" explícitamente
        const usuarioDesconectado = localStorage.getItem('isDisconnected') === 'true';

        if (window.ethereum) {
            const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
            setProvider(web3Provider);

            if (!usuarioDesconectado) {
                // Solo auto-conectamos si NO se ha desconectado manualmente
                try {
                    const accounts = await web3Provider.listAccounts();
                    if (accounts.length > 0) {
                        setCuenta(accounts[0]);
                        const web3Signer = web3Provider.getSigner();
                        setSigner(web3Signer);
                        conectarContrato(web3Signer);
                    } else {
                        conectarContrato(web3Provider); // Modo lectura
                    }
                } catch (err) { console.error(err); }
            } else {
                console.log("Usuario desconectado manualmente. Iniciando en modo lectura.");
                conectarContrato(web3Provider);
            }
        }
        setLoading(false);
    }, []);

    useEffect(() => { inicializar(); }, [inicializar]);

    // --- LISTENERS DE METAMASK ---
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts) => {
                // IMPORTANTE: Si el usuario está marcado como desconectado, IGNORAMOS eventos
                // a menos que sea un evento de "login" explícito (que gestionamos en conectarWallet)
                const usuarioDesconectado = localStorage.getItem('isDisconnected') === 'true';

                if (usuarioDesconectado && accounts.length > 0) {
                    // Si el usuario estaba desconectado pero MetaMask envía cuentas,
                    // NO hacemos nada para respetar el botón de "Salir".
                    return;
                }

                if (accounts.length > 0) {
                    setCuenta(accounts[0]);
                    if (provider) {
                        const web3Signer = provider.getSigner();
                        setSigner(web3Signer);
                        conectarContrato(web3Signer);
                    }
                } else {
                    // Si accounts es [], es que se desconectó desde MetaMask
                    setCuenta('');
                    setSigner(null);
                    if (provider) conectarContrato(provider);
                }
            };

            // Recargar si cambia la red (Standard practice)
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

    // --- ACCIONES DE USUARIO ---

    const conectarWallet = async () => {
        if (!window.ethereum) return alert("Instala MetaMask");
        try {
            setLoading(true);
            // Al pulsar conectar explícitamente, borramos la marca de desconexión
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
        // 1. Limpiamos estados
        setCuenta('');
        setSigner(null);
        setFichajeContract(null); // Limpiamos contrato para forzar recarga

        // 2. Modo Lectura
        if (provider) conectarContrato(provider);

        // 3. MARCADO FUERTE DE DESCONEXIÓN
        localStorage.setItem('isDisconnected', 'true');

        // 4. (Opcional) Forzamos una recarga para limpiar cualquier estado basura de React
        // window.location.href = "/";
        // ^ Descomenta la línea de arriba si quieres ser muy agresivo y recargar la página
    };

    const value = { provider, signer, fichajeContract, cuenta, loading, error, conectarWallet, desconectar };

    return <ContractContext.Provider value={value}>{children}</ContractContext.Provider>;
};