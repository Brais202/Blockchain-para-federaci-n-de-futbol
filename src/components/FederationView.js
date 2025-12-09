import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from "ethers";
import { Navigate } from 'react-router-dom';
import { useContracts } from './Common/ContractContext';
import {
    Building2, Users, Activity, Lock, ShieldAlert, CheckCircle,
    Search, FileText, ArrowRightLeft, ClipboardCheck,
    History, Clock, KeyRound, Copy
} from 'lucide-react';
import EthCrypto from 'eth-crypto';
import { obtenerArchivoIPFS } from '../utils/ipfsService';

const FederationView = () => {
    const { fichajeContract, cuenta, provider } = useContracts();

    // Estados de la UI
    const [clubs, setClubs] = useState([]);
    const [nuevoClub, setNuevoClub] = useState({ direccion: "", nombre: "" });
    const [estadisticas, setEstadisticas] = useState({
        totalFichajes: 0,
        totalClubs: 0,
        fondosEnEscrow: "0.0"
    });
    const [fichajesPendientes, setFichajesPendientes] = useState([]);
    const [fichajesFinalizados, setFichajesFinalizados] = useState([]);
    const [activeTab, setActiveTab] = useState('pendientes');
    const [loading, setLoading] = useState(false);

    // Estados de nuestra funcionalidad de cripto
    const [federationKeys, setFederationKeys] = useState({ publicKey: '', privateKey: '' });
    const [privateKeyInput, setPrivateKeyInput] = useState('');
    const [decryptionStatus, setDecryptionStatus] = useState('');

    const cargarDatos = useCallback(async () => {
        if (!fichajeContract) return;
        setLoading(true);
        try {
            const totalFichajesBN = await fichajeContract.totalFichajes();
            const totalFichajes = totalFichajesBN.toNumber();

            
            const totalClubsRegistradosBN = await fichajeContract.getClubsCount();
            const totalClubsRegistrados = totalClubsRegistradosBN.toNumber();
            
            const clubsEncontrados = [];
            for (let i = 0; i < totalClubsRegistrados; i++) {
                try {
                    const dir = await fichajeContract.clubsRegistrados(i);
                    const info = await fichajeContract.clubs(dir);
                    if (info.nombre && info.nombre !== "") {
                        clubsEncontrados.push({
                            direccion: dir,
                            nombre: info.nombre,
                            autorizado: info.autorizado,
                            fechaRegistro: info.fechaRegistro
                        });
                    }
                } catch (e) { console.error(`Error cargando club en indice ${i}:`, e); }
            }
            setClubs(clubsEncontrados);

            const pendientesArray = [];
            const finalizadosArray = [];
            for (let i = 1; i <= totalFichajes; i++) {
                try {
                    const f = await fichajeContract.fichajes(i);
                    const origenInfo = await fichajeContract.clubs(f.clubes.clubOrigen);
                    const destinoInfo = await fichajeContract.clubs(f.clubes.clubDestino);
                    const fichajeData = {
                        id: i,
                        jugador: f.jugador.nombreJugador,
                        origen: origenInfo.nombre || "Desconocido",
                        destino: destinoInfo.nombre || "Desconocido",
                        valor: ethers.utils.formatEther(f.valorTransferencia),
                        ipfsHash: f.ipfsHash,
                        firmaOrigen: f.firmas.firmaOrigen,
                        firmaDestino: f.firmas.firmaDestino,
                        aprobado: f.aprobado
                    };
                    if (f.aprobado === true) {
                        finalizadosArray.push(fichajeData);
                    } else {
                        pendientesArray.push(fichajeData);
                    }
                } catch (err) { console.error(`Error cargando fichaje ${i}:`, err); }
            }

            setFichajesPendientes(pendientesArray.reverse());
            setFichajesFinalizados(finalizadosArray.reverse());

            let fondos = "0.0";
            try {
                const balance = await provider.getBalance(fichajeContract.address);
                fondos = parseFloat(ethers.utils.formatEther(balance)).toFixed(4);
            } catch (e) {}

            setEstadisticas({
                totalFichajes: totalFichajes,
                totalClubs: clubsEncontrados.length,
                fondosEnEscrow: fondos
            });

        } catch (error) { console.error("Error general cargando datos:", error); } finally { setLoading(false); }
    }, [fichajeContract, provider]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const autorizarClub = async () => {
        if (!fichajeContract || !provider) return;
        try {
            const signer = fichajeContract.connect(provider.getSigner());
            const tx = await signer.autorizarClub(nuevoClub.direccion, nuevoClub.nombre);
            await tx.wait();
            alert("✅ Club autorizado correctamente en la Blockchain");
            setNuevoClub({ direccion: "", nombre: "" });
            cargarDatos();
        } catch (error) { alert("Error al autorizar: " + error.message); }
    };

    const desautorizarClub = async (direccion) => {
        if (!fichajeContract || !provider) return;
        if (!window.confirm(`¿Seguro que quieres revocar la licencia a ${direccion}?`)) return;
        try {
            const signer = fichajeContract.connect(provider.getSigner());
            const tx = await signer.desautorizarClub(direccion);
            await tx.wait();
            alert("🚫 Licencia revocada correctamente");
            cargarDatos();
        } catch (error) { alert("Error al revocar: " + error.message); }
    };
    
    // lógica de criptografía
    const handleGenerateKeys = () => {
        const identity = EthCrypto.createIdentity();
        setFederationKeys(identity);
        setPrivateKeyInput(identity.privateKey);
        alert('Se han generado nuevas claves. Guarda la clave privada en un lugar muy seguro y copia la pública en src/config.js');
    };
    
    const handleVerDocs = async (ipfsHash) => {
        if (!ipfsHash || ipfsHash === "") return alert("⚠️ No hay documento adjunto a este fichaje.");
        if (!privateKeyInput) return alert("❌ Debes pegar tu clave privada de la federación para descifrar el documento.");

        setDecryptionStatus(`Descargando de IPFS...`);
        try {
            const encryptedBuffer = await obtenerArchivoIPFS(ipfsHash);
            const encryptedString = new TextDecoder().decode(encryptedBuffer);
            const encryptedObject = EthCrypto.cipher.parse(encryptedString);

            setDecryptionStatus('Descifrando documento...');
            const decryptedPayload = await EthCrypto.decryptWithPrivateKey(privateKeyInput, encryptedObject);
            const decryptedBuffer = Buffer.from(decryptedPayload, 'hex');

            setDecryptionStatus('¡Éxito! Mostrando PDF...');
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
    
    const listaMostrada = activeTab === 'pendientes' ? fichajesPendientes : fichajesFinalizados;

    if (!cuenta) return <Navigate to="/" replace />;

    return (
        <div className="premium-dashboard">
            <style>{`
                :root { --bg-fed: #f8fafc; --text-dark: #0f172a; --text-gray: #64748b; }
                .premium-dashboard { max-width: 1400px; margin: 0 auto; padding: 2rem; font-family: 'Inter', sans-serif; background: var(--bg-fed); min-height: 100vh; color: var(--text-dark); }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
                .stat-card { background: white; padding: 1.5rem; border-radius: 16px; border: 1px solid #e2e8f0; display: flex; align-items: center; gap: 1.25rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .icon-box { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; }
                .bg-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
                .bg-orange { background: linear-gradient(135deg, #f97316, #ea580c); }
                .bg-indigo { background: linear-gradient(135deg, #6366f1, #4f46e5); }
                .stat-content h3 { font-size: 1.8rem; font-weight: 800; margin: 0; line-height: 1; }
                .stat-content p { margin: 0; font-size: 0.85rem; color: var(--text-gray); font-weight: 600; text-transform: uppercase; }
                .main-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
                .card-panel { background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 1.5rem; }
                .col-span-1 { grid-column: span 1; }
                .col-span-2 { grid-column: span 2; }
                .col-span-3 { grid-column: span 3; }
                .card-header-flex { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1rem; }
                .header-title { display: flex; align-items: center; gap: 0.75rem; margin: 0; font-size: 1.25rem; color: #1e293b; font-weight: 700; }
                .tabs-container { background: #f1f5f9; padding: 4px; border-radius: 8px; display: flex; gap: 4px; }
                .tab-btn { border: none; background: transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
                .tab-btn.active { background: white; color: #0f172a; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
                .styled-input { width: 100%; padding: 0.9rem; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; margin-bottom: 0.5rem; }
                .btn-action { width: 100%; padding: 0.8rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; }
                .btn-success { background: #10b981; color: white; margin-top: 0.5rem; }
                .btn-danger { background: #fee2e2; color: #ef4444; padding: 0.4rem 0.8rem; font-size: 0.8rem; }
                .club-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
                .status-badge { padding: 4px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; margin-right: 0.5rem; }
                .auth { background: #dcfce7; color: #166534; }
                .no-auth { background: #fee2e2; color: #991b1b; }
                .transfer-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; background: white; }
                .transfer-card.completed { border-left: 4px solid #10b981; }
                .transfer-card.pending { border-left: 4px solid #f59e0b; }
                .transfer-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
                .transfer-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--text-gray); margin-bottom: 1rem; }
                .price-tag { font-weight: 700; color: #2563eb; background: #eff6ff; padding: 4px 10px; border-radius: 6px; font-size: 0.9rem; }
                .btn-docs { background: white; border: 1px solid #cbd5e1; color: #2563eb; }
                .key-input { font-family: monospace; font-size: 0.8rem; }
                .key-display { word-break: break-all; background: #f1f5f9; padding: 0.5rem; border-radius: 6px; font-family: monospace; font-size: 0.8rem; margin-bottom: 0.5rem; position: relative; }
                .copy-btn { position: absolute; top: 5px; right: 5px; background: white; border: 1px solid #e2e8f0; cursor: pointer; padding: 2px; border-radius: 4px; }
                .scrollable-list { max-height: 50vh; overflow-y: auto; padding-right: 0.5rem; }
                @media (max-width: 1024px) { .main-grid { grid-template-columns: 1fr; } .col-span-1, .col-span-2, .col-span-3 { grid-column: span 1; } }
            `}</style>

            <div style={{marginBottom:'2rem'}}>
                <h1 style={{fontSize:'2rem', fontWeight:800, color:'#1e3a8a', margin:'0 0 0.5rem 0'}}>Panel RFEF</h1>
                <p style={{color:'#64748b', margin:0}}>Administración y Control Financiero</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card"><div className="icon-box bg-blue"><Building2 /></div><div className="stat-content"><p>Clubs Autorizados</p><h3>{estadisticas.totalClubs}</h3></div></div>
                <div className="stat-card"><div className="icon-box bg-orange"><Activity /></div><div className="stat-content"><p>Fichajes Registrados</p><h3>{estadisticas.totalFichajes}</h3></div></div>
                <div className="stat-card"><div className="icon-box bg-indigo"><Lock /></div><div className="stat-content"><p>Fondos Custodia</p><h3>{estadisticas.fondosEnEscrow} ETH</h3></div></div>
            </div>

            <div className="main-grid">
                <div className="card-panel col-span-3">
                    <div className="header-title"><KeyRound className="text-amber-600"/> Criptografía y Descifrado</div>
                     <div>
                        <h4 style={{marginTop:0}}>Clave Privada (Para Descifrar)</h4>
                        <p style={{fontSize: '0.8rem', color: '#ef4444', marginTop: 0}}>⚠️ Pega aquí tu clave privada para poder ver los documentos. NO se guarda, úsala solo cuando la necesites.</p>
                        <input type="password" className="styled-input key-input" placeholder="Pega tu clave privada (0x...)" value={privateKeyInput} onChange={e => setPrivateKeyInput(e.target.value)} />
                        <p style={{textAlign: 'center', fontStyle: 'italic', fontSize: '0.9rem', color: '#3b82f6', minHeight: '1.2em'}}>{decryptionStatus}</p>
                    </div>
                    <div style={{borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem'}}>
                        <h4 style={{marginTop:0}}>Generador de Claves (Solo para la primera vez)</h4>
                         <p style={{fontSize: '0.9rem', color: 'var(--text-gray)', marginTop: 0}}>Si aún no tienes claves, genera un par. Guarda la privada en un lugar seguro y pon la pública en el archivo `src/config.js`.</p>
                        <button className="btn-action" style={{background:'#e2e8f0', color:'#1e293b'}} onClick={handleGenerateKeys}>Generar Nuevo Par de Claves</button>
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

                <div className="card-panel col-span-1">
                    <div className="header-title"><Users className="text-blue-600"/> Gestión de Licencias</div>
                    <div style={{background:'#f1f5f9', padding:'1.5rem', borderRadius:'16px'}}>
                        <h4 style={{marginTop:0, marginBottom:'1rem'}}>Alta de Nuevo Club</h4>
                        <input className="styled-input" placeholder="Dirección Wallet (0x...)" value={nuevoClub.direccion} onChange={e=>setNuevoClub({...nuevoClub, direccion:e.target.value})} />
                        <input className="styled-input" placeholder="Nombre Oficial Club" value={nuevoClub.nombre} onChange={e=>setNuevoClub({...nuevoClub, nombre:e.target.value})} />
                        <button className="btn-action btn-success" onClick={autorizarClub}><CheckCircle size={18}/> Autorizar</button>
                    </div>
                    <div className="scrollable-list">
                        {clubs.map((c, i) => (
                            <div key={i} className="club-item">
                                <div>
                                    <strong style={{display:'block', color:'#0f172a'}}>{c.nombre}</strong>
                                    <span style={{fontFamily:'monospace', fontSize:'0.8rem', color:'#64748b'}}>{c.direccion.substring(0,14)}...</span>
                                </div>
                                {c.autorizado && <button className="btn-action btn-danger" onClick={()=>desautorizarClub(c.direccion)}><ShieldAlert size={14}/></button>}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card-panel col-span-2">
                    <div className="card-header-flex">
                        <div className="header-title"><Search className="text-orange-600"/> Supervisión de Mercado</div>
                        <div className="tabs-container">
                            <button className={`tab-btn ${activeTab === 'pendientes' ? 'active' : ''}`} onClick={() => setActiveTab('pendientes')}><Clock size={16}/> Pendientes ({fichajesPendientes.length})</button>
                            <button className={`tab-btn ${activeTab === 'finalizados' ? 'active' : ''}`} onClick={() => setActiveTab('finalizados')}><History size={16}/> Histórico ({fichajesFinalizados.length})</button>
                        </div>
                    </div>
                    {loading ? <p style={{textAlign:'center', color:'#94a3b8'}}>Cargando...</p> : (
                        <div className="scrollable-list">
                            {listaMostrada.length === 0 ? <p style={{textAlign:'center', color:'#94a3b8'}}>No hay fichajes {activeTab}.</p> : (
                                listaMostrada.map((fichaje) => (
                                    <div key={fichaje.id} className={`transfer-card ${fichaje.aprobado ? 'completed' : 'pending'}`}>
                                        <div className="transfer-row">
                                          <div>
                                            <strong style={{fontSize:'1.1rem', display:'block'}}>{fichaje.jugador}</strong>
                                            <span style={{fontSize:'0.85rem', color:'#64748b'}}>{fichaje.origen} <ArrowRightLeft size={14} style={{display:'inline', margin:'0 5px'}}/> {fichaje.destino}</span>
                                          </div>
                                          <span className="price-tag">{fichaje.valor} ETH</span>
                                        </div>
                                        <div style={{display:'flex', gap:'0.75rem', marginTop:'1rem'}}>
                                            <button className="btn-action btn-docs" onClick={() => handleVerDocs(fichaje.ipfsHash)} style={{width:'100%'}} disabled={!fichaje.ipfsHash}><FileText size={16}/> {fichaje.ipfsHash ? "Ver Documento" : "Sin Documento"}</button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FederationView;