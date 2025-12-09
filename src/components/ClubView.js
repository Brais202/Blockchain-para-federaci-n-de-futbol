import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from "ethers";
import { Navigate } from 'react-router-dom';
import { useContracts } from './Common/ContractContext';
import { User, FileText, ArrowRightLeft, DollarSign, Activity, CheckCircle, Search, FileUp, ShieldCheck } from 'lucide-react';
import EthCrypto from 'eth-crypto';
import { subirContenido } from '../utils/ipfsService';
import { FEDERATION_PUBLIC_KEY } from '../config';


const MS_POR_ANO = 1000 * 60 * 60 * 24 * 365.25;

const ClubView = () => {
    const { fichajeContract, cuenta, provider } = useContracts();

    // Estados UI
    const [activeTab, setActiveTab] = useState('misFichajes');
    const [loadingData, setLoadingData] = useState(false);

    // Datos
    const [fichajesData, setFichajesData] = useState({ misFichajes: [], mercadoGeneral: [] });
    const [estadisticas, setEstadisticas] = useState({ enviados: 0, recibidos: 0, gastado: 0, ingresado: 0 });
    const [nuevoFichaje, setNuevoFichaje] = useState({ nombreJugador: "", fechaNacimiento: "", clubDestino: "", valorTransferencia: "", agente: "" });

    // Estados para la subida de documentos 
    const [selectedFiles, setSelectedFiles] = useState({});
    const [uploadStatus, setUploadStatus] = useState({});


    const calcularEdad = (timestampSegundos) => {
        if (!timestampSegundos || timestampSegundos.isZero()) return 0;
        const edadMilisegundos = Date.now() - (timestampSegundos.toNumber() * 1000);
        return Math.floor(edadMilisegundos / MS_POR_ANO);
    };

    const cargarDatos = useCallback(async () => {
        if (!fichajeContract || !cuenta) return;
        setLoadingData(true);
        try {
            let total = 0;
            try {
                const totalBN = await fichajeContract.totalFichajes();
                total = totalBN.toNumber();
            } catch (e) { console.log("Sin fichajes aún"); }

            const misOps = [];
            const mercado = [];
            let stats = { enviados: 0, recibidos: 0, gastado: 0, ingresado: 0 };

            for (let i = 1; i <= total; i++) {
                try {
                    const fichaje = await fichajeContract.fichajes(i);
                    const clubOrigen = fichaje.clubes.clubOrigen.toLowerCase();
                    const clubDestino = fichaje.clubes.clubDestino.toLowerCase();
                    const miCuenta = cuenta.toLowerCase();
                    const esMio = clubOrigen === miCuenta || clubDestino === miCuenta;

                    const clubOrigenInfo = await fichajeContract.clubs(fichaje.clubes.clubOrigen);
                    const clubDestinoInfo = await fichajeContract.clubs(fichaje.clubes.clubDestino);
                    let valorEth = 0;
                    try { valorEth = parseFloat(ethers.utils.formatEther(fichaje.valorTransferencia)); } catch(e){}
                    
                    const edadActual = calcularEdad(fichaje.jugador.fechaNacimiento);

                    const fichajeBase = {
                        id: i,
                        nombreJugador: fichaje.jugador.nombreJugador,
                        edad: edadActual,
                        valor: valorEth,
                        valorString: ethers.utils.formatEther(fichaje.valorTransferencia),
                        clubOrigenNombre: clubOrigenInfo.nombre || clubOrigen.substring(0,6) + "...",
                        clubDestinoNombre: clubDestinoInfo.nombre || clubDestino.substring(0,6) + "...",
                        aprobado: fichaje.aprobado,
                        fondosDepositados: fichaje.fondosDepositados,
                        firmaOrigen: fichaje.firmas.firmaOrigen,
                        firmaDestino: fichaje.firmas.firmaDestino,
                        esClubOrigen: clubOrigen === miCuenta,
                        ipfsHash: fichaje.ipfsHash
                    };

                    if (esMio) {
                        misOps.push(fichajeBase);
                        if (clubOrigen === miCuenta) {
                            stats.enviados++;
                            if (fichaje.aprobado) { stats.ingresado += valorEth; }
                        }
                        if (clubDestino === miCuenta) {
                            stats.recibidos++;
                            if (fichaje.fondosDepositados || fichaje.aprobado) { stats.gastado += valorEth; }
                        }
                    } else {
                        mercado.push(fichajeBase);
                    }
                } catch (err) { console.error("Error leyendo fichaje", i); }
            }
            setFichajesData({ misFichajes: misOps.reverse(), mercadoGeneral: mercado.reverse() });
            setEstadisticas({ ...stats, ingresado: stats.ingresado, gastado: stats.gastado });
        } catch (error) { console.error("Error general:", error); } 
        finally { setLoadingData(false); }
    }, [fichajeContract, cuenta]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const handleRegistrar = async (e) => {
        e.preventDefault();
        if (!fichajeContract || !provider) return;
        const birthDate = new Date(nuevoFichaje.fechaNacimiento);
        if (isNaN(birthDate)) return alert("Error: Fecha de nacimiento no válida.");
        const fechaNacimientoTimestamp = Math.floor(birthDate.getTime() / 1000);

        try {
            const signer = fichajeContract.connect(provider.getSigner());
            const valorWei = ethers.utils.parseEther(nuevoFichaje.valorTransferencia);
            const tx = await signer.registrarFichaje(nuevoFichaje.nombreJugador, fechaNacimientoTimestamp, cuenta, nuevoFichaje.clubDestino, valorWei, nuevoFichaje.agente || ethers.constants.AddressZero);
            await tx.wait();
            alert("✅ Fichaje iniciado");
            setNuevoFichaje({ nombreJugador: "", fechaNacimiento: "", clubDestino: "", valorTransferencia: "", agente: "" });
            cargarDatos();
            setActiveTab('misFichajes');
        } catch (error) { alert("Error: " + error.message); }
    };

    const handleDepositarEnFichaje = async (id, valorString) => {
        if (!fichajeContract || !provider) return;
        try {
            const signer = fichajeContract.connect(provider.getSigner());
            const valorWei = ethers.utils.parseEther(valorString);
            const tx = await signer.depositarFondosEscrow(id, { value: valorWei });
            await tx.wait();
            alert("💰 Fondos depositados.");
            cargarDatos();
        } catch (error) { alert("Error deposito: " + (error.reason || error.message)); }
    };

    const handleFirmar = async (id) => {
        if (!fichajeContract) return;
        try {
            const signer = fichajeContract.connect(provider.getSigner());
            const tx = await signer.firmarFichaje(id);
            await tx.wait();
            cargarDatos();
        } catch (error) { alert("Error firma: " + (error.reason || error.message)); }
    };
    
    // Lógica para subir documentos
    const handleFileChange = (e, fichajeId) => {
        const file = e.target.files[0];
        if (file && file.type === "application/pdf") {
            setSelectedFiles(prev => ({ ...prev, [fichajeId]: file }));
        } else {
            alert("Por favor, selecciona un archivo PDF.");
            e.target.value = null;
        }
    };

    const handleUploadContract = async (fichajeId) => {
        const file = selectedFiles[fichajeId];
        if (!file) return alert("Primero selecciona un archivo PDF.");
        if (!fichajeContract) return;

        const updateStatus = (message) => setUploadStatus(prev => ({ ...prev, [fichajeId]: message }));
        try {
            updateStatus("1/4 - Cifrando archivo...");
            const fileBuffer = await file.arrayBuffer();
            const encryptedObject = await EthCrypto.encryptWithPublicKey(FEDERATION_PUBLIC_KEY, Buffer.from(fileBuffer).toString('hex'));
            const encryptedString = EthCrypto.cipher.stringify(encryptedObject);
            const encryptedBuffer = new TextEncoder().encode(encryptedString);

            updateStatus("2/4 - Subiendo a IPFS...");
            const result = await subirContenido(encryptedBuffer);
            const cid = result.cid;

            updateStatus("3/4 - Guardando CID en la Blockchain...");
            const signer = fichajeContract.connect(provider.getSigner());
            const tx = await signer.anadirDocumentoFichaje(fichajeId, cid);
            await tx.wait();

            updateStatus("4/4 - ✅ ¡Éxito! Documento registrado.");
            cargarDatos();
            setTimeout(() => updateStatus(''), 5000);
        } catch (error) {
            console.error("Error subiendo contrato:", error);
            const errorMessage = `Error: ${error.reason || error.message}`;
            updateStatus(errorMessage);
            alert(errorMessage);
        }
    };


    if (!cuenta) return <Navigate to="/" replace />;

    return (
        <div className="premium-dashboard">
            <style>{`
                .premium-dashboard { max-width: 1400px; margin: 0 auto; padding: 2rem; font-family: sans-serif; background: #f8fafc; min-height: 100vh; position: relative; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .stat-card { background: white; padding: 1.5rem; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 1rem; position: relative; }
                .icon-box { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
                .bg-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
                .bg-green { background: linear-gradient(135deg, #22c55e, #16a34a); }
                .bg-purple { background: linear-gradient(135deg, #a855f7, #9333ea); }
                .stat-info h3 { margin: 0; font-size: 1.5rem; color: #0f172a; }
                .stat-info p { margin: 0; font-size: 0.8rem; color: #64748b; font-weight: 600; text-transform: uppercase; }
                .tabs { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
                .tab-head { display: flex; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 0.5rem 1rem 0; flex-wrap: wrap; }
                .tab-btn { padding: 1rem 1.5rem; border: none; background: transparent; color: #64748b; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border-radius: 8px 8px 0 0; }
                .tab-btn.active { background: white; color: #2563eb; box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.02); }
                .tab-body { padding: 2rem; }
                .table-wrap { overflow-x: auto; }
                .table { width: 100%; border-collapse: collapse; }
                .table th { text-align: left; padding: 1rem; color: #64748b; font-size: 0.75rem; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
                .table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; color: #1e293b; vertical-align: middle; }
                .btn { padding: 0.5rem 1rem; border-radius: 8px; border: none; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; }
                .btn-primary { background: #2563eb; color: white; }
                .btn-pay { background: #22c55e; color: white; }
                .badge { padding: 4px 8px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; }
                .badge-ok { background: #dcfce7; color: #166534; }
                .badge-wait { background: #fef9c3; color: #854d0e; }
                .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; }
                .input { width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 1rem; }
                .fichaje-type { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; padding: 2px 6px; border-radius: 4px; margin-left: 0.5rem; }
                .fichaje-out { background: #fee2e2; color: #991b1b; }
                .fichaje-in { background: #dbeafe; color: #1e40af; }
                .doc-upload-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; margin-bottom: 1.5rem; }
                .doc-upload-card h4 { margin: 0 0 1rem 0; }
                .doc-upload-form { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; }
                .styled-file-input { flex: 1; }
                .btn-upload { background: #4f46e5; color: white; }
                .btn-upload:disabled { background: #a5b4fc; cursor: not-allowed; }
                .upload-status-text { font-size: 0.85rem; font-style: italic; color: #64748b; margin-top: 0.5rem; min-height: 1.2em; }
            `}</style>

            <div className="stats-grid">
                <div className="stat-card"><div className="icon-box bg-blue"><ArrowRightLeft size={24} /></div><div className="stat-info"><p>Operaciones Propias</p><h3>{fichajesData.misFichajes.length}</h3></div></div>
                <div className="stat-card"><div className="icon-box bg-green"><DollarSign size={24} /></div><div className="stat-info"><p>Gastado (Compras)</p><h3>{estadisticas.gastado.toFixed(2)} ETH</h3></div></div>
                <div className="stat-card"><div className="icon-box bg-purple"><Activity size={24} /></div><div className="stat-info"><p>Ingresado (Ventas)</p><h3>{estadisticas.ingresado.toFixed(2)} ETH</h3></div></div>
            </div>

            <div className="tabs">
                <div className="tab-head">
                    <button className={`tab-btn ${activeTab === 'misFichajes' ? 'active' : ''}`} onClick={() => setActiveTab('misFichajes')}><User size={18} /> Mis Fichajes</button>
                    <button className={`tab-btn ${activeTab === 'mercadoGlobal' ? 'active' : ''}`} onClick={() => setActiveTab('mercadoGlobal')}><Search size={18} /> Mercado Global</button>
                    <button className={`tab-btn ${activeTab === 'nuevo' ? 'active' : ''}`} onClick={() => setActiveTab('nuevo')}><ArrowRightLeft size={18} /> Nuevo Traspaso</button>
                    <button className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}><FileText size={18} /> Documentación</button>
                </div>

                <div className="tab-body">
                    {activeTab === 'misFichajes' && (
                        <div className="table-wrap">
                            {loadingData ? <p>Cargando...</p> : !fichajesData.misFichajes.length ? <p>No hay operaciones.</p> :
                                <table className="table">
                                    <thead><tr><th>Jugador</th><th>Tipo</th><th>Origen</th><th>Destino</th><th>Valor</th><th>Estado</th><th>Acción</th></tr></thead>
                                    <tbody>
                                    {fichajesData.misFichajes.map(f => (
                                        <tr key={f.id}>
                                            <td><strong>{f.nombreJugador}</strong><br/><small>{f.edad} años</small></td>
                                            <td><span className={`fichaje-type ${f.esClubOrigen ? 'fichaje-out' : 'fichaje-in'}`}>{f.esClubOrigen ? 'VENTA' : 'COMPRA'}</span></td>
                                            <td>{f.clubOrigenNombre}</td><td>{f.clubDestinoNombre}</td><td>{f.valor.toFixed(4)} ETH</td>
                                            <td>{f.aprobado ? <span className="badge badge-ok">OK</span> : <span className="badge badge-wait">En Proceso</span>}</td>
                                            <td>
                                                {!f.aprobado && (
                                                    <>
                                                        {!f.esClubOrigen && !f.fondosDepositados && <button onClick={() => handleDepositarEnFichaje(f.id, f.valorString)} className="btn btn-pay">Pagar</button>}
                                                        {f.fondosDepositados && ((!f.esClubOrigen && !f.firmaDestino) || (f.esClubOrigen && !f.firmaOrigen) ? <button onClick={() => handleFirmar(f.id)} className="btn btn-primary"><CheckCircle size={14}/> Firmar</button> : <span>Esperando...</span>)}
                                                        {f.esClubOrigen && !f.fondosDepositados && <span>Esperando pago</span>}
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>}
                        </div>
                    )}
                    {activeTab === 'mercadoGlobal' && (
                        <div className="table-wrap">
                            {loadingData ? <p>Cargando...</p> : !fichajesData.mercadoGeneral.length ? <p>No hay actividad.</p> :
                                <table className="table">
                                    <thead><tr><th>Jugador</th><th>Origen</th><th>Destino</th><th>Valor</th><th>Estado</th></tr></thead>
                                    <tbody>
                                    {fichajesData.mercadoGeneral.map(f => (
                                        <tr key={f.id}>
                                            <td><strong>{f.nombreJugador}</strong><br/><small>{f.edad} años</small></td>
                                            <td>{f.clubOrigenNombre}</td><td>{f.clubDestinoNombre}</td><td>{f.valor.toFixed(4)} ETH</td>
                                            <td>{f.aprobado ? <span className="badge badge-ok">OK</span> : <span className="badge badge-wait">En Proceso</span>}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>}
                        </div>
                    )}
                    {activeTab === 'nuevo' && (
                        <form onSubmit={handleRegistrar} style={{maxWidth:'600px', margin:'0 auto'}}>
                            <div className="form-row">
                                <input className="input" placeholder="Nombre Jugador" type="text" value={nuevoFichaje.nombreJugador} onChange={e => setNuevoFichaje({ ...nuevoFichaje, nombreJugador: e.target.value })} required />
                                <input className="input" placeholder="Fecha de Nacimiento" type="date" value={nuevoFichaje.fechaNacimiento} onChange={e => setNuevoFichaje({ ...nuevoFichaje, fechaNacimiento: e.target.value })} required />
                            </div>
                            <input className="input" placeholder="Dirección Club Destino (0x...)" type="text" value={nuevoFichaje.clubDestino} onChange={e => setNuevoFichaje({ ...nuevoFichaje, clubDestino: e.target.value })} required style={{marginBottom:'1rem'}} />
                            <div className="form-row">
                                <input className="input" placeholder="Valor (ETH)" type="number" step="0.0001" value={nuevoFichaje.valorTransferencia} onChange={e => setNuevoFichaje({ ...nuevoFichaje, valorTransferencia: e.target.value })} required />
                                <input className="input" placeholder="Agente (Opcional)" type="text" value={nuevoFichaje.agente} onChange={e => setNuevoFichaje({ ...nuevoFichaje, agente: e.target.value })} />
                            </div>
                            <button type="submit" className="btn btn-primary" style={{width:'100%', marginTop:'1rem', padding:'1rem'}}>Registrar Fichaje</button>
                        </form>
                    )}
                    {activeTab === 'docs' && (
                        <div>
                            <div style={{textAlign:'center', marginBottom:'2rem'}}>
                                <h2>Gestión de Documentos Confidenciales</h2>
                                <p style={{color:'#64748b'}}>Sube el contrato PDF de cada fichaje. El archivo se cifrará en tu navegador antes de subirse a IPFS.</p>
                            </div>
                            {loadingData ? <p>Cargando fichajes...</p> :
                             fichajesData.misFichajes.filter(f => f.esClubOrigen).length === 0 ? <p style={{textAlign:'center', color:'#94a3b8', padding: '2rem'}}>No tienes fichajes iniciados (ventas) para adjuntar documentación.</p> :
                             (
                                <div>
                                    {fichajesData.misFichajes.filter(f => f.esClubOrigen).map(f => (
                                        <div key={f.id} className="doc-upload-card">
                                            <h4>Fichaje #{f.id}: {f.nombreJugador} (Venta a {f.clubDestinoNombre})</h4>
                                            {f.ipfsHash ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: '#e0f2fe', padding: '1rem', borderRadius: '8px' }}>
                                                    <ShieldCheck size={24} className="text-sky-600" />
                                                    <div>
                                                        <p style={{ margin: 0, fontWeight: 600, color: '#0c4a6e' }}>Documento ya registrado en IPFS.</p>
                                                        <code style={{ fontSize: '0.8rem', color: '#0369a1' }}>CID: {f.ipfsHash}</code>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="doc-upload-form">
                                                        <input type="file" accept=".pdf" onChange={(e) => handleFileChange(e, f.id)} className="styled-file-input" />
                                                        <button onClick={() => handleUploadContract(f.id)} className="btn btn-upload" disabled={!selectedFiles[f.id] || uploadStatus[f.id]}>
                                                            <FileUp size={16}/> Cifrar y Subir
                                                        </button>
                                                    </div>
                                                    <p className="upload-status-text">{uploadStatus[f.id] || 'Esperando archivo PDF...'}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                             )
                            }
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClubView;