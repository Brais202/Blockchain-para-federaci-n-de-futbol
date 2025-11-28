import React, { useState, useEffect } from 'react';
import { ethers } from "ethers";

const GestionFondos = ({ contrato, fichaje }) => {
    const [estadoFondos, setEstadoFondos] = useState({
        depositados: false,
        monto: 0,
        puedeDepositar: false,
        puedeReembolsar: false
    });

    useEffect(() => {
        cargarEstadoFondos();
    }, [fichaje]);

    const cargarEstadoFondos = async () => {
        try {
            const miDireccion = await contrato.signer.getAddress();
            const puedeDepositar = miDireccion.toLowerCase() === fichaje.clubDestino.toLowerCase();
            const puedeReembolsar = puedeDepositar && !fichaje.aprobado && fichaje.fondosDepositados;

            setEstadoFondos({
                depositados: fichaje.fondosDepositados,
                monto: fichaje.fondosEnEscrow,
                puedeDepositar,
                puedeReembolsar
            });
        } catch (error) {
            console.error("Error cargando estado de fondos:", error);
        }
    };

    const depositarFondos = async () => {
        try {
            const contratoConSigner = contrato.connect(await contrato.signer);
            const valorWei = ethers.utils.parseEther(fichaje.valorTransferencia.toString());
            
            const tx = await contratoConSigner.depositarFondosEscrow(fichaje.id, {
                value: valorWei
            });
            
            await tx.wait();
            alert("✅ Fondos depositados en Escrow exitosamente");
            await cargarEstadoFondos();
        } catch (error) {
            console.error("Error depositando fondos:", error);
            alert("❌ Error al depositar fondos: " + error.message);
        }
    };

    const reembolsarFondos = async () => {
        try {
            const contratoConSigner = contrato.connect(await contrato.signer);
            const tx = await contratoConSigner.reembolsarFondos(fichaje.id);
            
            await tx.wait();
            alert("✅ Fondos reembolsados exitosamente");
            await cargarEstadoFondos();
        } catch (error) {
            console.error("Error reembolsando fondos:", error);
            alert("❌ Error al reembolsar fondos: " + error.message);
        }
    };

    if (fichaje.aprobado && fichaje.fondosDepositados) {
        return (
            <div className="estado-fondos aprobado">
                <h4>💰 Fondos Distribuidos</h4>
                <div className="distribucion">
                    <p>✅ Club Origen: 90%</p>
                    <p>✅ Derechos Formación: 5%</p>
                    <p>✅ Agente: 5%</p>
                </div>
            </div>
        );
    }

    return (
        <div className="gestion-fondos">
            <h4>💰 Gestión de Fondos</h4>
            
            <div className="estado-fondos">
                <p><strong>Estado:</strong> {estadoFondos.depositados ? '✅ Depositados' : '❌ No depositados'}</p>
                <p><strong>Monto en Escrow:</strong> {ethers.utils.formatEther(estadoFondos.monto.toString())} ETH</p>
                <p><strong>Valor Transferencia:</strong> {fichaje.valorTransferencia} ETH</p>
            </div>

            <div className="acciones-fondos">
                {estadoFondos.puedeDepositar && !estadoFondos.depositados && (
                    <button onClick={depositarFondos} className="btn btn-success">
                        💰 Depositar {fichaje.valorTransferencia} ETH en Escrow
                    </button>
                )}
                
                {estadoFondos.puedeReembolsar && (
                    <button onClick={reembolsarFondos} className="btn btn-warning">
                        ↩️ Reembolsar Fondos
                    </button>
                )}
            </div>

            {estadoFondos.depositados && !fichaje.aprobado && (
                <div className="info-escrow">
                    <p>⏳ Fondos bloqueados en Escrow esperando aprobación...</p>
                </div>
            )}
        </div>
    );
};

export default GestionFondos;
