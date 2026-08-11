import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorAlert({ message, onRetry }) {
  return (
    <div className="state-box" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
      <AlertTriangle className="state-icon" style={{ color: '#ef4444' }} />
      <h3 className="state-title" style={{ color: '#f87171' }}>Network Error</h3>
      <p className="state-desc">
        {message || 'Unable to connect to the business network. Please try again later.'}
      </p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-secondary">
          <RefreshCw size={16} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
