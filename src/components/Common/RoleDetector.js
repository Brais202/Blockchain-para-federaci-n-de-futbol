import React, { createContext, useContext, useState, useEffect } from 'react';
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

  useEffect(() => {
    detectarRoles();
  }, [cuenta, fichajeContract]);

  const detectarRoles = async () => {
    if (!cuenta || !fichajeContract) {
      setRoles({
        esFederacion: false,
        esClubAutorizado: false,
        clubInfo: null,
        loading: false
      });
      return;
    }

    try {
      // Verificar si es federación
      const direccionFederacion = await fichajeContract.federacion();
      const esFederacion = cuenta.toLowerCase() === direccionFederacion.toLowerCase();

      // Verificar si es club autorizado
      let clubInfo = null;
      let esClubAutorizado = false;
      
      if (!esFederacion) {
        try {
          clubInfo = await fichajeContract.clubs(cuenta);
          esClubAutorizado = clubInfo.autorizado;
        } catch (error) {
          console.log('Cuenta no es un club registrado');
        }
      }

      setRoles({
        esFederacion,
        esClubAutorizado,
        clubInfo,
        loading: false
      });

    } catch (error) {
      console.error('Error detectando roles:', error);
      setRoles({
        esFederacion: false,
        esClubAutorizado: false,
        clubInfo: null,
        loading: false
      });
    }
  };

  const value = {
    ...roles,
    refrescarRoles: detectarRoles
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

// Componente de protección de rutas (para el futuro)
export const withRole = (Component, rolRequerido) => {
  return (props) => {
    const { esFederacion, esClubAutorizado, loading } = useRoles();

    if (loading) {
      return <div>Cargando permisos...</div>;
    }

    const tienePermiso = 
      (rolRequerido === 'federacion' && esFederacion) ||
      (rolRequerido === 'club' && esClubAutorizado) ||
      rolRequerido === 'cualquiera';

    if (!tienePermiso) {
      return (
        <div className="access-denied">
          <h2>🔒 Acceso Denegado</h2>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      );
    }

    return <Component {...props} />;
  };
};
