import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Share2, Compass, Search, Network } from 'lucide-react';

export default function Header({ dbConnected }) {
  const location = useLocation();

  return (
    <header className="navbar">
      <div className="nav-container">
        <Link to="/" className="brand-logo">
          <Share2 className="brand-icon" />
          <span>LocalGraph</span>
        </Link>

        <nav className="nav-links">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <Compass size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Discover
          </Link>
          <Link
            to="/search"
            className={`nav-link ${location.pathname === '/search' ? 'active' : ''}`}
          >
            <Search size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Search
          </Link>
          <Link
            to="/insights"
            className={`nav-link ${location.pathname === '/insights' ? 'active' : ''}`}
          >
            <Network size={18} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            Graph Insights
          </Link>

          <div className="db-status-pill" title="CognoDB Cloud Bolt Connection Status">
            <span className={`status-dot ${dbConnected ? 'online' : 'offline'}`} />
            <span>{dbConnected ? 'CognoDB Connected' : 'CognoDB Offline'}</span>
          </div>
        </nav>
      </div>
    </header>
  );
}
