import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Star, MapPin, Sparkles, MessageSquare, ArrowLeft, GitGraph, User } from 'lucide-react';
import RecommendationCard from '../components/RecommendationCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';

export default function BusinessDetailPage() {
  const { id } = useParams();

  const [business, setBusiness] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  const [loadingBusiness, setLoadingBusiness] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoadingBusiness(true);
    setLoadingRecs(true);
    setLoadingReviews(true);
    setError(null);

    // 1. Fetch Business Details
    try {
      const busRes = await axios.get(`/api/businesses/${id}`);
      if (busRes.data && busRes.data.data) {
        setBusiness(busRes.data.data);
      }
    } catch (err) {
      console.error('Error fetching business detail:', err);
      setError('Unable to connect to the business network or business not found.');
    } finally {
      setLoadingBusiness(false);
    }

    // 2. Fetch 2-Hop Graph Recommendations
    try {
      const recRes = await axios.get(`/api/businesses/${id}/recommendations?limit=6`);
      if (recRes.data && recRes.data.data) {
        setRecommendations(recRes.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch recommendations:', err.message);
    } finally {
      setLoadingRecs(false);
    }

    // 3. Fetch Connected Reviews
    try {
      const revRes = await axios.get(`/api/businesses/${id}/reviews?limit=6`);
      if (revRes.data && revRes.data.data) {
        setReviews(revRes.data.data);
      }
    } catch (err) {
      console.warn('Could not fetch reviews:', err.message);
    } finally {
      setLoadingReviews(false);
    }
  };

  if (loadingBusiness) {
    return <LoadingSkeleton count={3} label="Querying business details & graph traversal..." />;
  }

  if (error || !business) {
    return (
      <div>
        <Link to="/search" className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
          <ArrowLeft size={16} />
          <span>Back to Search</span>
        </Link>
        <ErrorAlert message={error || 'Business not found.'} onRetry={fetchData} />
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <Link to="/search" className="btn btn-secondary" style={{ marginBottom: '1.5rem' }}>
        <ArrowLeft size={16} />
        <span>Back to Search</span>
      </Link>

      {/* Business Main Header Card */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '2.5rem',
          marginBottom: '3rem'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              {business.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#94a3b8', fontSize: '1rem', marginBottom: '1.25rem' }}>
              <MapPin size={18} color="#818cf8" />
              <span>{business.address ? `${business.address}, ` : ''}{business.city}, {business.state} {business.postal_code || ''}</span>
            </div>

            {business.categories && business.categories.length > 0 && (
              <div className="categories-list">
                {business.categories.map((cat, idx) => (
                  <span key={idx} className="category-tag" style={{ fontSize: '0.85rem', padding: '0.3rem 0.8rem' }}>
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div style={{ textAlign: 'right', background: 'rgba(255,255,255,0.03)', padding: '1.25rem 1.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
            <div className="rating-badge" style={{ fontSize: '1.4rem', padding: '0.4rem 1rem', marginBottom: '0.5rem', display: 'inline-flex' }}>
              <Star size={20} fill="#f59e0b" color="#f59e0b" />
              <span>{business.stars ? business.stars.toFixed(1) : 'N/A'}</span>
            </div>
            <div style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
              Based on {business.review_count} Yelp reviews
            </div>
          </div>
        </div>
      </div>

      {/* CORE APPLICATION FEATURE: SIMILAR BUSINESS RECOMMENDATIONS */}
      <section style={{ marginBottom: '4rem' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
            <GitGraph size={18} />
            <span>GRAPH RECOMMENDATION ENGINE</span>
          </div>
          <h2 style={{ fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span>Businesses You May Like</span>
            <Sparkles color="#f59e0b" size={24} />
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>
            Discovered in CognoDB Cloud via 2-hop graph traversal: <strong>Business A ← [:ABOUT] — Review ← [:WROTE] — User — [:WROTE] → Review — [:ABOUT] → Business B</strong>
          </p>
        </div>

        {loadingRecs ? (
          <LoadingSkeleton count={3} label="Traversing reviewer connections in CognoDB Cloud..." />
        ) : recommendations.length === 0 ? (
          <EmptyState
            title="No connected recommendations found"
            description="No other businesses in the graph currently share active reviewers with this establishment."
          />
        ) : (
          <div className="cards-grid">
            {recommendations.map((rec) => (
              <RecommendationCard key={rec.business_id} recommendation={rec} />
            ))}
          </div>
        )}
      </section>

      {/* Connected Yelp Reviews Section */}
      <section>
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MessageSquare color="#a5b4fc" size={22} />
            <span>Community Reviews</span>
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Evaluations linked through <code>(:User)-[:WROTE]-&gt;(:Review)-[:ABOUT]-&gt;(:Business)</code> graph relationships
          </p>
        </div>

        {loadingReviews ? (
          <LoadingSkeleton count={2} label="Fetching connected reviews..." />
        ) : reviews.length === 0 ? (
          <EmptyState
            title="No reviews available"
            description="No detailed text reviews found for this business in the current graph sample."
          />
        ) : (
          <div style={{ display: 'grid', gap: '1.25rem' }}>
            {reviews.map((rev) => (
              <div
                key={rev.review_id}
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.5rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a5b4fc', fontWeight: 700 }}>
                      <User size={18} />
                    </div>
                    <div>
                      <span style={{ fontWeight: 700, color: '#f8fafc', display: 'block' }}>{rev.user_name}</span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Avg rating: {rev.user_avg_stars}★</span>
                    </div>
                  </div>

                  <div className="rating-badge">
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span>{rev.stars}★</span>
                  </div>
                </div>

                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "{rev.text}"
                </p>

                {rev.date && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: '#64748b', textAlign: 'right' }}>
                    Reviewed on {rev.date.split(' ')[0]}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
