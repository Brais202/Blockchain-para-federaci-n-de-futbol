import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";
import addresses from '../contracts/src/addresses';
import abi from '../contracts/src/FichajeContract.json';

const ClubView = ({ clubAddress }) => {
  const [fichajesClub, setFichajesClub] = useState([]);
  const [nuevoFichaje, setNuevoFichaje] = useState({
    nombreJugador: "",
    edad: "",
    clubDestino: "",
    valorTransferencia: "",
    agente: ""
  });
  const [estadisticasClub, setEstadisticasClub] = useState({});
  const [documentosPendientes, setDocumentosPendientes] = useState([]);
  const [fichajeContract, setFichajeContract] = useState(null);
  const [provider, setProvider] = useState(null);

  useEffect(() => {
    const inicializar = async () => {
      if (window.ethereum) {
        const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
        setProvider(web3Provider);
        
        const contrato = new ethers.Contract(
          addresses.fichajes,
          abi,
          web3Provider
        );
        setFichajeContract(contrato);
      }
    };
    inicializar();
  }, []);

  useEffect(() => {
    if (clubAddress && fichajeContract) {
      cargarFichajesClub();
      cargarEstadisticasClub();
    }
  }, [clubAddress, fichajeContract]);

  const cargarFichajesClub = async () => {
    if (!fichajeContract) return;
    
    try {
      const totalFichajes = await fichajeContract.totalFichajes();
      const fichajes = [];
      
      for (let i = 1; i <= totalFichajes.toNumber(); i++) {
        try {
          const fichaje = await fichajeContract.fichajes(i);
          if (fichaje.clubes.clubOrigen === clubAddress || fichaje.clubes.clubDestino === clubAddress) {
            const clubOrigenInfo = await fichajeContract.clubs(fichaje.clubes.clubOrigen);
            const clubDestinoInfo = await fichajeContract.clubs(fichaje.clubes.clubDestino);
            
            fichajes.push({
              id: i,
              ...fichaje,
              clubOrigenNombre: clubOrigenInfo.nombre,
              clubDestinoNombre: clubDestinoInfo.nombre,
              esClubOrigen: fichaje.clubes.clubOrigen === clubAddress,
              valorFormateado: ethers.utils.formatEther(fichaje.valorTransferencia)
            });
          }
        } catch (error) {
          console.log(`Error cargando fichaje ${i}:`, error);
        }
      }
      
      setFichajesClub(fichajes);
    } catch (error) {
      console.error("Error cargando fichajes del club:", error);
    }
  };

  const cargarEstadisticasClub = async () => {
    if (!fichajeContract) return;
    
    try {
      const totalFichajes = await fichajeContract.totalFichajes();
      let fichajesComoOrigen = 0;
      let fichajesComoDestino = 0;
      let valorTotal = 0;
      
      for (let i = 1; i <= totalFichajes.toNumber(); i++) {
        try {
          const fichaje = await fichajeContract.fichajes(i);
          if (fichaje.clubes.clubOrigen === clubAddress) {
            fichajesComoOrigen++;
            valorTotal += parseFloat(ethers.utils.formatEther(fichaje.valorTransferencia));
          }
          if (fichaje.clubes.clubDestino === clubAddress) {
            fichajesComoDestino++;
          }
        } catch (error) {
          continue;
        }
      }
      
      setEstadisticasClub({
        fichajesComoOrigen,
        fichajesComoDestino,
        totalFichajes: fichajesComoOrigen + fichajesComoDestino,
        valorTotal: valorTotal.toFixed(2)
      });
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  const registrarFichaje = async () => {
    if (!fichajeContract || !provider) return;
    
    try {
      if (!nuevoFichaje.nombreJugador || !nuevoFichaje.edad || 
          !nuevoFichaje.clubDestino || !nuevoFichaje.valorTransferencia) {
        alert("Por favor, completa todos los campos obligatorios");
        return;
      }

      const contratoConSigner = fichajeContract.connect(provider.getSigner());
      const tx = await contratoConSigner.registrarFichaje(
        nuevoFichaje.nombreJugador,
        parseInt(nuevoFichaje.edad),
        clubAddress, // El club origen es quien está conectado
        nuevoFichaje.clubDestino,
        ethers.utils.parseEther(nuevoFichaje.valorTransferencia),
        nuevoFichaje.agente || ethers.constants.AddressZero
      );
      
      await tx.wait();
      alert("✅ Fichaje registrado correctamente");
      
      // Limpiar formulario
      setNuevoFichaje({
        nombreJugador: "",
        edad: "",
        clubDestino: "",
        valorTransferencia: "",
        agente: ""
      });
      
      await cargarFichajesClub();
      await cargarEstadisticasClub();
      
    } catch (error) {
      console.error("Error registrando fichaje:", error);
      alert("❌ Error: " + error.message);
    }
  };

  const firmarFichaje = async (idFichaje) => {
    if (!fichajeContract || !provider) return;
    
    try {
      const contratoConSigner = fichajeContract.connect(provider.getSigner());
      const tx = await contratoConSigner.firmarFichaje(idFichaje);
      await tx.wait();
      
      alert("✅ Fichaje firmado correctamente");
      await cargarFichajesClub();
    } catch (error) {
      console.error("Error firmando fichaje:", error);
      alert("❌ Error: " + error.message);
    }
  };

  const depositarFondos = async (idFichaje, valor) => {
    if (!fichajeContract || !provider) return;
    
    try {
      const contratoConSigner = fichajeContract.connect(provider.getSigner());
      const tx = await contratoConSigner.depositarFondosEscrow(idFichaje, {
        value: ethers.utils.parseEther(valor)
      });
      await tx.wait();
      
      alert("✅ Fondos depositados correctamente");
      await cargarFichajesClub();
    } catch (error) {
      console.error("Error depositando fondos:", error);
      alert("❌ Error: " + error.message);
    }
  };

  const handleFileSelect = (e) => {
    console.log("Archivo seleccionado:", e.target.files[0]);
  };

  const subirDocumento = async () => {
    alert("📎 Función de subir documento - Por implementar");
  };

  const asociarDocumento = async (hash, fichajeId) => {
    alert("🔗 Función de asociar documento - Por implementar");
  };

  return (
    <div className="club-dashboard">
      <header className="dashboard-header">
        <h1>⚽ Panel del Club</h1>
        <div className="club-info">
          <h2>Bienvenido</h2>
          <p>Dirección: {clubAddress}</p>
          {estadisticasClub.totalFichajes > 0 && (
            <div className="stats-grid" style={{marginTop: '20px'}}>
              <div className="stat-card">
                <h3>Fichajes Totales</h3>
                <p className="stat-number">{estadisticasClub.totalFichajes}</p>
              </div>
              <div className="stat-card">
                <h3>Como Origen</h3>
                <p className="stat-number">{estadisticasClub.fichajesComoOrigen}</p>
              </div>
              <div className="stat-card">
                <h3>Valor Total</h3>
                <p className="stat-number">{estadisticasClub.valorTotal} ETH</p>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="club-sections">
        {/* Registro de Nuevo Fichaje */}
        <section className="club-section">
          <h2>📝 Registrar Nuevo Fichaje</h2>
          <div className="form-grid">
            <input
              type="text"
              placeholder="Nombre del Jugador *"
              value={nuevoFichaje.nombreJugador}
              onChange={(e) => setNuevoFichaje({...nuevoFichaje, nombreJugador: e.target.value})}
            />
            <input
              type="number"
              placeholder="Edad *"
              value={nuevoFichaje.edad}
              onChange={(e) => setNuevoFichaje({...nuevoFichaje, edad: e.target.value})}
            />
            <input
              type="text"
              placeholder="Club Destino (0x...) *"
              value={nuevoFichaje.clubDestino}
              onChange={(e) => setNuevoFichaje({...nuevoFichaje, clubDestino: e.target.value})}
            />
            <input
              type="text"
              placeholder="Valor Transferencia (ETH) *"
              value={nuevoFichaje.valorTransferencia}
              onChange={(e) => setNuevoFichaje({...nuevoFichaje, valorTransferencia: e.target.value})}
            />
            <input
              type="text"
              placeholder="Agente (0x...) - Opcional"
              value={nuevoFichaje.agente}
              onChange={(e) => setNuevoFichaje({...nuevoFichaje, agente: e.target.value})}
            />
            
            <button onClick={registrarFichaje} className="btn-primary">
              📄 Registrar Fichaje
            </button>
          </div>

          {/* Botones de prueba rápidos */}
          <div style={{marginTop: '15px'}}>
            <small>Pruebas rápidas:</small>
            <div>
              <button 
                onClick={() => setNuevoFichaje({
                  nombreJugador: "Jugador Prueba A",
                  edad: "25",
                  clubDestino: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                  valorTransferencia: "1.5",
                  agente: ""
                })} 
                className="btn-secondary"
                style={{margin: '5px', padding: '5px 10px', fontSize: '12px'}}
              >
                Ejemplo 1
              </button>
              <button 
                onClick={() => setNuevoFichaje({
                  nombreJugador: "Jugador Prueba B",
                  edad: "28", 
                  clubDestino: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
                  valorTransferencia: "2.0",
                  agente: ""
                })} 
                className="btn-secondary"
                style={{margin: '5px', padding: '5px 10px', fontSize: '12px'}}
              >
                Ejemplo 2
              </button>
            </div>
          </div>
        </section>

        {/* Fichajes del Club */}
        <section className="club-section">
          <h2>📋 Mis Fichajes ({fichajesClub.length})</h2>
          <div className="fichajes-list">
            {fichajesClub.map(fichaje => (
              <div key={fichaje.id} className="fichaje-item">
                <div className="fichaje-header">
                  <h4>{fichaje.jugador.nombreJugador}</h4>
                  <span className={`status ${fichaje.aprobado ? 'approved' : 'pending'}`}>
                    {fichaje.aprobado ? '✅ Completado' : '⏳ Pendiente'}
                  </span>
                </div>
                
                <div className="fichaje-details">
                  <p>
                    <strong>Transferencia:</strong> 
                    {fichaje.esClubOrigen ? 'Venta' : 'Compra'} - 
                    {fichaje.clubOrigenNombre} → {fichaje.clubDestinoNombre}
                  </p>
                  <p><strong>Valor:</strong> {fichaje.valorFormateado} ETH</p>
                  <p><strong>Firmas:</strong> Origen {fichaje.firmas.firmaOrigen ? '✅' : '❌'} | Destino {fichaje.firmas.firmaDestino ? '✅' : '❌'}</p>
                  <p><strong>Fondos:</strong> {fichaje.fondosDepositados ? '✅ Depositados' : '❌ Pendientes'}</p>
                </div>

                <div className="fichaje-actions">
                  {/* Botón para depositar fondos (solo club destino y si no están depositados) */}
                  {!fichaje.fondosDepositados && !fichaje.esClubOrigen && (
                    <button 
                      onClick={() => depositarFondos(fichaje.id, fichaje.valorFormateado)} 
                      className="btn-warning"
                    >
                      💰 Depositar Fondos
                    </button>
                  )}
                  
                  {/* Botón para firmar (solo si no está aprobado y fondos depositados) */}
                  {!fichaje.aprobado && fichaje.fondosDepositados && (
                    <button onClick={() => firmarFichaje(fichaje.id)} className="btn-success">
                      ✍️ {fichaje.esClubOrigen ? 'Firmar como Origen' : 'Firmar como Destino'}
                    </button>
                  )}
                  
                  {/* Ver documento si existe */}
                  {fichaje.ipfsHash && (
                    <a 
                      href={`http://127.0.0.1:8080/ipfs/${fichaje.ipfsHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary"
                    >
                      📄 Ver Documento
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Gestión Documental */}
        <section className="club-section">
          <h2>📎 Gestión Documental</h2>
          <div className="upload-section">
            <input type="file" onChange={handleFileSelect} />
            <button onClick={subirDocumento} className="btn-primary">
              ☁️ Subir a IPFS
            </button>
          </div>
          
          <div className="documentos-list">
            {documentosPendientes.length > 0 ? (
              documentosPendientes.map((doc, index) => (
                <div key={index} className="documento-item">
                  <span>{doc.nombre}</span>
                  <span>{doc.fecha}</span>
                  <button onClick={() => asociarDocumento(doc.hash, doc.fichajeId)}>
                    🔗 Asociar a Fichaje
                  </button>
                </div>
              ))
            ) : (
              <p style={{textAlign: 'center', color: '#666', fontStyle: 'italic'}}>
                No hay documentos pendientes
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ClubView;