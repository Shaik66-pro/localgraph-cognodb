import React from 'react';
import { Link } from 'react-router-dom';
import { Star, MapPin, ArrowRight } from 'lucide-react';

export default function BusinessCard({ business }) {
  const { business_id, name, city, state, stars, review_count, categories } = business;

  return (
    <div className="business-card">
      <div>
        <div className="card-header">
          <h3 className="card-title">{name}</h3>
          <div className="rating-badge">
            <Star size={14} fill="#f59e0b" color="#f59e0b" />
            <span>{stars ? stars.toFixed(1) : 'N/A'}</span>
          </div>
        </div>

        <div className="card-location">
          <MapPin size={15} color="#94a3b8" />
          <span>{city}{state ? `, ${state}` : ''}</span>
          <span style={{ margin: '0 4px' }}>•</span>
          <span>{review_count} reviews</span>
        </div>

        {categories && categories.length > 0 && (
          <div className="categories-list">
            {categories.slice(0, 3).map((cat, idx) => (
              <span key={idx} className="category-tag">
                {cat}
              </span>
            ))}
            {categories.length > 3 && (
              <span className="category-tag">+{categories.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <Link to={`/businesses/${business_id}`} className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
        <span>Explore Business & Graph Recs</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
