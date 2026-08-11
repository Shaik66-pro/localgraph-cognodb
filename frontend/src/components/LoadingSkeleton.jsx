import React from 'react';

export default function LoadingSkeleton({ count = 6, label = 'Finding connected businesses...' }) {
  return (
    <div>
      {label && (
        <div style={{ textAlign: 'center', margin: '1.5rem 0', color: '#94a3b8', fontSize: '0.95rem' }}>
          <div className="skeleton" style={{ width: '180px', height: '14px', margin: '0 auto 0.5rem' }} />
          <span>{label}</span>
        </div>
      )}
      <div className="cards-grid">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="skeleton skeleton-card" />
        ))}
      </div>
    </div>
  );
}
