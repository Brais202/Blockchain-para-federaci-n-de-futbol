import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Contextos
import { ContractProvider } from './components/Common/ContractContext';
import { RoleProvider, withRole } from './components/Common/RoleDetector'; // Importamos withRole

// Componentes Comunes
import ErrorBoundary from './components/Common/ErrorBoundary';
import Header from './components/Common/Header';
import Home from './components/Common/Home';

// Vistas (Componentes normales)
import FederationView from './components/FederationView';
import ClubView from './components/ClubView';

// --- CREACIÓN DE COMPONENTES PROTEGIDOS ---
// Usamos el HOC 'withRole' para envolver las vistas.
// Esto crea nuevos componentes que verifican el rol antes de montarse.

const ClubDashboardProtegido = withRole(ClubView, 'club');
const FederacionDashboardProtegido = withRole(FederationView, 'federacion');

function App() {
    return (
        <ErrorBoundary>
            <ContractProvider>
                {/* El RoleProvider debe estar dentro de ContractProvider para acceder al contrato */}
                <RoleProvider>
                    <Router>
                        <div className="app-container">
                            <Header />

                            <main className="main-content">
                                <Routes>

                                    {/* RUTA PÚBLICA / INICIO */}
                                    <Route path="/" element={<Home />} />

                                    {/* RUTAS PROTEGIDAS */}
                                    {/* Ya no pasamos <RouteProtected>, pasamos el componente ya envuelto */}

                                    <Route
                                        path="/club/*"
                                        element={<ClubDashboardProtegido />}
                                    />

                                    <Route
                                        path="/federacion/*"
                                        element={<FederacionDashboardProtegido />}
                                    />

                                    {/* Ruta para capturar errores 404 */}
                                    <Route path="*" element={<Navigate to="/" replace />} />

                                </Routes>
                            </main>
                        </div>
                    </Router>
                </RoleProvider>
            </ContractProvider>
        </ErrorBoundary>
    );
}

export default App;