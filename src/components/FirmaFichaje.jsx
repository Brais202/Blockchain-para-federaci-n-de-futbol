import React, { useState, useEffect } from 'react';

const FirmaFichaje = ({ contrato, fichajeId }) => {
    const [estadoFirmas, setEstadoFirmas] = useState({
        firmaOrigen: false,
        firmaDestino: false,
        completamenteFirmado: false
    });
    const [miClub, setMiClub] = useState('');

    useEffect(() => {
        cargarEstadoFirmas();
        determinarMiRol();
    }, [fichajeId]);

    const cargarEstadoFirmas = async () => {
        try {
            const fichaje = await contrato.fichajes(fichajeId);
            setEstadoFirmas({
                firmaOrigen: fichaje.firmas.firmaOrigen,
                firmaDestino: fichaje.firmas.firmaDestino,
                completamenteFirmado: fichaje.firmas.firmaOrigen && fichaje.firmas.firmaDestino
            });
        } catch (error) {
            console.error("Error cargando estado de firmas:", error);
        }
    };

    const determinarMiRol = async () => {
        try {
            const fichaje = await contrato.fichajes(fichajeId);
            const miDireccion = await contrato.signer.getAddress();
            
            if (miDireccion.toLowerCase() === fichaje.clubes.clubOrigen.toLowerCase()) {
                setMiClub('origen');
            } else if (miDireccion.toLowerCase() === fichaje.clubes.clubDestino.toLowerCase()) {
                setMiClub('destino');
            } else {
                setMiClub('ninguno');
            }
        } catch (error) {
            console.error("Error determinando rol:", error);
        }
    };

    const firmarFichaje = async () => {
        try {
            const contratoConSigner = contrato.connect(await contrato.signer);
            const tx = await contratoConSigner.firmarFichaje(fichajeId);
            await tx.wait();
            
            alert("✅ Firma registrada exitosamente");
            await cargarEstadoFirmas();
        } catch (error) {
            console.error("Error firmando:", error);
            alert("❌ Error al firmar: " + error.message);
        }
    };

    const puedeFirmar = () => {
        if (miClub === 'origen') return !estadoFirmas.firmaOrigen;
        if (miClub === 'destino') return !estadoFirmas.firmaDestino;
        return false;
    };

    return (
        <div className="firma-section">
            <h3>📝 Firmas del Fichaje</h3>
            
            <div className="estado-firmas">
                <div className={`firma-item ${estadoFirmas.firmaOrigen ? 'firmado' : 'pendiente'}`}>
                    <span>Club Origen:</span>
                    <strong>{estadoFirmas.firmaOrigen ? '✅ Firmado' : '⏳ Pendiente'}</strong>
                </div>
                
                <div className={`firma-item ${estadoFirmas.firmaDestino ? 'firmado' : 'pendiente'}`}>
                    <span>Club Destino:</span>
                    <strong>{estadoFirmas.firmaDestino ? '✅ Firmado' : '⏳ Pendiente'}</strong>
                </div>
            </div>

            {estadoFirmas.completamenteFirmado ? (
                <div className="completamente-firmado">
                    🎉 ¡Fichaje completamente firmado y aprobado!
                </div>
            ) : (
                <div className="acciones-firma">
                    {puedeFirmar() ? (
                        <button onClick={firmarFichaje} className="btn btn-success">
                            ✍️ Firmar Fichaje como Club {miClub === 'origen' ? 'Origen' : 'Destino'}
                        </button>
                    ) : miClub !== 'ninguno' ? (
                        <div className="ya-firmado">
                            ✅ Ya has firmado este fichaje
                        </div>
                    ) : (
                        <div className="no-participante">
                            ℹ️ No eres participante de este fichaje
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FirmaFichaje;
