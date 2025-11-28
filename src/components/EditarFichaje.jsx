import React, { useState } from 'react';

const EditarFichaje = ({ contrato, fichaje, onFichajeEditado }) => {
    const [editando, setEditando] = useState(false);
    const [formData, setFormData] = useState({
        nombreJugador: fichaje.nombreJugador,
        edad: fichaje.edad,
        valorTransferencia: fichaje.valorTransferencia,
        agente: fichaje.agente || ""
    });

    const editarFichaje = async () => {
        try {
            const contratoConSigner = contrato.connect(await contrato.signer);
            const tx = await contratoConSigner.editarFichaje(
                fichaje.id,
                formData.nombreJugador,
                parseInt(formData.edad),
                ethers.utils.parseEther(formData.valorTransferencia),
                formData.agente || ethers.constants.AddressZero
            );
            
            await tx.wait();
            alert("✅ Fichaje editado exitosamente");
            setEditando(false);
            if (onFichajeEditado) onFichajeEditado();
        } catch (error) {
            console.error("Error editando:", error);
            alert("❌ Error al editar: " + error.message);
        }
    };

    if (!editando) {
        return (
            <button 
                onClick={() => setEditando(true)} 
                className="btn btn-warning"
                disabled={fichaje.aprobado}
            >
                ✏️ Editar Fichaje
            </button>
        );
    }

    return (
        <div className="edicion-fichaje">
            <h4>✏️ Editar Fichaje</h4>
            
            <div className="form-group">
                <input
                    type="text"
                    placeholder="Nombre del Jugador"
                    value={formData.nombreJugador}
                    onChange={(e) => setFormData({...formData, nombreJugador: e.target.value})}
                />
                <input
                    type="number"
                    placeholder="Edad"
                    value={formData.edad}
                    onChange={(e) => setFormData({...formData, edad: e.target.value})}
                />
                <input
                    type="text"
                    placeholder="Valor Transferencia (ETH)"
                    value={formData.valorTransferencia}
                    onChange={(e) => setFormData({...formData, valorTransferencia: e.target.value})}
                />
                <input
                    type="text"
                    placeholder="Agente (opcional - 0x...)"
                    value={formData.agente}
                    onChange={(e) => setFormData({...formData, agente: e.target.value})}
                />
            </div>
            
            <div className="acciones-edicion">
                <button onClick={editarFichaje} className="btn btn-success">
                    💾 Guardar Cambios
                </button>
                <button 
                    onClick={() => setEditando(false)} 
                    className="btn btn-secondary"
                >
                    ❌ Cancelar
                </button>
            </div>
            
            <div className="advertencia-edicion">
                ⚠️ Al editar, las firmas existentes se resetearán
            </div>
        </div>
    );
};

export default EditarFichaje;
