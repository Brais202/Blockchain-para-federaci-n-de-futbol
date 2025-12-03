import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from "ethers";
import { Navigate } from 'react-router-dom';
import { useContracts } from './Common/ContractContext';
import { User, FileText, ArrowRightLeft, DollarSign, Activity, CheckCircle, Wallet } from 'lucide-react';

const ClubView = () => {
    const { fichajeContract, cuenta, provider } = useContracts();

    // Estados UI
    const [activeTab, setActiveTab] = useState('mercado');
    const [loadingData, setLoadingData] = useState(false);

    // Datos
    const [fichajesClub, setFichajesClub] = useState([]);
    const [estadisticas, setEstadisticas] = useState({ enviados: 0, recibidos: 0, gastado: '0.0', ingresado: '0.0' });
    const [nuevoFichaje, setNuevoFichaje] = useState({ nombreJugador: "", edad: "", clubDestino: "", valorTransferencia: "", agente: "" });

    const cargarDatos = useCallback(async () => {
        if (!fichajeContract || !cuenta) return;
        setLoadingData(true);

        try {
            const totalFichajesBN = await fichajeContract.totalFichajes();
            const total = totalFichajesBN.toNumber();
            const tempFichajes = [];
            let stats = { enviados: 0, recibidos: 0, gastado: 0.0, ingresado: 0.0 };

            for (let i = 1; i <= total; i++) {
                const fichaje = await fichajeContract.fichajes(i);
                const clubOrigen = fichaje.clubes.clubOrigen.toLowerCase();
                const clubDestino = fichaje.clubes.clubDestino.toLowerCase();
                const miCuenta = cuenta.toLowerCase();

                if (clubOrigen === miCuenta || clubDestino === miCuenta) {
                    const clubOrigenInfo = await fichajeContract.clubs(fichaje.clubes.clubOrigen);
                    const clubDestinoInfo = await fichajeContract.clubs(fichaje.clubes.clubDestino);
                    const valorEth = parseFloat(ethers.utils.formatEther(fichaje.valorTransferencia));

                    if (clubOrigen === miCuenta) {
                        stats.enviados++;
                        if (fichaje.estado === 2) stats.ingresado += valorEth;
                    } else {
                        stats.recibidos++;
                        if (fichaje.estado === 2) stats.gastado += valorEth;
                    }

                    tempFichajes.push({
                        id: i,
                        nombreJugador: fichaje.jugador.nombreJugador,
                        edad: fichaje.jugador.edad.toString(),
                        valor: valorEth, // Guardamos como número para cálculos
                        valorString: ethers.utils.formatEther(fichaje.valorTransferencia), // Guardamos como string para evitar errores de precisión al depositar
                        clubOrigenNombre: clubOrigenInfo.nombre,
                        clubDestinoNombre: clubDestinoInfo.nombre,
                        aprobado: fichaje.aprobado,
                        fondosDepositados: fichaje.fondosDepositados, // <--- IMPORTANTE: Leemos si ya hay dinero
                        firmaOrigen: fichaje.firmas.firmaOrigen,
                        firmaDestino: fichaje.firmas.firmaDestino,
                        esClubOrigen: clubOrigen === miCuenta
                    });
                }
            }
            setFichajesClub(tempFichajes.reverse());
            setEstadisticas({ ...stats, gastado: stats.gastado.toFixed(2), ingresado: stats.ingresado.toFixed(2) });
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoadingData(false);
        }
    }, [fichajeContract, cuenta]);

    useEffect(() => { cargarDatos(); }, [cargarDatos]);

    const handleRegistrar = async (e) => {
        e.preventDefault();
        if (!fichajeContract || !provider) return;
        try {
            const contratoSigner = fichajeContract.connect(provider.getSigner());
            const valorWei = ethers.utils.parseEther(nuevoFichaje.valorTransferencia);
            const tx = await contratoSigner.registrarFichaje(nuevoFichaje.nombreJugador, parseInt(nuevoFichaje.edad), cuenta, nuevoFichaje.clubDestino, valorWei, nuevoFichaje.agente || ethers.constants.AddressZero);
            await tx.wait();
            alert("✅ Fichaje iniciado");
            setNuevoFichaje({ nombreJugador: "", edad: "", clubDestino: "", valorTransferencia: "", agente: "" });
            cargarDatos();
            setActiveTab('mercado');
        } catch (error) { console.error(error); alert("Error: " + error.message); }
    };

    // --- NUEVA FUNCIÓN: DEPOSITAR ---
    const handleDepositar = async (id, valorString) => {
        if (!fichajeContract || !provider) return;
        try {
            const contratoSigner = fichajeContract.connect(provider.getSigner());
            // Convertimos el valor exacto a Wei para enviarlo
            const valorWei = ethers.utils.parseEther(valorString);

            // Llamamos a la función payable con el valor adjunto
            const tx = await contratoSigner.depositarFondosEscrow(id, { value: valorWei });
            await tx.wait();

            alert("💰 Fondos depositados correctamente en custodia.");
            cargarDatos();
        } catch (error) {
            console.error(error);
            alert("Error al depositar: " + (error.reason || error.message));
        }
    };

    const handleFirmar = async (id) => {
        if (!fichajeContract) return;
        try {
            const contratoSigner = fichajeContract.connect(provider.getSigner());
            const tx = await contratoSigner.firmarFichaje(id);
            await tx.wait();
            cargarDatos();
        } catch (error) { console.error(error); alert("Error al firmar: " + (error.reason || error.message)); }
    };

    if (!cuenta) return <Navigate to="/" replace />;

    return (
        <div className="premium-dashboard">
            <style>{`
        .premium-dashboard {
          max-width: 1400px; margin: 0 auto; padding: 2rem;
          font-family: 'Inter', sans-serif; background: #f8fafc; min-height: 100vh;
        }
        
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2.5rem; }
        .stat-card { background: white; padding: 1.5rem; border-radius: 16px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); display: flex; align-items: center; gap: 1.25rem; transition: transform 0.2s; }
        .stat-card:hover { transform: translateY(-4px); }
        .icon-box { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; font-size: 1.5rem; }
        .icon-blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
        .icon-green { background: linear-gradient(135deg, #34d399, #059669); }
        .icon-purple { background: linear-gradient(135deg, #a78bfa, #7c3aed); }
        .stat-content h3 { font-size: 1.5rem; font-weight: 800; margin: 0; color: #0f172a; }
        .stat-content p { margin: 0; font-size: 0.85rem; color: #64748b; font-weight: 600; text-transform: uppercase; }

        .tabs-container { background: white; border-radius: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); overflow: hidden; border: 1px solid #e2e8f0; }
        .tabs-header { display: flex; background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 0.5rem 1rem 0; }
        .tab-btn { padding: 1rem 1.5rem; border: none; background: transparent; color: #64748b; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border-radius: 12px 12px 0 0; transition: all 0.2s; }
        .tab-btn:hover { color: #3b82f6; background: rgba(59,130,246,0.05); }
        .tab-btn.active { background: white; color: #2563eb; border: 1px solid #e2e8f0; border-bottom: none; box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.02); }
        .tab-content { padding: 2rem; }

        .table-responsive { overflow-x: auto; }
        .pro-table { width: 100%; border-collapse: collapse; }
        .pro-table th { text-align: left; padding: 1rem; font-size: 0.75rem; text-transform: uppercase; color: #64748b; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
        .pro-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #1e293b; }
        .pro-table tr:hover td { background: #f8fafc; }

        .badge { padding: 4px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px; }
        .badge-success { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fef3c7; color: #92400e; }

        .btn-action { border: none; padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 0.4rem; transition: transform 0.1s; }
        .btn-action:active { transform: scale(0.98); }
        
        .btn-primary { background: #2563eb; color: white; }
        .btn-primary:hover { background: #1d4ed8; }
        
        .btn-pay { background: #10b981; color: white; }
        .btn-pay:hover { background: #059669; }

        .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; max-width: 800px; margin: 0 auto; }
        .full-width { grid-column: 1 / -1; }
        .input-group label { display: block; margin-bottom: 0.5rem; font-weight: 600; color: #64748b; font-size: 0.9rem; }
        .styled-input { width: 100%; padding: 0.8rem; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 1rem; transition: all 0.2s; }
        .styled-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
      `}</style>

            {/* HEADER DE ESTADÍSTICAS */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="icon-box icon-blue"><ArrowRightLeft size={24} /></div>
                    <div className="stat-content">
                        <p>Operaciones</p>
                        <h3>{fichajesClub.length}</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="icon-box icon-green"><DollarSign size={24} /></div>
                    <div className="stat-content">
                        <p>Invertido</p>
                        <h3>{estadisticas.gastado} ETH</h3>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="icon-box icon-purple"><Activity size={24} /></div>
                    <div className="stat-content">
                        <p>Ingresado</p>
                        <h3>{estadisticas.ingresado} ETH</h3>
                    </div>
                </div>
            </div>

            {/* PESTAÑAS Y CONTENIDO */}
            <div className="tabs-container">
                <div className="tabs-header">
                    <button className={`tab-btn ${activeTab === 'mercado' ? 'active' : ''}`} onClick={() => setActiveTab('mercado')}>
                        <ArrowRightLeft size={18} /> Mercado
                    </button>
                    <button className={`tab-btn ${activeTab === 'nuevo' ? 'active' : ''}`} onClick={() => setActiveTab('nuevo')}>
                        <User size={18} /> Nuevo Traspaso
                    </button>
                    <button className={`tab-btn ${activeTab === 'docs' ? 'active' : ''}`} onClick={() => setActiveTab('docs')}>
                        <FileText size={18} /> Documentación
                    </button>
                </div>

                <div className="tab-content">
                    {activeTab === 'mercado' && (
                        <div className="table-responsive">
                            {loadingData ? <div style={{textAlign:'center', padding:'3rem', color:'#64748b'}}>Cargando...</div> :
                                fichajesClub.length === 0 ? <div style={{textAlign:'center', padding:'3rem', color:'#64748b'}}>No hay operaciones.</div> :
                                    <table className="pro-table">
                                        <thead>
                                        <tr><th>Jugador</th><th>Origen</th><th>Destino</th><th>Valor</th><th>Estado</th><th>Firmas</th><th>Acción</th></tr>
                                        </thead>
                                        <tbody>
                                        {fichajesClub.map((f) => (
                                            <tr key={f.id}>
                                                <td><div style={{fontWeight:600}}>{f.nombreJugador}</div><div style={{fontSize:'0.8rem', color:'#64748b'}}>{f.edad} años</div></td>
                                                <td>{f.clubOrigenNombre}</td><td>{f.clubDestinoNombre}</td><td style={{fontFamily:'monospace', fontWeight:600}}>{f.valor} ETH</td>
                                                <td>{f.aprobado ? <span className="badge badge-success">Completado</span> : <span className="badge badge-pending">En Proceso</span>}</td>
                                                <td>
                                                    <div style={{display:'flex', gap:'5px'}}>
                                                        <div title="Firma Origen" style={{width:10, height:10, borderRadius:'50%', background: f.firmaOrigen ? '#16a34a' : '#cbd5e1'}}></div>
                                                        <div title="Firma Destino" style={{width:10, height:10, borderRadius:'50%', background: f.firmaDestino ? '#16a34a' : '#cbd5e1'}}></div>
                                                    </div>
                                                </td>
                                                <td>
                                                    {/* LÓGICA INTELIGENTE DE BOTONES */}
                                                    {!f.aprobado && (
                                                        <>
                                                            {/* CASO 1: Soy Comprador y NO hay dinero -> Botón Pagar */}
                                                            {!f.esClubOrigen && !f.fondosDepositados && (
                                                                <button
                                                                    onClick={() => handleDepositar(f.id, f.valorString)}
                                                                    className="btn-action btn-pay"
                                                                >
                                                                    <DollarSign size={14}/> Depositar
                                                                </button>
                                                            )}

                                                            {/* CASO 2: Hay dinero -> Botón Firmar (si me falta mi firma) */}
                                                            {f.fondosDepositados && (
                                                                ((f.esClubOrigen && !f.firmaOrigen) || (!f.esClubOrigen && !f.firmaDestino)) ? (
                                                                    <button onClick={() => handleFirmar(f.id)} className="btn-action btn-primary">
                                                                        <CheckCircle size={14}/> Firmar
                                                                    </button>
                                                                ) : null
                                                            )}

                                                            {/* CASO 3: Soy Vendedor y NO hay dinero -> Mensaje Espera */}
                                                            {f.esClubOrigen && !f.fondosDepositados && (
                                                                <span style={{fontSize:'0.8rem', color:'#f59e0b', fontStyle:'italic', fontWeight:500}}>
                                ⏳ Esperando pago...
                              </span>
                                                            )}
                                                        </>
                                                    )}

                                                    {f.aprobado && <span style={{color:'#10b981', fontSize:'0.8rem'}}>✅ Finalizado</span>}
                                                </td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>}
                        </div>
                    )}

                    {activeTab === 'nuevo' && (
                        <div className="form-grid">
                            <div className="full-width" style={{textAlign:'center', marginBottom:'1rem'}}>
                                <h3>Iniciar Nueva Operación</h3>
                            </div>
                            <form className="full-width form-grid" onSubmit={handleRegistrar}>
                                <div className="input-group"><label>Nombre Jugador</label><input required className="styled-input" value={nuevoFichaje.nombreJugador} onChange={e=>setNuevoFichaje({...nuevoFichaje, nombreJugador:e.target.value})} placeholder="Ej. Lamine Yamal" /></div>
                                <div className="input-group"><label>Edad</label><input type="number" required className="styled-input" value={nuevoFichaje.edad} onChange={e=>setNuevoFichaje({...nuevoFichaje, edad:e.target.value})} placeholder="19" /></div>
                                <div className="input-group full-width"><label>Wallet Club Destino</label><input required className="styled-input" value={nuevoFichaje.clubDestino} onChange={e=>setNuevoFichaje({...nuevoFichaje, clubDestino:e.target.value})} placeholder="0x..." /></div>
                                <div className="input-group"><label>Valor (ETH)</label><input type="number" step="0.0001" required className="styled-input" value={nuevoFichaje.valorTransferencia} onChange={e=>setNuevoFichaje({...nuevoFichaje, valorTransferencia:e.target.value})} placeholder="0.00" /></div>
                                <div className="input-group"><label>Agente (Opcional)</label><input className="styled-input" value={nuevoFichaje.agente} onChange={e=>setNuevoFichaje({...nuevoFichaje, agente:e.target.value})} placeholder="0x..." /></div>
                                <div className="full-width" style={{marginTop:'1rem'}}><button type="submit" className="btn-action btn-primary" style={{width:'100%', justifyContent:'center', padding:'1rem'}}>Registrar en Blockchain</button></div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'docs' && <div style={{textAlign:'center', padding:'4rem', color:'#94a3b8'}}><FileText size={48} /><p>Gestión IPFS en desarrollo.</p></div>}
                </div>
            </div>
        </div>
    );
};

export default ClubView;