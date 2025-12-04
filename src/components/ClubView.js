import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from "ethers";
import { Navigate } from 'react-router-dom';
import { useContracts } from './Common/ContractContext';
import { User, FileText, ArrowRightLeft, DollarSign, Activity, CheckCircle, Search } from 'lucide-react';

const ClubView = () => {
    const { fichajeContract, cuenta, provider } = useContracts();

    // Estados UI
    const [activeTab, setActiveTab] = useState('misFichajes');
    const [loadingData, setLoadingData] = useState(false);

    // Datos
    const [fichajesData, setFichajesData] = useState({ misFichajes: [], mercadoGeneral: [] });
    const [estadisticas, setEstadisticas] = useState({ enviados: 0, recibidos: 0, gastado: 0, ingresado: 0 });
    const [nuevoFichaje, setNuevoFichaje] = useState({ nombreJugador: "", edad: "", clubDestino: "", valorTransferencia: "", agente: "" });

    // Eliminamos el estado de ingresosManuales

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

                    const fichajeBase = {
                        id: i,
                        nombreJugador: fichaje.jugador.nombreJugador,
                        edad: fichaje.jugador.edad.toString(),
                        valor: valorEth,
                        valorString: ethers.utils.formatEther(fichaje.valorTransferencia),
                        clubOrigenNombre: clubOrigenInfo.nombre || clubOrigen.substring(0,6) + "...",
                        clubDestinoNombre: clubDestinoInfo.nombre || clubDestino.substring(0,6) + "...",
                        aprobado: fichaje.aprobado,
                        fondosDepositados: fichaje.fondosDepositados,
                        firmaOrigen: fichaje.firmas.firmaOrigen,
                        firmaDestino: fichaje.firmas.firmaDestino,
                        esClubOrigen: clubOrigen === miCuenta
                    };

                    // --- CÁLCULO DE ESTADÍSTICAS ---
                    if (esMio) {
                        misOps.push(fichajeBase);

                        if (clubOrigen === miCuenta) {
                            stats.enviados++; // Soy el vendedor (Origen)
                            if (fichaje.aprobado) { stats.ingresado += valorEth; }
                        }

                        if (clubDestino === miCuenta) {
                            stats.recibidos++; // Soy el comprador (Destino)
                            if (fichaje.fondosDepositados || fichaje.aprobado) { stats.gastado += valorEth; }
                        }
                    } else {
                        mercado.push(fichajeBase);
                    }
                } catch (err) { console.error("Error leyendo fichaje", i); }
            }

            setFichajesData({ misFichajes: misOps.reverse(), mercadoGeneral: mercado.reverse() });
            setEstadisticas({
                ...stats,
                ingresado: stats.ingresado
            });

        } catch (error) {
            console.error("Error general:", error);
        } finally {
            setLoadingData(false);
        }
    }, [fichajeContract, cuenta]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const handleRegistrar = async (e) => {
        e.preventDefault();
        if (!fichajeContract || !provider) return;
        try {
            const signer = fichajeContract.connect(provider.getSigner());
            const valorWei = ethers.utils.parseEther(nuevoFichaje.valorTransferencia);
            const tx = await signer.registrarFichaje(
                nuevoFichaje.nombreJugador,
                parseInt(nuevoFichaje.edad),
                cuenta,
                nuevoFichaje.clubDestino,
                valorWei,
                nuevoFichaje.agente || ethers.constants.AddressZero
            );
            await tx.wait();
            alert("✅ Fichaje iniciado");
            setNuevoFichaje({ nombreJugador: "", edad: "", clubDestino: "", valorTransferencia: "", agente: "" });
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
        /* Botón de añadir fondos eliminado */
        .tabs { background: white; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .tab-head { display: flex; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 0.5rem 1rem 0; }
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
        .modal-bg { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 999; backdrop-filter: blur(2px); }
        .modal { background: white; padding: 2rem; border-radius: 16px; width: 100%; max-width: 400px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1); }
        .close-btn { float: right; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #94a3b8; }

        .fichaje-type {
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            padding: 2px 6px;
            border-radius: 4px;
            margin-left: 0.5rem;
        }
        .fichaje-out { background: #fee2e2; color: #991b1b; }
        .fichaje-in { background: #dbeafe; color: #1e40af; }
        .fichaje-global { background: #fef3c7; color: #92400e; }

      `}</style>

            {/* Eliminamos el Modal de Ingreso Manual */}

            <div className="stats-grid">
                <div className="stat-card">
                    <div className="icon-box bg-blue"><ArrowRightLeft size={24} /></div>
                    <div className="stat-info"><p>Operaciones Propias</p><h3>{fichajesData.misFichajes.length}</h3></div>
                </div>
                <div className="stat-card">
                    <div className="icon-box bg-green"><DollarSign size={24} /></div>
                    <div className="stat-info"><p>Gastado (Compras)</p><h3>{estadisticas.gastado.toFixed(2)} ETH</h3></div>
                </div>
                <div className="stat-card">
                    {/* Se elimina el botón de añadir fondos */}
                    <div className="icon-box bg-purple"><Activity size={24} /></div>
                    <div className="stat-info"><p>Ingresado (Ventas)</p><h3>{estadisticas.ingresado.toFixed(2)} ETH</h3></div>
                </div>
            </div>

            <div className="tabs">
                <div className="tab-head">
                    <button className={`tab-btn ${activeTab === 'misFichajes' ? 'active' : ''}`} onClick={() => setActiveTab('misFichajes')}>
                        <User size={18} /> Mis Fichajes
                    </button>
                    <button className={`tab-btn ${activeTab === 'mercadoGlobal' ? 'active' : ''}`} onClick={() => setActiveTab('mercadoGlobal')}>
                        <Search size={18} /> Mercado Global
                    </button>
                    <button className={`tab-btn ${activeTab === 'nuevo' ? 'active' : ''}`} onClick={() => setActiveTab('nuevo')}>
                        <ArrowRightLeft size={18} /> Nuevo Traspaso
                    </button>
                    <button className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
                        <FileText size={18} /> Docs
                    </button>
                </div>

                <div className="tab-body">
                    {activeTab === 'misFichajes' && (
                        <div className="table-wrap">
                            {loadingData ? <div style={{textAlign:'center', padding:'2rem', color:'#64748b'}}>Cargando...</div> :
                                fichajesData.misFichajes.length === 0 ? <div style={{textAlign:'center', padding:'2rem', color:'#64748b'}}>No hay operaciones en curso.</div> :
                                    <table className="table">
                                        <thead><tr><th>Jugador</th><th>Tipo</th><th>Origen</th><th>Destino</th><th>Valor</th><th>Estado</th><th>Acción</th></tr></thead>
                                        <tbody>
                                        {fichajesData.misFichajes.map(f => (
                                            <tr key={f.id}>
                                                <td>
                                                    <strong>{f.nombreJugador}</strong><br/>
                                                    <small style={{color:'#64748b'}}>{f.edad} años</small>
                                                </td>
                                                <td>
                            <span className={`fichaje-type ${f.esClubOrigen ? 'fichaje-out' : 'fichaje-in'}`}>
                                {f.esClubOrigen ? 'VENTA' : 'COMPRA'}
                            </span>
                                                </td>
                                                <td>{f.clubOrigenNombre}</td>
                                                <td>{f.clubDestinoNombre}</td>
                                                <td style={{fontFamily:'monospace', fontWeight:600}}>{f.valor.toFixed(4)} ETH</td>
                                                <td>{f.aprobado ? <span className="badge badge-ok">Completado</span> : <span className="badge badge-wait">En Proceso</span>}</td>
                                                <td>
                                                    {!f.aprobado && (
                                                        <>
                                                            {/* Botón Pagar (Soy Destino y no he depositado) */}
                                                            {!f.esClubOrigen && !f.fondosDepositados && <button onClick={() => handleDepositarEnFichaje(f.id, f.valorString)} className="btn btn-pay">Pagar</button>}

                                                            {/* Botón Firmar (Fondos depositados Y me falta mi firma) */}
                                                            {f.fondosDepositados && ((!f.esClubOrigen && !f.firmaDestino) || (f.esClubOrigen && !f.firmaOrigen) ? <button onClick={() => handleFirmar(f.id)} className="btn btn-primary"><CheckCircle size={14}/> Firmar</button> : <span style={{fontSize:'0.8rem', color:'#64748b'}}>Esperando firma...</span>)}

                                                            {/* Mensaje de Espera (Soy Origen y no han depositado) */}
                                                            {f.esClubOrigen && !f.fondosDepositados && <span style={{fontSize:'0.8rem', color:'#eab308'}}>⏳ Esperando pago</span>}
                                                        </>
                                                    )}
                                                    {f.aprobado && <span style={{color:'#16a34a', fontSize:'1.2rem'}}>✓</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                            }
                        </div>
                    )}

                    {activeTab === 'mercadoGlobal' && (
                        <div className="table-wrap">
                            {loadingData ? <div style={{textAlign:'center', padding:'2rem', color:'#64748b'}}>Cargando...</div> :
                                fichajesData.mercadoGeneral.length === 0 ? <div style={{textAlign:'center', padding:'2rem', color:'#64748b'}}>No hay actividad en el mercado global.</div> :
                                    <table className="table">
                                        <thead><tr><th>Jugador</th><th>Origen</th><th>Destino</th><th>Valor</th><th>Estado</th></tr></thead>
                                        <tbody>
                                        {fichajesData.mercadoGeneral.map(f => (
                                            <tr key={f.id}>
                                                <td><strong>{f.nombreJugador}</strong><br/><small style={{color:'#64748b'}}>{f.edad} años</small></td>
                                                <td>{f.clubOrigenNombre}</td>
                                                <td>{f.clubDestinoNombre}</td>
                                                <td style={{fontFamily:'monospace', fontWeight:600}}>{f.valor.toFixed(4)} ETH</td>
                                                <td>
                                                    {f.aprobado ? <span className="badge badge-ok">Completado</span> : <span className="badge badge-wait">En Proceso</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                            }
                        </div>
                    )}

                    {activeTab === 'nuevo' && (
                        <form onSubmit={handleRegistrar} style={{maxWidth:'600px', margin:'0 auto'}}>
                            <div className="form-row">
                                <div><label style={{fontWeight:600, color:'#64748b', fontSize:'0.9rem'}}>Jugador</label><input required className="input" value={nuevoFichaje.nombreJugador} onChange={e=>setNuevoFichaje({...nuevoFichaje, nombreJugador:e.target.value})} /></div>
                                <div><label style={{fontWeight:600, color:'#64748b', fontSize:'0.9rem'}}>Edad</label><input type="number" required className="input" value={nuevoFichaje.edad} onChange={e=>setNuevoFichaje({...nuevoFichaje, edad:e.target.value})} /></div>
                            </div>
                            <div style={{marginBottom:'1rem'}}><label style={{fontWeight:600, color:'#64748b', fontSize:'0.9rem'}}>Club Destino (Address)</label><input required className="input" value={nuevoFichaje.clubDestino} onChange={e=>setNuevoFichaje({...nuevoFichaje, clubDestino:e.target.value})} placeholder="0x..." /></div>
                            <div className="form-row">
                                <div><label style={{fontWeight:600, color:'#64748b', fontSize:'0.9rem'}}>Valor (ETH)</label><input type="number" step="0.0001" required className="input" value={nuevoFichaje.valorTransferencia} onChange={e=>setNuevoFichaje({...nuevoFichaje, valorTransferencia:e.target.value})} /></div>
                                <div><label style={{fontWeight:600, color:'#64748b', fontSize:'0.9rem'}}>Agente</label><input className="input" value={nuevoFichaje.agente} onChange={e=>setNuevoFichaje({...nuevoFichaje, agente:e.target.value})} placeholder="0x..." /></div>
                            </div>
                            <button type="submit" className="btn btn-primary" style={{width:'100%', justifyContent:'center', padding:'1rem', marginTop:'1rem'}}>Registrar en Blockchain</button>
                        </form>
                    )}

                    {activeTab === 'docs' && <div style={{textAlign:'center', padding:'3rem', color:'#94a3b8'}}><FileText size={48}/><p>Gestión Documental</p></div>}
                </div>
            </div>
        </div>
    );
};

export default ClubView;