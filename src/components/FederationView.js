import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from "ethers";
import { Navigate } from 'react-router-dom';
import { useContracts } from './Common/ContractContext';
import { Building2, Users, Activity, Lock, ShieldAlert, CheckCircle, Search, FileText, ArrowRightLeft, FileSearch, ClipboardCheck } from 'lucide-react';

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

    const cargarDatos = useCallback(async () => {
        if (!fichajeContract) return;
        setLoading(true);

        try {
            const totalFichajesBN = await fichajeContract.totalFichajes();
            const totalFichajes = totalFichajesBN.toNumber();

            // Cargar Clubs
            const clubsDemo = [
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
                cuenta
            ];

            const uniqueClubs = [...new Set(clubsDemo.map(c => c.toLowerCase()))];
            const clubsEncontrados = [];

            for (const dir of uniqueClubs) {
                try {
                    const info = await fichajeContract.clubs(dir);
                    if (info.nombre && info.nombre !== "") {
                        clubsEncontrados.push({
                            direccion: dir,
                            nombre: info.nombre,
                            autorizado: info.autorizado,
                            fechaRegistro: info.fechaRegistro
                        });
                    }
                } catch (e) { }
            }
            setClubs(clubsEncontrados);

            // Cargar Fichajes Pendientes
            const pendientesArray = [];
            for (let i = 1; i <= totalFichajes; i++) {
                try {
                    const f = await fichajeContract.fichajes(i);
                    if (f.aprobado === false) {
                        const origenInfo = await fichajeContract.clubs(f.clubes.clubOrigen);
                        const destinoInfo = await fichajeContract.clubs(f.clubes.clubDestino);

                        pendientesArray.push({
                            id: i,
                            jugador: f.jugador.nombreJugador,
                            origen: origenInfo.nombre || "Desconocido",
                            destino: destinoInfo.nombre || "Desconocido",
                            valor: ethers.utils.formatEther(f.valorTransferencia),
                            ipfsHash: f.ipfsHash, // Guardamos el hash para el botón de Docs
                            firmaOrigen: f.firmas.firmaOrigen,
                            firmaDestino: f.firmas.firmaDestino
                        });
                    }
                } catch (err) { console.error(err); }
            }
            setFichajesPendientes(pendientesArray);

            // Estadísticas
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

        } catch (error) { console.error(error); } finally { setLoading(false); }
    }, [fichajeContract, provider, cuenta]);

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
        } catch (error) { alert("Error: " + error.message); }
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
        } catch (error) { alert("Error: " + error.message); }
    };

    // --- NUEVAS FUNCIONES PARA LOS BOTONES ---

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
            // Intentamos abrir el gateway público de IPFS
            const url = `https://ipfs.io/ipfs/${ipfsHash}`;
            if(window.confirm(`Se abrirá el documento IPFS:\n${ipfsHash}\n\n¿Continuar?`)) {
                window.open(url, '_blank');
            }
        }
    };

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
        .card-header { display: flex; align-items: center; gap: 0.75rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 1rem; }
        .card-header h2 { margin: 0; font-size: 1.25rem; color: #1e293b; }

        .styled-input { width: 100%; padding: 0.9rem; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 0.95rem; margin-bottom: 0.5rem; }
        .btn-action { width: 100%; padding: 0.8rem; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.5rem; transition: background 0.2s; }
        .btn-success { background: #10b981; color: white; margin-top: 0.5rem; }
        .btn-danger { background: #fee2e2; color: #ef4444; padding: 0.4rem 0.8rem; font-size: 0.8rem; }
        
        .club-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem 0; border-bottom: 1px solid #f1f5f9; }
        .status-badge { padding: 4px 10px; border-radius: 99px; font-size: 0.7rem; font-weight: 700; margin-right: 0.5rem; }
        .auth { background: #dcfce7; color: #166534; }
        .no-auth { background: #fee2e2; color: #991b1b; }

        .pending-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 1rem; margin-bottom: 1rem; background: #f8fafc; }
        .transfer-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
        .transfer-meta { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: var(--text-gray); }

        .btn-audit { background: white; border: 1px solid #cbd5e1; color: #475569; }
        .btn-audit:hover { background: #f1f5f9; color: #1e293b; border-color: #94a3b8; }
        .btn-docs { background: white; border: 1px solid #cbd5e1; color: #2563eb; }
        .btn-docs:hover { background: #eff6ff; border-color: #60a5fa; }

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

                {/* COLUMNA IZQ: GESTIÓN CLUBS */}
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
                        <div style={{maxHeight:'400px', overflowY:'auto', paddingRight:'0.5rem'}}>
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

                {/* COLUMNA DER: SUPERVISIÓN */}
                <div className="card-panel">
                    <div className="card-header"><Search color="#f97316"/> <h2>Fichajes en Curso</h2></div>

                    <div style={{flex:1, overflowY:'auto', maxHeight:'600px'}}>
                        {loading ? <div style={{textAlign:'center', padding:'2rem'}}>Cargando datos...</div> :
                            fichajesPendientes.length === 0 ? (
                                <div style={{textAlign:'center', padding:'3rem', color:'#94a3b8', border:'2px dashed #e2e8f0', borderRadius:'12px'}}>
                                    <FileText size={48} style={{opacity:0.3, marginBottom:'1rem'}}/>
                                    <p>No hay transferencias pendientes.</p>
                                </div>
                            ) : (
                                fichajesPendientes.map(f => (
                                    <div key={f.id} className="pending-card">
                                        <div className="transfer-row">
                                            <strong style={{fontSize:'1.1rem'}}>{f.jugador}</strong>
                                            <span style={{fontWeight:700, color:'#2563eb', background:'#dbeafe', padding:'2px 8px', borderRadius:'6px'}}>{f.valor} ETH</span>
                                        </div>
                                        <div className="transfer-meta">
                                            <span>{f.origen}</span> <ArrowRightLeft size={14}/> <span>{f.destino}</span>
                                        </div>
                                        <div style={{marginTop:'1rem', display:'flex', gap:'0.5rem'}}>
                                            {/* BOTONES ACTIVOS AHORA */}
                                            <button
                                                onClick={() => handleAuditar(f)}
                                                className="btn-action btn-audit"
                                                style={{flex:1, padding:'0.5rem', borderRadius:'8px'}}
                                            >
                                                <ClipboardCheck size={16}/> Auditar
                                            </button>
                                            <button
                                                onClick={() => handleVerDocs(f.ipfsHash)}
                                                className="btn-action btn-docs"
                                                style={{flex:1, padding:'0.5rem', borderRadius:'8px'}}
                                            >
                                                <FileSearch size={16}/> Docs
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FederationView;