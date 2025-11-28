import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ tipo = 'default', mensaje = 'Cargando...' }) => {
  const renderSpinner = () => {
    switch (tipo) {
      case 'pulso':
        return <div className="spinner-pulse"></div>;
      case 'barras':
        return <div className="spinner-bars"></div>;
      case 'anillo':
        return <div className="spinner-ring"></div>;
      default:
        return <div className="spinner-default"></div>;
    }
  };

  return (
    <div className={`loading-container ${tipo}`}>
      {renderSpinner()}
      {mensaje && <p className="loading-message">{mensaje}</p>}
    </div>
  );
};

export const SpinnerOverlay = ({ mensaje = 'Procesando transacción...' }) => (
  <div className="spinner-overlay">
    <div className="overlay-content">
      <LoadingSpinner tipo="anillo" mensaje={mensaje} />
    </div>
  </div>
);

export const SkeletonLoader = ({ lineas = 3 }) => (
  <div className="skeleton-loader">
    {Array.from({ length: lineas }).map((_, index) => (
      <div key={index} className="skeleton-line"></div>
    ))}
  </div>
);

export default LoadingSpinner;
