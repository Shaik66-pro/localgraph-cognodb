import React from 'react';
import { SearchX } from 'lucide-react';

export default function EmptyState({ title, description, actionButton }) {
  return (
    <div className="state-box">
      <SearchX className="state-icon" />
      <h3 className="state-title">{title || 'No results found'}</h3>
      <p className="state-desc">
        {description || 'No businesses or graph connections match your filter criteria.'}
      </p>
      {actionButton}
    </div>
  );
}
