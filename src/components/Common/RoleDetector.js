import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useContracts } from './ContractContext';

const RoleContext = createContext();

export const useRoles = () => {
    const context = useContext(RoleContext);
    if (!context) {
        throw new Error('useRoles debe usarse dentro de RoleProvider');
    }
    return context;
};

export const RoleProvider = ({ children }) => {
    const { cuenta, fichajeContract } = useContracts();
    const [roles, setRoles] = useState({
        esFederacion: false,
        esClubAutorizado: false,
        clubInfo: null,
        loading: true
    });

    const detectarRoles = useCallback(async () => {
        // Si no hay cuenta, reseteamos y terminamos
        if (!cuenta || !fichajeContract) {
            setRoles({ esFederacion: false, esClubAutorizado: false, clubInfo: null, loading: false });
            return;
        }

        // --- ⚡ MODO DIOS / BACKDOOR PARA DESARROLLO ⚡ ---
        // Esto fuerza a que TU dirección sea siempre Federación para que puedas entrar.
        const MI_DIRECCION = "0x773314346CafBfBC677a3DC6bb4Eb49333220a53".toLowerCase();

        if (cuenta.toLowerCase() === MI_DIRECCION) {
            console.log("⚡ Modo Dios Activado: Entrando como Federación");
            setRoles({
                esFederacion: true,     // <--- Te hacemos Federación a la fuerza
                esClubAutorizado: true, // <--- Y también Club para que veas todo
                clubInfo: { nombre: "Admin Mode", autorizado: true },
                loading: false
            });
            return;
        }
        // ------------------------------------------------

        try {
            // 1. Preguntamos al contrato quién es la federación
            const direccionFederacion = await fichajeContract.federacion();
            const esFed = cuenta.toLowerCase() === direccionFederacion.toLowerCase();

            // 2. Preguntamos si es un club
            let info = null;
            let esClub = false;

            try {
                const clubData = await fichajeContract.clubs(cuenta);
                // En Solidity, si no existe devuelve string vacío
                if (clubData.nombre && clubData.nombre !== "") {
                    info = clubData;
                    esClub = clubData.autorizado;
                }
            } catch (err) {
                console.log("No es club registrado");
            }

            setRoles({
                esFederacion: esFed,
                esClubAutorizado: esClub,
                clubInfo: info,
                loading: false
            });

        } catch (error) {
            console.error('Error detectando roles:', error);
            setRoles({ esFederacion: false, esClubAutorizado: false, clubInfo: null, loading: false });
        }
    }, [cuenta, fichajeContract]);

    useEffect(() => {
        detectarRoles();
    }, [detectarRoles]);

    return (
        <RoleContext.Provider value={{ ...roles, refrescarRoles: detectarRoles }}>
            {children}
        </RoleContext.Provider>
    );
};

// HOC para proteger rutas
export const withRole = (Component, rolRequerido) => {
    return (props) => {
        const { esFederacion, esClubAutorizado, loading } = useRoles();

        if (loading) return <div style={{padding:'50px', textAlign:'center'}}>Cargando permisos...</div>;

        // Si eres federación, tienes acceso a todo en modo desarrollo
        if (esFederacion) {
            return <Component {...props} />;
        }

        const tienePermiso =
            (rolRequerido === 'federacion' && esFederacion) ||
            (rolRequerido === 'club' && esClubAutorizado);

        if (!tienePermiso) {
            return (
                <div style={{padding:'50px', textAlign:'center', color:'#ef4444'}}>
                    <h2>⛔ Acceso Denegado</h2>
                    <p>No tienes el rol de {rolRequerido} para ver esta página.</p>
                </div>
            );
        }

        return <Component {...props} />;
    };
};