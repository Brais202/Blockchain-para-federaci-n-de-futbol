import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FederationView from './components/FederationView';
import ClubView from './components/ClubView';
import Header from './components/Common/Header';
import './App.css';

// Componente simple de error temporal
const SimpleErrorBoundary = ({ children }) => {
  return children;
};

function App() {
  return (
    <SimpleErrorBoundary>
      <Router>
        <div className="App">
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/federacion" element={<FederationView />} />
              <Route path="/club" element={<ClubView />} />
              <Route path="/" element={<Navigate to="/club" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </SimpleErrorBoundary>
  );
}

export default App;