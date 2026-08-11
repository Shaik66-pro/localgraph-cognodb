import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Search, GitGraph, Star, ArrowRight, ShieldCheck, Database, Users } from 'lucide-react';
import BusinessCard from '../components/BusinessCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';

export default function HomePage({ setDbConnected }) {
  const [featured, setFeatured] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Check DB Health & Stats
      const healthRes = await axios.get('/api/health');
      if (healthRes.data && healthRes.data.stats) {
        setStats(healthRes.data.stats);
        if (setDbConnected) setDbConnected(true);
      }

      // 2. Fetch Featured Top-Rated Businesses
      const featRes = await axios.get('/api/businesses/featured?limit=6');
      if (featRes.data && featRes.data.data) {
        setFeatured(featRes.data.data);
      }

      // 3. Fetch Categories
      const catRes = await axios.get('/api/categories');
      if (catRes.data && catRes.data.data) {
        setCategories(catRes.data.data.slice(0, 12));
      }
    } catch (err) {
      console.error('Error loading home page data:', err);
      if (setDbConnected) setDbConnected(false);
      setError('Unable to connect to the business network. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/search');
    }
  };

  const handleCategoryClick = (catName) => {
    navigate(`/search?category=${encodeURIComponent(catName)}`);
  };

  return (
    <div>
      {/* Hero Section */}
      <section className="hero-banner">
        <div className="hero-badge">
          <GitGraph size={16} />
          <span>openCypher Graph Traversals over CognoDB</span>
        </div>
        <h1 className="hero-title">LocalGraph</h1>
        <p className="hero-subtitle">
          Discover local businesses through connected reviews and communities.
        </p>

        {/* Quick Search Input */}
        <form onSubmit={handleSearchSubmit} style={{ maxWidth: '600px', margin: '0 auto 2rem' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="form-input"
              style={{
                width: '100%',
                padding: '1rem 1.25rem 1rem 3.2rem',
                fontSize: '1.05rem',
                borderRadius: '9999px',
                border: '1px solid var(--border-accent)'
              }}
              placeholder="Search coffee, seafood, taqueria, smog check..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search
              size={20}
              color="#818cf8"
              style={{ position: 'absolute', left: '1.2rem', top: '50%', transform: 'translateY(-50%)' }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                position: 'absolute',
                right: '0.4rem',
                top: '50%',
                transform: 'translateY(-50%)',
                borderRadius: '9999px',
                padding: '0.65rem 1.25rem'
              }}
            >
              Search
            </button>
          </div>
        </form>

        {/* Graph Stats Bar */}
        {stats && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              gap: '2rem',
              paddingTop: '1.5rem',
              borderTop: '1px solid var(--border-color)'
            }}
          >
            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#a5b4fc', display: 'block' }}>
                {stats.totalBusinesses.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Businesses</span>
            </div>
            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#34d399', display: 'block' }}>
                {stats.totalUsers.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Reviewers</span>
            </div>
            <div>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f472b6', display: 'block' }}>
                {stats.totalReviews.toLocaleString()}
              </span>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Reviews & Edges</span>
            </div>
          </div>
        )}
      </section>

      {/* How Graph Recommendations Work Section */}
      <section style={{ marginBottom: '3rem', background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <GitGraph color="#818cf8" />
          <span>How Relationship-Based Discovery Works</span>
        </h2>
        <p style={{ color: '#cbd5e1', marginBottom: '1.5rem', fontSize: '0.98rem' }}>
          Unlike traditional databases that rely only on isolated star ratings, <strong>LocalGraph</strong> traverses graph relationships in CognoDB Cloud. When you view a business, we discover similar establishments through users who reviewed both businesses.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', textAlign: 'center' }}>
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>🏢 Business A</span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Target Establishment</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontWeight: 700 }}>
            ← [:ABOUT] — Review — [:WROTE] →
          </div>
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>👤 Shared Reviewers</span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Community Graph Bridge</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontWeight: 700 }}>
            ← [:WROTE] — Review — [:ABOUT] →
          </div>
          <div style={{ background: '#1e293b', padding: '1.25rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>✨ Business B</span>
            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Graph Recommendation</span>
          </div>
        </div>
      </section>

      {/* Category Quick Filters */}
      {categories.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem', color: '#f8fafc' }}>Explore Top Categories</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
            {categories.map((cat, idx) => (
              <button
                key={idx}
                onClick={() => handleCategoryClick(cat)}
                className="category-tag"
                style={{ fontSize: '0.9rem', padding: '0.4rem 0.9rem', cursor: 'pointer', transition: 'var(--transition)' }}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Featured Top-Rated Businesses */}
      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.8rem' }}>Featured Establishments</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Highest rated local businesses in the graph database</p>
          </div>
          <button onClick={() => navigate('/search')} className="btn btn-secondary">
            <span>View All Businesses</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {loading ? (
          <LoadingSkeleton count={6} label="Querying CognoDB Cloud database..." />
        ) : error ? (
          <ErrorAlert message={error} onRetry={fetchHomeData} />
        ) : (
          <div className="cards-grid">
            {featured.map((bus) => (
              <BusinessCard key={bus.business_id} business={bus} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
