// src/components/AdminClubs.jsx
import React, { useState, useEffect } from 'react';

const AdminClubs = ({ contrato }) => {
    const [clubs, setClubs] = useState([]);
    const [nuevoClub, setNuevoClub] = useState({ address: '', nombre: '' });
    const [esFederacion, setEsFederacion] = useState(false);

    useEffect(() => {
        verificarFederacion();
        cargarClubs();
    }, [contrato]);

    const verificarFederacion = async () => {
        try {
            const direccionFederacion = await contrato.federacion();
            const miDireccion = await contrato.signer.getAddress();
            setEsFederacion(miDireccion.toLowerCase() === direccionFederacion.toLowerCase());
        } catch (error) {
            console.error("Error verificando federacion:", error);
        }
    };

    const cargarClubs = async () => {
        try {
            const clubsAutorizados = await contrato.obtenerClubsAutorizados();
            const clubsInfo = [];
            
            for (let address of clubsAutorizados) {
                const club = await contrato.clubs(address);
                clubsInfo.push({
                    address: address,
                    nombre: club.nombre,
                    autorizado: club.autorizado,
                    fechaRegistro: club.fechaRegistro.toNumber()
                });
            }
            
            setClubs(clubsInfo);
        } catch (error) {
            console.error("Error cargando clubs:", error);
        }
    };

    const autorizarClub = async () => {
        try {
            const contratoConSigner = contrato.connect(await contrato.signer);
            const tx = await contratoConSigner.autorizarClub(nuevoClub.address, nuevoClub.nombre);
            await tx.wait();
            
            alert("✅ Club autorizado exitosamente");
            setNuevoClub({ address: '', nombre: '' });
            await cargarClubs();
        } catch (error) {
            console.error("Error autorizando club:", error);
            alert("❌ Error autorizando club: " + error.message);
        }
    };

    const desautorizarClub = async (clubAddress) => {
        try {
            const contratoConSigner = contrato.connect(await contrato.signer);
            const tx = await contratoConSigner.desautorizarClub(clubAddress);
            await tx.wait();
            
            alert("✅ Club desautorizado exitosamente");
            await cargarClubs();
        } catch (error) {
            console.error("Error desautorizando club:", error);
            alert("❌ Error desautorizando club: " + error.message);
        }
    };

    if (!esFederacion) {
        return (
            <div className="admin-section">
                <h3>🔐 Administración de Clubs</h3>
                <div className="no-permission">
                    ⚠️ Solo la federación puede acceder a esta sección
                </div>
            </div>
        );
    }

    return (
        <div className="admin-section">
            <h3>🏢 Administración de Clubs</h3>
            
            <div className="nuevo-club-form">
                <h4>➕ Autorizar Nuevo Club</h4>
                <div className="form-group">
                    <input
                        type="text"
                        placeholder="Address del club (0x...)"
                        value={nuevoClub.address}
                        onChange={(e) => setNuevoClub({...nuevoClub, address: e.target.value})}
                    />
                    <input
                        type="text"
                        placeholder="Nombre del club"
                        value={nuevoClub.nombre}
                        onChange={(e) => setNuevoClub({...nuevoClub, nombre: e.target.value})}
                    />
                    <button onClick={autorizarClub} className="btn btn-success">
                        ✅ Autorizar Club
                    </button>
                </div>
            </div>

            <div className="club-list">
                <h4>📋 Clubs Autorizados ({clubs.length})</h4>
                {clubs.map((club, index) => (
                    <div key={index} className="club-item">
                        <div className="club-info">
                            <strong>{club.nombre}</strong>
                            <div className="club-address">{club.address}</div>
                            <div className="club-fecha">
                                Registrado: {new Date(club.fechaRegistro * 1000).toLocaleDateString()}
                            </div>
                        </div>
                        <div className="club-actions">
                            <button 
                                onClick={() => desautorizarClub(club.address)}
                                className="btn btn-danger"
                            >
                                🚫 Desautorizar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminClubs;
