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
        if (!cuenta || !fichajeContract) {
            setRoles({ esFederacion: false, esClubAutorizado: false, clubInfo: null, loading: false });
            return;
        }

        try {
            const direccionFederacion = await fichajeContract.federacion();
            const cuentaLower = cuenta.toLowerCase();
            const esFed = cuentaLower === direccionFederacion.toLowerCase();

            let clubInfo = null;
            let esClub = false;
            try {
                const clubData = await fichajeContract.clubs(cuenta);
                if (clubData.nombre && clubData.nombre !== "") {
                    clubInfo = clubData;
                    esClub = clubData.autorizado;
                }
            } catch (err) {
                // Silencioso, no es un error fatal, solo no es un club registrado
            }

            
            const esClubAutorizadoFinal = esFed || esClub;

            setRoles({
                esFederacion: esFed,
                esClubAutorizado: esClubAutorizadoFinal,
                clubInfo: clubInfo,
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
