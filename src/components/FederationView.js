import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from "ethers";
import { Navigate } from 'react-router-dom';
import { useContracts } from './Common/ContractContext';
import {
    Building2, Users, Activity, Lock, ShieldAlert, CheckCircle,
    Search, FileText, ArrowRightLeft, ClipboardCheck,
    History, Clock
} from 'lucide-react';

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

    // Listas para las pestañas
    const [fichajesPendientes, setFichajesPendientes] = useState([]);
    const [fichajesFinalizados, setFichajesFinalizados] = useState([]);

    // Control de pestañas visuales
    const [activeTab, setActiveTab] = useState('pendientes');
    const [loading, setLoading] = useState(false);

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
                } catch (e) {
                    console.error(`Error cargando club en indice ${i}:`, e);
                }
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

            setFichajesPendientes(pendientesArray);
            setFichajesFinalizados(finalizadosArray);

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

    // 3. ACCIONES DE ESCRITURA (Transacciones Reales)

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

    const handleAuditar = (fichaje) => {
        const estadoFirmas = `Origen: ${fichaje.firmaOrigen ? '✅ Firmado' : '❌ Pendiente'} | Destino: ${fichaje.firmaDestino ? '✅ Firmado' : '❌ Pendiente'}`;
        const riesgo = parseFloat(fichaje.valor) > 100 ? "ALTO (Requiere revisión manual)" : "BAJO (Automático)";

        alert(`📋 REPORTE DE AUDITORÍA #FICHAJE-${fichaje.id}\n\n` +
            `Jugador: ${fichaje.jugador}\n` +
            `Valoración: ${fichaje.valor} ETH\n` +
            `Estado de Firmas: ${estadoFirmas}\n` +
            `Nivel de Riesgo Financiero: ${riesgo}\n\n` +
            `Conclusión del Sistema: ${fichaje.firmaOrigen && fichaje.firmaDestino ? "Listo para aprobación final." : "Faltan firmas de las partes."}`);
    };

    const handleVerDocs = (ipfsHash) => {
        if (!ipfsHash || ipfsHash === "") {
            alert("⚠️ No hay documentos adjuntos a este fichaje todavía.");
        } else {
            const url = `https://ipfs.io/ipfs/${ipfsHash}`;
            if(window.confirm(`Se abrirá el documento IPFS:\n${ipfsHash}\n\n¿Continuar?`)) {
                window.open(url, '_blank');
            }
        }
    };

    const listaMostrada = activeTab === 'pendientes' ? fichajesPendientes : fichajesFinalizados;

    if (!cuenta) return <Navigate to="/" replace />;

    return (
        <div className="premium-dashboard">
            <style>{`
        /* --- ESTILOS GUCCI / PREMIUM --- */
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

        .dashboard-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 2rem; }
        .card-panel { background: white; border-radius: 20px; border: 1px solid #e2e8f0; padding: 2rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 1.5rem; }
        
        /* Header del panel con tabs */
        .card-header-flex { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; margin-bottom: 1rem; }
        .header-title { display: flex; align-items: center; gap: 0.75rem; margin: 0; font-size: 1.25rem; color: #1e293b; font-weight: 700; }
        
        /* Tabs personalizados */
        .tabs-container { background: #f1f5f9; padding: 4px; border-radius: 8px; display: flex; gap: 4px; }
        .tab-btn { border: none; background: transparent; padding: 6px 12px; border-radius: 6px; font-size: 0.85rem; font-weight: 600; color: #64748b; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 6px; }
        .tab-btn.active { background: white; color: #0f172a; shadow: 0 1px 3px rgba(0,0,0,0.1); }
        .tab-btn:hover:not(.active) { color: #334155; }

        .styled-input { width: 100%; padding: 0.9rem; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; margin-bottom: 0.5rem; }
        .btn-action { width: 100%; padding: 0.8rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; }
        .btn-success { background: #10b981; color: white; margin-top: 0.5rem; }
        .btn-danger { background: #fee2e2; color: #ef4444; padding: 0.4rem 0.8rem; font-size: 0.8rem; }
        
        .club-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
        .status-badge { padding: 4px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; margin-right: 0.5rem; }
        .auth { background: #dcfce7; color: #166534; }
        .no-auth { background: #fee2e2; color: #991b1b; }

        /* Estilos tarjeta fichaje */
        .transfer-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; background: white; transition: box-shadow 0.2s; }
        .transfer-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .transfer-card.completed { border-left: 4px solid #10b981; background: #fcfdfd; }
        .transfer-card.pending { border-left: 4px solid #f59e0b; }
        
        .transfer-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; }
        .transfer-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; color: var(--text-gray); margin-bottom: 1rem; }
        .price-tag { font-weight: 700; color: #2563eb; background: #eff6ff; padding: 4px 10px; border-radius: 6px; font-size: 0.9rem; }
        
        .btn-audit { background: white; border: 1px solid #cbd5e1; color: #475569; }
        .btn-audit:hover { background: #f1f5f9; color: #1e293b; border-color: #94a3b8; }
        .btn-docs { background: white; border: 1px solid #cbd5e1; color: #2563eb; }
        .btn-docs:hover { background: #eff6ff; border-color: #60a5fa; }

        /* Estilos clave para el scroll (los he movido a la etiqueta style) */
        .scrollable-list-clubs { 
            max-height: 400px; 
            overflow-y: auto; 
            padding-right: 0.5rem; /* Para que la barra de scroll no toque el borde */
        }
        .scrollable-list-fichajes {
            max-height: 70vh; /* Usamos viewport height para un tamaño más dinámico */
            overflow-y: auto;
            padding-right: 0.5rem;
        }

        @media (max-width: 1024px) { .dashboard-grid { grid-template-columns: 1fr; } }
      `}</style>

            {/* HEADER */}
            <div style={{marginBottom:'2rem'}}>
                <h1 style={{fontSize:'2rem', fontWeight:800, color:'#1e3a8a', margin:'0 0 0.5rem 0'}}>Panel RFEF</h1>
                <p style={{color:'#64748b', margin:0}}>Administración y Control Financiero</p>
            </div>

            {/* KPIS */}
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

                {/* COLUMNA IZQ: GESTIÓN CLUBS (LICENCIAS) */}
                <div className="card-panel">
                    <div className="card-header-flex">
                        <div className="header-title"><Users className="text-blue-600"/> Gestión de Licencias</div>
                    </div>

                    <div style={{background:'#f1f5f9', padding:'1.5rem', borderRadius:'16px'}}>
                        <h4 style={{marginTop:0, marginBottom:'1rem'}}>Alta de Nuevo Club</h4>
                        <input className="styled-input" placeholder="Dirección Wallet (0x...)" value={nuevoClub.direccion} onChange={e=>setNuevoClub({...nuevoClub, direccion:e.target.value})} />
                        <input className="styled-input" placeholder="Nombre Oficial Club" value={nuevoClub.nombre} onChange={e=>setNuevoClub({...nuevoClub, nombre:e.target.value})} />
                        <button className="btn-action btn-success" onClick={autorizarClub}><CheckCircle size={18}/> Autorizar Licencia</button>
                    </div>

                    <div>
                        <h4 style={{marginBottom:'1rem', marginTop:'2rem'}}>Clubs Registrados</h4>
                        <div className="scrollable-list-clubs">
                            {clubs.length === 0 ? <p style={{textAlign:'center', color:'#94a3b8'}}>No hay clubs encontrados</p> :
                                clubs.map((c, i) => (
                                    <div key={i} className="club-item">
                                        <div>
                                            <strong style={{display:'block', color:'#0f172a'}}>{c.nombre}</strong>
                                            <span style={{fontFamily:'monospace', fontSize:'0.8rem', color:'#64748b'}}>{c.direccion.substring(0,14)}...</span>
                                        </div>
                                        <div style={{display:'flex', alignItems:'center'}}>
                                            <span className={`status-badge ${c.autorizado ? 'auth' : 'no-auth'}`}>
                                              {c.autorizado ? 'ACTIVO' : 'BAJA'}
                                            </span>
                                            {c.autorizado && <button className="btn-action btn-danger" onClick={()=>desautorizarClub(c.direccion)}><ShieldAlert size={14}/></button>}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>

                {/* COLUMNA DER: SUPERVISIÓN DE MERCADO (Con Tabs Real) */}
                <div className="card-panel">
                    <div className="card-header-flex">
                        <div className="header-title"><Search className="text-orange-600"/> Supervisión de Mercado</div>
                        <div className="tabs-container">
                            <button
                                className={`tab-btn ${activeTab === 'pendientes' ? 'active' : ''}`}
                                onClick={() => setActiveTab('pendientes')}
                            >
                                <Clock size={16}/> Pendientes ({fichajesPendientes.length})
                            </button>
                            <button
                                className={`tab-btn ${activeTab === 'finalizados' ? 'active' : ''}`}
                                onClick={() => setActiveTab('finalizados')}
                            >
                                <History size={16}/> Histórico ({fichajesFinalizados.length})
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <p style={{textAlign:'center', color:'#94a3b8'}}>Cargando datos de la Blockchain...</p>
                    ) : (
                        <div className="scrollable-list-fichajes">
                            {listaMostrada.length === 0 ? (
                                <p style={{textAlign:'center', color:'#94a3b8'}}>No hay fichajes {activeTab} para mostrar.</p>
                            ) : (
                                listaMostrada.map((fichaje) => (
                                    <div key={fichaje.id} className={`transfer-card ${fichaje.aprobado ? 'completed' : 'pending'}`}>
                                        <div className="transfer-meta">
                                            <span>#FICHAJE-{fichaje.id}</span>
                                            <span className="price-tag">{fichaje.valor} ETH</span>
                                        </div>
                                        <div className="transfer-row">
                                            <div>
                                                <strong style={{fontSize:'1.1rem', display:'block'}}>{fichaje.jugador}</strong>
                                                <span style={{fontSize:'0.85rem', color:'#64748b'}}>
                                                    {fichaje.origen} <ArrowRightLeft size={14} style={{display:'inline', margin:'0 5px'}}/> {fichaje.destino}
                                                </span>
                                            </div>
                                            <div style={{textAlign:'right'}}>
                                                <span style={{display:'block', fontSize:'0.75rem', fontWeight:'700', color: fichaje.aprobado ? '#10b981' : '#f59e0b'}}>
                                                    {fichaje.aprobado ? 'APROBADO' : 'PENDIENTE'}
                                                </span>
                                            </div>
                                        </div>

                                        <div style={{display:'flex', gap:'0.75rem', marginTop:'1rem'}}>
                                            <button
                                                className="btn-action btn-audit"
                                                onClick={() => handleAuditar(fichaje)}
                                                style={{width:'50%'}}
                                            >
                                                <ClipboardCheck size={16}/> Auditar
                                            </button>
                                            <button
                                                className="btn-action btn-docs"
                                                onClick={() => handleVerDocs(fichaje.ipfsHash)}
                                                style={{width:'50%'}}
                                            >
                                                <FileText size={16}/> Ver Docs
                                            </button>
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