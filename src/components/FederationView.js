import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from "ethers";
import { Navigate } from 'react-router-dom';
import { useContracts } from './Common/ContractContext';
import { Building2, Users, Activity, Lock, ShieldAlert, CheckCircle, Search, ArrowRightLeft, FileSearch, KeyRound, Copy } from 'lucide-react';
import EthCrypto from 'eth-crypto';
// Importamos las funciones de nuestro servicio IPFS
import { obtenerArchivoIPFS } from '../utils/ipfsService';


const FederationView = () => {
    const { fichajeContract, cuenta, provider } = useContracts();

    // Estados
    const [clubs, setClubs] = useState([]);
    const [nuevoClub, setNuevoClub] = useState({ direccion: "", nombre: "" });
    const [estadisticas, setEstadisticas] = useState({
        totalFichajes: 0,
        totalClubs: 0,
        fondosEnEscrow: "0.0"
    });
    const [fichajesPendientes, setFichajesPendientes] = useState([]);
    const [loading, setLoading] = useState(false);

    // --- ESTADOS PARA CRIPTOGRAFÍA ---
    const [federationKeys, setFederationKeys] = useState({ publicKey: '', privateKey: '' });
    const [privateKeyInput, setPrivateKeyInput] = useState('');
    const [decryptionStatus, setDecryptionStatus] = useState('');


    const cargarDatos = useCallback(async () => {
        if (!fichajeContract) return;
        setLoading(true);

        try {
            // Cargar Clubs desde el array público del contrato
            const clubsAddressList = await fichajeContract.clubsRegistrados();
            const clubsEncontrados = [];
            for (const dir of clubsAddressList) {
                const info = await fichajeContract.clubs(dir);
                if (info.nombre) {
                    clubsEncontrados.push({ direccion: dir, nombre: info.nombre, autorizado: info.autorizado });
                }
            }
            setClubs(clubsEncontrados);

            // Cargar Fichajes
            const totalFichajesBN = await fichajeContract.totalFichajes();
            const totalFichajes = totalFichajesBN.toNumber();

            // Cargar Fichajes Pendientes
            const pendientesArray = [];
            for (let i = 1; i <= totalFichajes; i++) {
                const f = await fichajeContract.fichajes(i);
                if (!f.aprobado) {
                    const origenInfo = await fichajeContract.clubs(f.clubes.clubOrigen);
                    const destinoInfo = await fichajeContract.clubs(f.clubes.clubDestino);
                    pendientesArray.push({
                        id: i,
                        jugador: f.jugador.nombreJugador,
                        origen: origenInfo.nombre || f.clubes.clubOrigen.slice(0, 6),
                        destino: destinoInfo.nombre || f.clubes.clubDestino.slice(0, 6),
                        valor: ethers.utils.formatEther(f.valorTransferencia),
                        ipfsHash: f.ipfsHash,
                        firmas: f.firmas,
                    });
                }
            }
            setFichajesPendientes(pendientesArray.reverse());

            // Estadísticas
            const balance = await provider.getBalance(fichajeContract.address);
            setEstadisticas({
                totalFichajes,
                totalClubs: clubsEncontrados.length,
                fondosEnEscrow: parseFloat(ethers.utils.formatEther(balance)).toFixed(4)
            });

        } catch (error) { console.error("Error cargando datos: ", error); }
        finally { setLoading(false); }
    }, [fichajeContract, provider]);


    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    // --- ACCIONES ---

    const autorizarClub = async () => {
        if (!fichajeContract || !provider) return;
        try {
            const signer = fichajeContract.connect(provider.getSigner());
            const tx = await signer.autorizarClub(nuevoClub.direccion, nuevoClub.nombre);
            await tx.wait();
            alert("✅ Club autorizado");
            setNuevoClub({ direccion: "", nombre: "" });
            cargarDatos();
        } catch (error) { alert("Error: " + (error.reason || error.message)); }
    };

    const desautorizarClub = async (direccion) => {
        if (!fichajeContract || !provider) return;
        if (!window.confirm(`¿Revocar licencia a ${direccion}?`)) return;
        try {
            const signer = fichajeContract.connect(provider.getSigner());
            const tx = await signer.desautorizarClub(direccion);
            await tx.wait();
            alert("🚫 Licencia revocada");
            cargarDatos();
        } catch (error) { alert("Error: " + (error.reason || error.message)); }
    };


    // --- LÓGICA DE CIFRADO ---

    const handleGenerateKeys = () => {
        const identity = EthCrypto.createIdentity();
        setFederationKeys(identity);
        setPrivateKeyInput(identity.privateKey); // Pre-rellenar para facilidad
        alert('Se han generado nuevas claves. Guarda la clave privada en un lugar muy seguro y copia la pública en src/config.js');
    };

    const handleVerDocs = async (ipfsHash) => {
        if (!ipfsHash) return alert("⚠️ No hay documento adjunto a este fichaje.");
        if (!privateKeyInput) return alert("❌ Debes pegar tu clave privada de la federación para descifrar el documento.");

        setDecryptionStatus(`Descargando de IPFS...`);
        try {
            // 1. Descargar el contenido cifrado de IPFS
            const encryptedBuffer = await obtenerArchivoIPFS(ipfsHash);
            const encryptedString = new TextDecoder().decode(encryptedBuffer);
            const encryptedObject = EthCrypto.cipher.parse(encryptedString);

            setDecryptionStatus('Descifrando documento...');

            // 2. Descifrar con la clave privada
            const decryptedPayload = await EthCrypto.decryptWithPrivateKey(privateKeyInput, encryptedObject);
            const decryptedBuffer = Buffer.from(decryptedPayload, 'hex');

            setDecryptionStatus('¡Éxito! Mostrando PDF...');

            // 3. Mostrar el PDF
            const blob = new Blob([decryptedBuffer], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
            
            setTimeout(() => setDecryptionStatus(''), 3000);

        } catch (error) {
            console.error('Error en el proceso de descifrado:', error);
            const errorMessage = `Error descifrando: ${error.message}. ¿Es la clave privada correcta?`;
            setDecryptionStatus(errorMessage);
            alert(errorMessage);
        }
    };


    if (!cuenta) return <Navigate to="/" replace />;

    return (
        <div className="premium-dashboard">
            <style>{`
        :root { --bg-fed: #f8fafc; --text-dark: #0f172a; --text-gray: #64748b; }
        .premium-dashboard { max-width: 1400px; margin: 0 auto; padding: 2rem; font-family: 'Inter', sans-serif; background: var(--bg-fed); min-height: 100vh; color: var(--text-dark); }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .icon-box { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; }
        .bg-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .bg-orange { background: linear-gradient(135deg, #f97316, #ea580c); }
        .bg-indigo { background: linear-gradient(135deg, #6366f1, #4f46e5); }
        .stat-content h3 { font-size: 1.8rem; font-weight: 800; margin: 0; line-height: 1; }
        .stat-content p { margin: 0; font-size: 0.85rem; color: var(--text-gray); font-weight: 600; text-transform: uppercase; }

        .dashboard-grid { display: grid; grid-template-columns: 1fr 1.2fr 0.8fr; gap: 2rem; }
        .card-panel { background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 1.5rem; }
        .card-header { display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; }
        .card-header h2 { margin: 0; font-size: 1.25rem; color: #1e293b; }
        .styled-input { width: 100%; padding: 0.9rem; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; margin-bottom: 0.5rem; }
        .key-input { font-family: monospace; font-size: 0.8rem; }
        .btn-action { width: 100%; padding: 0.8rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; }
        .btn-success { background: #10b981; color: white; margin-top: 0.5rem; }
        .btn-danger { background: #fee2e2; color: #ef4444; padding: 0.4rem 0.8rem; font-size: 0.8rem; }
        .btn-secondary { background: #e2e8f0; color: #1e293b; }
        .club-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0.5rem; border-bottom: 1px solid #f1f5f9; }
        .status-badge { padding: 4px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; margin-right: 0.5rem; }
        .auth { background: #dcfce7; color: #166534; }
        .no-auth { background: #fee2e2; color: #991b1b; }
        .pending-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; background: #f8fafc; }
        .transfer-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .transfer-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-gray); }
        .btn-docs { background: white; border: 1px solid #cbd5e1; color: #2563eb; font-weight: 600; flex:1; padding: 0.5rem; border-radius: 8px;}
        .btn-docs:hover { background: #eff6ff; border-color: #60a5fa; }
        .btn-docs:disabled { background: #f1f5f9; color: #94a3b8; border-color: #e2e8f0; cursor: not-allowed;}
        .key-display { word-break: break-all; background: #f1f5f9; padding: 0.5rem; border-radius: 6px; font-family: monospace; font-size: 0.8rem; margin-bottom: 0.5rem; position: relative; }
        .copy-btn { position: absolute; top: 5px; right: 5px; background: white; border: 1px solid #e2e8f0; cursor: pointer; padding: 2px; border-radius: 4px; }
        @media (max-width: 1200px) { .dashboard-grid { grid-template-columns: 1fr 1fr; } .crypto-panel { grid-column: 1 / -1; } }
        @media (max-width: 768px) { .dashboard-grid { grid-template-columns: 1fr; } }
      `}</style>

            <div style={{marginBottom:'2rem'}}>
                <h1 style={{fontSize:'2rem', fontWeight:800, color:'#1e3a8a', margin:'0 0 0.5rem 0'}}>Panel RFEF</h1>
                <p style={{color:'#64748b', margin:0}}>Administración, Cifrado y Control Financiero</p>
            </div>

            <div className="stats-grid">
                 <div className="stat-card">
                    <div className="icon-box bg-blue"><Building2 /></div>
                    <div className="stat-content"><p>Clubs Autorizados</p><h3>{estadisticas.totalClubs}</h3></div>
                </div>
                <div className="stat-card">
                    <div className="icon-box bg-orange"><Activity /></div>
                    <div className="stat-content"><p>Fichajes Registrados</p><h3>{estadisticas.totalFichajes}</h3></div>
                </div>
                <div className="stat-card">
                    <div className="icon-box bg-indigo"><Lock /></div>
                    <div className="stat-content"><p>Fondos Custodia</p><h3>{estadisticas.fondosEnEscrow} ETH</h3></div>
                </div>
            </div>

            <div className="dashboard-grid">
                
                {/* COLUMNA 1: PANEL DE CRIPTOGRAFÍA */}
                <div className="card-panel crypto-panel">
                    <div className="card-header"><KeyRound className="text-amber-600"/> <h2>Criptografía y Descifrado</h2></div>

                    <div>
                        <h4 style={{marginTop:0}}>Clave Privada (Para Descifrar)</h4>
                        <p style={{fontSize: '0.8rem', color: '#ef4444', marginTop: 0}}>⚠️ Pega aquí tu clave privada para poder ver los documentos. NO se guarda, úsala solo cuando la necesites.</p>
                        <input
                            type="password"
                            className="styled-input key-input"
                            placeholder="Pega tu clave privada (0x...)"
                            value={privateKeyInput}
                            onChange={e => setPrivateKeyInput(e.target.value)}
                        />
                        <p style={{textAlign: 'center', fontStyle: 'italic', fontSize: '0.9rem', color: '#3b82f6', minHeight: '1.2em'}}>{decryptionStatus}</p>
                    </div>

                    <div style={{borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem'}}>
                        <h4 style={{marginTop:0}}>Generador de Claves (Solo para la primera vez)</h4>
                         <p style={{fontSize: '0.9rem', color: 'var(--text-gray)', marginTop: 0}}>Si aún no tienes claves, genera un par. Guarda la privada en un lugar seguro y pon la pública en el archivo `src/config.js`.</p>
                        <button className="btn-action btn-secondary" onClick={handleGenerateKeys}>Generar Nuevo Par de Claves</button>
                        
                        {federationKeys.publicKey && (
                            <div style={{marginTop: '1.5rem', background: '#fffbeb', padding: '1rem', borderRadius: '12px', border: '1px solid #fde68a'}}>
                               <h5 style={{marginTop:0, color:'#b45309'}}>Claves Generadas (¡Guarda esto de forma segura!)</h5>
                               <p style={{fontWeight:600, fontSize:'0.8rem'}}>Pública (para `config.js`):</p>
                               <div className="key-display">{federationKeys.publicKey} <button className="copy-btn" onClick={() => navigator.clipboard.writeText(federationKeys.publicKey)}><Copy size={12}/></button></div>
                               <p style={{fontWeight:600, fontSize:'0.8rem', color:'#991b1b'}}>PRIVADA (¡GUARDAR Y NO COMPARTIR!):</p>
                               <div className="key-display" style={{background:'#fee2e2'}}>{federationKeys.privateKey} <button className="copy-btn" onClick={() => navigator.clipboard.writeText(federationKeys.privateKey)}><Copy size={12}/></button></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* COLUMNA 2: GESTIÓN CLUBS */}
                <div className="card-panel">
                    <div className="card-header"><Users className="text-blue-600"/> <h2>Gestión de Licencias</h2></div>
                     <div style={{background:'#f1f5f9', padding:'1.5rem', borderRadius:'16px'}}>
                        <h4 style={{marginTop:0, marginBottom:'1rem'}}>Alta de Nuevo Club</h4>
                        <input className="styled-input" placeholder="Dirección Wallet (0x...)" value={nuevoClub.direccion} onChange={e=>setNuevoClub({...nuevoClub, direccion:e.target.value})} />
                        <input className="styled-input" placeholder="Nombre Oficial Club" value={nuevoClub.nombre} onChange={e=>setNuevoClub({...nuevoClub, nombre:e.target.value})} />
                        <button className="btn-action btn-success" onClick={autorizarClub}><CheckCircle size={18}/> Autorizar Licencia</button>
                    </div>
                     <div>
                        <h4 style={{marginBottom:'1rem'}}>Clubs Registrados</h4>
                        <div style={{maxHeight:'300px', overflowY:'auto', paddingRight:'0.5rem'}}>
                            {clubs.map((c, i) => (
                                <div key={i} className="club-item">
                                    <div>
                                        <strong style={{display:'block', color:'#0f172a'}}>{c.nombre}</strong>
                                        <span style={{fontFamily:'monospace', fontSize:'0.8rem', color:'#64748b'}}>{c.direccion.substring(0,14)}...</span>
                                    </div>
                                    <div style={{display:'flex', alignItems:'center'}}>
                                        <span className={`status-badge ${c.autorizado ? 'auth' : 'no-auth'}`}>{c.autorizado ? 'ACTIVO' : 'BAJA'}</span>
                                        {c.autorizado && <button className="btn-action btn-danger" onClick={()=>desautorizarClub(c.direccion)}><ShieldAlert size={14}/></button>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* COLUMNA 3: SUPERVISIÓN */}
                <div className="card-panel">
                    <div className="card-header"><Search color="#f97316"/> <h2>Fichajes en Curso</h2></div>
                    <div style={{flex:1, overflowY:'auto', maxHeight:'600px'}}>
                        {loading ? <div style={{textAlign:'center', padding:'2rem'}}>Cargando...</div> :
                         fichajesPendientes.length === 0 ? <div style={{textAlign:'center', padding:'3rem', color:'#94a3b8'}}>No hay transferencias pendientes.</div> :
                         fichajesPendientes.map(f => (
                            <div key={f.id} className="pending-card">
                                <div className="transfer-row">
                                    <strong style={{fontSize:'1.1rem'}}>{f.jugador}</strong>
                                    <span style={{fontWeight:700, color:'#2563eb'}}>{f.valor} ETH</span>
                                </div>
                                <div className="transfer-meta">
                                    <span>{f.origen}</span> <ArrowRightLeft size={14}/> <span>{f.destino}</span>
                                </div>
                                <div style={{marginTop:'1rem', display:'flex', gap:'0.5rem'}}>
                                    <button
                                        onClick={() => handleVerDocs(f.ipfsHash)}
                                        className="btn-action btn-docs"
                                        disabled={!f.ipfsHash}
                                    >
                                        <FileSearch size={16}/> {f.ipfsHash ? 'Ver Docs' : 'Sin Docs'}
                                    </button>
                                </div>
                            </div>
                         ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FederationView;
