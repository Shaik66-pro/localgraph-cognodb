import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Network, GitGraph, Sparkles, Layers, ArrowRight, CheckCircle, Database } from 'lucide-react';
import LoadingSkeleton from '../components/LoadingSkeleton';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';

export default function GraphInsightsPage() {
  const [featuredBusinesses, setFeaturedBusinesses] = useState([]);
  const [selectedBusId, setSelectedBusId] = useState('');
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (selectedBusId) {
      fetchInsights(selectedBusId);
    }
  }, [selectedBusId]);

  const fetchFeatured = async () => {
    try {
      const res = await axios.get('/api/businesses/featured?limit=10');
      if (res.data && res.data.data && res.data.data.length > 0) {
        setFeaturedBusinesses(res.data.data);
        setSelectedBusId(res.data.data[0].business_id);
      }
    } catch (e) {
      console.warn('Could not fetch featured businesses:', e.message);
    }
  };

  const fetchInsights = async (busId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/insights?businessId=${busId}&limit=6`);
      if (res.data && res.data.data) {
        setInsights(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching graph insights:', err);
      setError('Unable to connect to the business network. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#818cf8', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.3rem' }}>
          <Network size={18} />
          <span>ADVANCED GRAPH ANALYTICS</span>
        </div>
        <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem' }}>Graph Insights & Multi-Hop Traversal</h1>
        <p style={{ color: '#94a3b8', maxWidth: '700px' }}>
          Demonstrating complex 3+ hop Cypher queries over CognoDB Cloud that extract hidden community connections across business categories and shared reviewers.
        </p>
      </div>

      {/* Query Selector Bar */}
      <div className="filter-panel" style={{ gridTemplateColumns: '1fr' }}>
        <div className="form-group">
          <label className="form-label">Select Source Establishment for Multi-Hop Analysis</label>
          <select
            className="form-select"
            value={selectedBusId}
            onChange={(e) => setSelectedBusId(e.target.value)}
            style={{ fontSize: '1rem', padding: '0.85rem 1rem' }}
          >
            {featuredBusinesses.map((b) => (
              <option key={b.business_id} value={b.business_id}>
                {b.name} ({b.city}) — {b.stars}★
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Explanation Box */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.8) 0%, rgba(15, 23, 42, 0.9) 100%)',
          border: '1px solid var(--border-accent)',
          borderRadius: 'var(--radius-md)',
          padding: '1.75rem',
          marginBottom: '2.5rem'
        }}
      >
        <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#a5b4fc' }}>
          <GitGraph size={20} />
          <span>3-Hop Cypher Traversal Pipeline</span>
        </h3>
        <p style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: '1.6' }}>
          <code>
            MATCH (b:Business)-[:HAS_CATEGORY]-&gt;(cat:Category)&lt;-[:HAS_CATEGORY]-(b2:Business)&lt;-[:ABOUT]-(r1:Review)&lt;-[:WROTE]-(u:User)-[:WROTE]-&gt;(r2:Review)-[:ABOUT]-&gt;(b3:Business)
          </code>
        </p>
        <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '0.5rem' }}>
          This query finds complementary businesses ($B_3$) that are visited by reviewers who also frequented category-related establishments ($B_2$).
        </p>
      </div>

      {/* Insights Results Grid */}
      {loading ? (
        <LoadingSkeleton count={3} label="Executing 3-hop graph traversal in CognoDB..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={() => fetchInsights(selectedBusId)} />
      ) : insights.length === 0 ? (
        <EmptyState
          title="No multi-hop connections found"
          description="No 3-hop category community clusters found for this business sample."
        />
      ) : (
        <div className="cards-grid">
          {insights.map((ins, idx) => (
            <div
              key={idx}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1.5rem',
                display: 'flex',
                flexDirection: 'column',
                justifyContract: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(99, 102, 241, 0.15)', color: '#c7d2fe', padding: '0.25rem 0.65rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.85rem' }}>
                  <Layers size={13} />
                  <span>Bridged Category: {ins.matched_category}</span>
                </div>

                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>{ins.name}</h3>

                <div style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1rem' }}>
                  Community Reach: <strong style={{ color: '#f8fafc' }}>{ins.connected_users} connected users</strong>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.05rem' }}>
                  {ins.stars} ★
                </span>
                <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                  Multi-hop Graph Match
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Relational vs Graph Architecture Comparison */}
      <section style={{ marginTop: '4rem', background: 'var(--bg-card)', padding: '2rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Database color="#34d399" />
          <span>Why CognoDB Graph DB over Traditional SQL?</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            <h4 style={{ color: '#f87171', fontSize: '1.1rem', marginBottom: '0.75rem' }}>❌ Relational (SQL) Approach</h4>
            <ul style={{ color: '#94a3b8', fontSize: '0.9rem', display: 'grid', gap: '0.5rem', listStyle: 'none' }}>
              <li>• Requires 5-table JOINs (`businesses`, `reviews`, `users`, `reviews`, `businesses`)</li>
              <li>• Exponential performance penalty $O(N^k)$ as review count grows</li>
              <li>• Complex, unmaintainable SQL queries with multi-level nested subqueries</li>
            </ul>
          </div>

          <div style={{ background: '#1e293b', padding: '1.5rem', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.4)' }}>
            <h4 style={{ color: '#34d399', fontSize: '1.1rem', marginBottom: '0.75rem' }}>✅ CognoDB Graph Approach</h4>
            <ul style={{ color: '#cbd5e1', fontSize: '0.9rem', display: 'grid', gap: '0.5rem', listStyle: 'none' }}>
              <li>• Index-Free Adjacency (edges stored as direct physical memory pointers)</li>
              <li>• Constant-time $O(1)$ traversal per node hop</li>
              <li>• Expressive openCypher pattern matching syntax</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
