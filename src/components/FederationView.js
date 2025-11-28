import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import addresses from '../contracts/src/addresses';
import abi from '../contracts/src/FichajeContract.json';

const FederationView = () => {
  const [clubs, setClubs] = useState([]);
  const [nuevoClub, setNuevoClub] = useState({ direccion: "", nombre: "" });
  const [estadisticas, setEstadisticas] = useState({
    totalFichajes: 0,
    totalClubs: 0,
    fondosEnEscrow: "0 ETH"
  });
  const [fichajesPendientes, setFichajesPendientes] = useState([]);
  const [fichajeContract, setFichajeContract] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const inicializar = async () => {
      if (window.ethereum) {
        try {
          const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
          setProvider(web3Provider);
          
          const contrato = new ethers.Contract(
            addresses.fichajes,
            abi,
            web3Provider
          );
          setFichajeContract(contrato);
        } catch (error) {
          console.error("Error inicializando contrato:", error);
        }
      }
    };
    inicializar();
  }, []);

  useEffect(() => {
    if (fichajeContract) {
      cargarClubsAutorizados();
      cargarEstadisticas();
      cargarFichajesPendientes();
    }
  }, [fichajeContract]);

  const cargarClubsAutorizados = async () => {
    if (!fichajeContract) return;
    
    try {
      // Usar clubs predefinidos para desarrollo
      const clubsConocidos = [
        "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
        "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
        "0x518baf289d05b13b5f77f91ba7168d6d33146ae0"
      ];
      
      const clubsArray = [];
      
      for (const direccion of clubsConocidos) {
        try {
          const clubInfo = await fichajeContract.clubs(direccion);
          if (clubInfo.nombre && clubInfo.nombre !== "") {
            clubsArray.push({
              direccion: direccion,
              nombre: clubInfo.nombre,
              autorizado: clubInfo.autorizado,
              fechaRegistro: clubInfo.fechaRegistro ? new Date(clubInfo.fechaRegistro.toNumber() * 1000) : new Date()
            });
          }
        } catch (error) {
          console.log(`Club ${direccion} no encontrado`);
        }
      }
      
      setClubs(clubsArray);
    } catch (error) {
      console.error("Error cargando clubs:", error);
    }
  };

  const cargarEstadisticas = async () => {
    if (!fichajeContract) return;
    
    try {
      const totalFichajes = await fichajeContract.totalFichajes();
      
      setEstadisticas({
        totalFichajes: totalFichajes.toNumber(),
        totalClubs: clubs.length,
        fondosEnEscrow: "0 ETH",
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const cargarFichajesPendientes = async () => {
    if (!fichajeContract) return;
    
    try {
      const totalFichajes = await fichajeContract.totalFichajes();
      const pendientes = [];
      
      for (let i = 1; i <= totalFichajes.toNumber(); i++) {
        try {
          const fichaje = await fichajeContract.fichajes(i);
          if (!fichaje.aprobado) {
            const clubOrigenInfo = await fichajeContract.clubs(fichaje.clubes.clubOrigen);
            const clubDestinoInfo = await fichajeContract.clubs(fichaje.clubes.clubDestino);
            
            pendientes.push({
              id: i,
              jugador: fichaje.jugador.nombreJugador,
              origen: clubOrigenInfo.nombre,
              destino: clubDestinoInfo.nombre,
              valor: ethers.utils.formatEther(fichaje.valorTransferencia)
            });
          }
        } catch (error) {
          console.log(`Error cargando fichaje ${i}:`, error);
        }
      }
      
      setFichajesPendientes(pendientes);
    } catch (error) {
      console.error("Error cargando fichajes pendientes:", error);
    }
  };

  const autorizarClub = async () => {
    if (!fichajeContract || !provider || !nuevoClub.direccion || !nuevoClub.nombre) {
      alert("Completa todos los campos y conecta wallet");
      return;
    }
    
    try {
      const contratoConSigner = fichajeContract.connect(provider.getSigner());
      const tx = await contratoConSigner.autorizarClub(
        nuevoClub.direccion,
        nuevoClub.nombre
      );
      
      await tx.wait();
      alert("✅ Club autorizado correctamente");
      
      setNuevoClub({ direccion: "", nombre: "" });
      await cargarClubsAutorizados();
      await cargarEstadisticas();
      
    } catch (error) {
      console.error("Error autorizando club:", error);
      alert("❌ Error: " + error.message);
    }
  };

  const desautorizarClub = async (direccionClub) => {
    if (!fichajeContract || !provider) return;
    
    try {
      if (!confirm("¿Estás seguro de desautorizar este club?")) return;
      
      const contratoConSigner = fichajeContract.connect(provider.getSigner());
      const tx = await contratoConSigner.desautorizarClub(direccionClub);
      await tx.wait();
      
      alert("✅ Club desautorizado correctamente");
      await cargarClubsAutorizados();
      await cargarEstadisticas();
      
    } catch (error) {
      console.error("Error desautorizando club:", error);
      alert("❌ Error: " + error.message);
    }
  };

  const generarReporteComisiones = async () => {
    alert("📈 Reporte de comisiones - Por implementar");
  };

  const generarReporteFichajes = async () => {
    alert("📋 Reporte de fichajes - Por implementar");
  };

  const auditarTransacciones = async () => {
    alert("🔍 Auditoría de transacciones - Por implementar");
  };

  return (
    <div className="federation-dashboard">
      <header className="dashboard-header">
        <h1>🏛️ Panel de Control - Federación</h1>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Clubs Autorizados</h3>
            <p className="stat-number">{estadisticas.totalClubs}</p>
          </div>
          <div className="stat-card">
            <h3>Fichajes Totales</h3>
            <p className="stat-number">{estadisticas.totalFichajes}</p>
          </div>
          <div className="stat-card">
            <h3>Fondos en Escrow</h3>
            <p className="stat-number">{estadisticas.fondosEnEscrow}</p>
          </div>
        </div>
      </header>

      <div className="admin-sections">
        {/* Gestión de Clubs */}
        <section className="admin-section">
          <h2>👥 Gestión de Clubs</h2>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Dirección Ethereum del club"
              value={nuevoClub.direccion}
              onChange={(e) => setNuevoClub({...nuevoClub, direccion: e.target.value})}
            />
            <input
              type="text"
              placeholder="Nombre oficial del club"
              value={nuevoClub.nombre}
              onChange={(e) => setNuevoClub({...nuevoClub, nombre: e.target.value})}
            />
            <button onClick={autorizarClub} className="btn-primary">
              ✅ Autorizar Club
            </button>
          </div>

          <div className="clubs-list">
            <h3>Clubs Registrados ({clubs.length})</h3>
            {clubs.map((club, index) => (
              <div key={index} className="club-item">
                <span className="club-name">{club.nombre}</span>
                <span className="club-address">{club.direccion.substring(0, 10)}...</span>
                <span className={`status ${club.autorizado ? 'authorized' : 'unauthorized'}`}>
                  {club.autorizado ? '✅ Autorizado' : '❌ No autorizado'}
                </span>
                {club.autorizado && (
                  <button 
                    onClick={() => desautorizarClub(club.direccion)}
                    className="btn-danger"
                  >
                    Revocar Autorización
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Auditoría y Reportes */}
        <section className="admin-section">
          <h2>📊 Auditoría y Reportes</h2>
          <div className="report-actions">
            <button onClick={generarReporteComisiones} className="btn-info">
              📈 Reporte de Comisiones
            </button>
            <button onClick={generarReporteFichajes} className="btn-info">
              📋 Reporte de Fichajes
            </button>
            <button onClick={auditarTransacciones} className="btn-info">
              🔍 Auditoría de Transacciones
            </button>
          </div>
        </section>

        {/* Fichajes Pendientes de Revisión */}
        <section className="admin-section">
          <h2>⏳ Fichajes Pendientes ({fichajesPendientes.length})</h2>
          <div className="pending-transfers">
            {fichajesPendientes.map(fichaje => (
              <div key={fichaje.id} className="pending-item">
                <div className="transfer-info">
                  <strong>{fichaje.jugador}</strong>
                  <span>{fichaje.origen} → {fichaje.destino}</span>
                  <span>{fichaje.valor} ETH</span>
                </div>
                <div className="transfer-actions">
                  <button className="btn-success">✅ Aprobar</button>
                  <button className="btn-warning">📋 Revisar Documentos</button>
                </div>
              </div>
            ))}
            {fichajesPendientes.length === 0 && (
              <p style={{textAlign: 'center', color: '#666', fontStyle: 'italic'}}>
                No hay fichajes pendientes
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default FederationView;