import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import BusinessDetailPage from './pages/BusinessDetailPage';
import GraphInsightsPage from './pages/GraphInsightsPage';
import ErrorAlert from './components/ErrorAlert';

export default function App() {
  const [dbConnected, setDbConnected] = useState(true);

  return (
    <Router>
      <div className="app-container">
        <Header dbConnected={dbConnected} />

        {!dbConnected && (
          <div style={{ maxWidth: '1280px', margin: '1rem auto 0', padding: '0 1.5rem', width: '100%' }}>
            <ErrorAlert
              message="Unable to connect to the business network (CognoDB Cloud). Please check database credentials or internet connection."
            />
          </div>
        )}

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomePage setDbConnected={setDbConnected} />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/businesses/:id" element={<BusinessDetailPage />} />
            <Route path="/insights" element={<GraphInsightsPage />} />
            <Route path="*" element={<HomePage setDbConnected={setDbConnected} />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}
