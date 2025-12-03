import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ethers } from 'ethers';
import { useContracts } from './ContractContext';
import { useRoles } from './RoleDetector';
import { Menu, X, Wallet, LogOut, ChevronDown } from 'lucide-react';

const Header = () => {
    const { cuenta, conectarWallet, desconectar, provider } = useContracts();
    const { esFederacion, esClubAutorizado } = useRoles();
    const [balance, setBalance] = useState('0');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const location = useLocation();

    useEffect(() => {
        const fetchBalance = async () => {
            if (cuenta && provider) {
                try {
                    const balanceWei = await provider.getBalance(cuenta);
                    const balanceFormatted = ethers.utils.formatEther(balanceWei);
                    setBalance(parseFloat(balanceFormatted).toFixed(4));
                } catch (error) {
                    console.error("Error balance:", error);
                }
            }
        };
        fetchBalance();
    }, [cuenta, provider]);

    return (
        <>
            <style>{`
        :root {
          --header-bg: #ffffff;
          --header-text: #0f172a;
          --accent: #2563eb;
          --accent-hover: #1d4ed8;
          --border: #e2e8f0;
        }

        .app-header {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          z-index: 50;
          padding: 0 1.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        /* LOGO */
        .brand-link {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: var(--header-text);
          font-weight: 800;
          font-size: 1.25rem;
          letter-spacing: -0.025em;
        }

        .logo-icon {
          font-size: 1.5rem;
          filter: drop-shadow(0 2px 4px rgba(37, 99, 235, 0.2));
        }

        .app-title {
          background: linear-gradient(135deg, #0f172a 0%, #334155 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin: 0;
        }

        /* NAV */
        .header-nav {
          display: flex;
          gap: 2rem;
        }

        .nav-link {
          text-decoration: none;
          color: #64748b;
          font-weight: 600;
          font-size: 0.95rem;
          padding: 0.5rem 0;
          position: relative;
          transition: color 0.2s;
        }

        .nav-link:hover, .nav-link.active {
          color: var(--accent);
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 2px;
          background: var(--accent);
          border-radius: 2px;
        }

        /* WALLET */
        .wallet-section {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .wallet-pill {
          background: #f8fafc;
          border: 1px solid var(--border);
          border-radius: 99px;
          padding: 0.4rem 0.5rem 0.4rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          font-size: 0.9rem;
          transition: all 0.2s;
        }

        .wallet-pill:hover {
          border-color: #cbd5e1;
          background: #f1f5f9;
        }

        .balance {
          font-weight: 600;
          color: var(--header-text);
        }

        .address-badge {
          background: white;
          border: 1px solid var(--border);
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          color: #64748b;
          font-family: monospace;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .role-tag {
          font-size: 0.7rem;
          text-transform: uppercase;
          font-weight: 800;
          padding: 2px 6px;
          border-radius: 4px;
          margin-left: 0.5rem;
        }
        .role-fed { background: #dbeafe; color: #1e40af; }
        .role-club { background: #dcfce7; color: #166534; }

        .btn-connect, .btn-disconnect {
          border: none;
          cursor: pointer;
          font-weight: 600;
          border-radius: 10px;
          padding: 0.6rem 1.2rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-connect {
          background: var(--accent);
          color: white;
          box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
        }
        .btn-connect:hover {
          background: var(--accent-hover);
          transform: translateY(-1px);
        }

        .btn-disconnect {
          background: transparent;
          color: #ef4444;
          padding: 0.5rem;
        }
        .btn-disconnect:hover {
          background: #fef2f2;
        }

        @media (max-width: 768px) {
          .header-nav, .wallet-info { display: none; }
          .mobile-menu-btn { display: block; }
        }
      `}</style>

            <header className="app-header">
                <div className="header-content">
                    <Link to="/" className="brand-link">
                        <span className="logo-icon">⚽</span>
                        <h1 className="app-title">RFEF <span style={{fontWeight:400, opacity:0.7}}>Fichajes</span></h1>
                    </Link>

                    {cuenta && (
                        <nav className="header-nav">
                            {esClubAutorizado && (
                                <Link to="/club" className={`nav-link ${location.pathname.includes('/club') ? 'active' : ''}`}>
                                    Panel Club
                                </Link>
                            )}
                            {esFederacion && (
                                <Link to="/federacion" className={`nav-link ${location.pathname.includes('/federacion') ? 'active' : ''}`}>
                                    Panel Federación
                                </Link>
                            )}
                        </nav>
                    )}

                    <div className="wallet-section">
                        {!cuenta ? (
                            <button onClick={conectarWallet} className="btn-connect">
                                <Wallet size={18} /> Conectar Wallet
                            </button>
                        ) : (
                            <div className="wallet-pill">
                                <span style={{fontWeight:600}}>{balance} ETH</span>
                                <span style={{fontFamily:'monospace', color:'#64748b'}}>
                                    {cuenta.substring(0,6)}...{cuenta.substring(38)}
                                </span>

                                {/* ESTE ES EL BOTÓN IMPORTANTE */}
                                <button
                                    onClick={() => {
                                        console.log("Click en desconectar"); // Debug
                                        desconectar();
                                    }}
                                    className="btn-disconnect"
                                    title="Salir"
                                >
                                    <LogOut size={18}/>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
};

export default Header;