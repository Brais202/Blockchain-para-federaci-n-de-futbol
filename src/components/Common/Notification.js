import React, { createContext, useContext, useState, useCallback } from 'react';


const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe usarse dentro de NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback(({
    tipo = 'info',
    titulo,
    mensaje,
    duracion = 5000,
    accion = null
  }) => {
    const id = Date.now().toString();
    const nuevaNotificacion = {
      id,
      tipo,
      titulo,
      mensaje,
      duracion,
      accion,
      timestamp: new Date()
    };

    setNotifications(prev => [...prev, nuevaNotificacion]);

    if (duracion > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duracion);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  }, []);

  const success = useCallback((mensaje, titulo = 'Éxito') => {
    return addNotification({ tipo: 'success', titulo, mensaje });
  }, [addNotification]);

  const error = useCallback((mensaje, titulo = 'Error') => {
    return addNotification({ tipo: 'error', titulo, mensaje });
  }, [addNotification]);

  const warning = useCallback((mensaje, titulo = 'Advertencia') => {
    return addNotification({ tipo: 'warning', titulo, mensaje });
  }, [addNotification]);

  const info = useCallback((mensaje, titulo = 'Información') => {
    return addNotification({ tipo: 'info', titulo, mensaje });
  }, [addNotification]);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationContainer />
    </NotificationContext.Provider>
  );
};

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div className="notification-container">
      {notifications.map(notification => (
        <Notification
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

const Notification = ({ notification, onClose }) => {
  const { tipo, titulo, mensaje, accion } = notification;

  return (
    <div className={`notification ${tipo}`}>
      <div className="notification-icon">
        {tipo === 'success' && '✅'}
        {tipo === 'error' && '❌'}
        {tipo === 'warning' && '⚠️'}
        {tipo === 'info' && 'ℹ️'}
      </div>
      
      <div className="notification-content">
        <h4 className="notification-title">{titulo}</h4>
        <p className="notification-message">{mensaje}</p>
        {accion && (
          <button 
            onClick={accion.onClick}
            className="notification-action"
          >
            {accion.label}
          </button>
        )}
      </div>
      
      <button 
        onClick={onClose}
        className="notification-close"
      >
        ×
      </button>
    </div>
  );
};

export default Notification;
