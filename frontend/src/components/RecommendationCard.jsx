import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Users, MapPin, Sparkles, ArrowRight } from 'lucide-react';

export default function RecommendationCard({ recommendation }) {
  const {
    business_id,
    name,
    city,
    stars,
    review_count,
    shared_reviewers,
    avg_shared_rating,
    categories
  } = recommendation;

  return (
    <div className="recommendation-card">
      <div className="graph-reason-badge">
        <Sparkles size={14} color="#818cf8" />
        <span>
          Connected by <strong style={{ color: '#ffffff' }}>{shared_reviewers || 1} shared reviewer{shared_reviewers === 1 ? '' : 's'}</strong>
        </span>
      </div>

      <div className="card-header">
        <h3 className="card-title" style={{ fontSize: '1.2rem' }}>{name}</h3>
        <div className="rating-badge">
          <Star size={14} fill="#f59e0b" color="#f59e0b" />
          <span>{stars ? stars.toFixed(1) : 'N/A'}</span>
        </div>
      </div>

      <div className="card-location" style={{ marginBottom: '0.75rem' }}>
        <MapPin size={15} color="#94a3b8" />
        <span>{city}</span>
        <span style={{ margin: '0 4px' }}>•</span>
        <span>{review_count} reviews</span>
      </div>

      {avg_shared_rating && (
        <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem', background: 'rgba(255,255,255,0.03)', padding: '0.4rem 0.75rem', borderRadius: '6px' }}>
          ⭐ Avg rating by shared reviewers: <strong>{Number(avg_shared_rating).toFixed(1)} ★</strong>
        </p>
      )}

      {categories && categories.length > 0 && (
        <div className="categories-list" style={{ marginBottom: '1rem' }}>
          {categories.slice(0, 3).map((cat, idx) => (
            <span key={idx} className="category-tag">
              {cat}
            </span>
          ))}
        </div>
      )}

      <Link
        to={`/businesses/${business_id}`}
        className="btn btn-primary"
        style={{ width: '100%', fontSize: '0.9rem', padding: '0.65rem' }}
      >
        <span>View Graph Details</span>
        <ArrowRight size={16} />
      </Link>
    </div>
  );
}
