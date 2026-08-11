import React from 'react';
import { Database, GitGraph } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="footer">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <GitGraph size={20} color="#6366f1" />
        <span style={{ fontWeight: 600, color: '#f8fafc' }}>LocalGraph Recommendation Engine</span>
      </div>
      <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
        Powered by <strong style={{ color: '#a5b4fc' }}>CognoDB Cloud</strong> openCypher & Neo4j JavaScript Driver. Based on Kaggle Yelp Dataset.
      </p>
    </footer>
  );
}
