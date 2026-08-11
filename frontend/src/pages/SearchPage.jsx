import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { Search, Filter, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import BusinessCard from '../components/BusinessCard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import EmptyState from '../components/EmptyState';
import ErrorAlert from '../components/ErrorAlert';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const cityParam = searchParams.get('city') || '';
  const categoryParam = searchParams.get('category') || '';
  const minRatingParam = searchParams.get('minRating') || '';
  const queryParam = searchParams.get('q') || '';
  const pageParam = parseInt(searchParams.get('page') || '1');

  const [businesses, setBusinesses] = useState([]);
  const [cities, setCities] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Local filter inputs
  const [selectedCity, setSelectedCity] = useState(cityParam);
  const [selectedCategory, setSelectedCategory] = useState(categoryParam);
  const [minRating, setMinRating] = useState(minRatingParam);
  const [searchTerm, setSearchTerm] = useState(queryParam);

  useEffect(() => {
    fetchOptions();
  }, []);

  useEffect(() => {
    setSelectedCity(cityParam);
    setSelectedCategory(categoryParam);
    setMinRating(minRatingParam);
    setSearchTerm(queryParam);
    fetchBusinesses();
  }, [searchParams]);

  const fetchOptions = async () => {
    try {
      const [citiesRes, catRes] = await Promise.all([
        axios.get('/api/cities'),
        axios.get('/api/categories')
      ]);
      if (citiesRes.data && citiesRes.data.data) setCities(citiesRes.data.data);
      if (catRes.data && catRes.data.data) setCategories(catRes.data.data);
    } catch (e) {
      console.warn('Could not fetch filter options:', e.message);
    }
  };

  const fetchBusinesses = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pageParam,
        limit: 12
      };
      if (cityParam) params.city = cityParam;
      if (categoryParam) params.category = categoryParam;
      if (minRatingParam) params.minRating = minRatingParam;
      if (queryParam) params.q = queryParam;

      const res = await axios.get('/api/businesses', { params });
      if (res.data && res.data.data) {
        setBusinesses(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching businesses:', err);
      setError('Unable to connect to the business network. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = (e) => {
    e.preventDefault();
    const newParams = {};
    if (selectedCity) newParams.city = selectedCity;
    if (selectedCategory) newParams.category = selectedCategory;
    if (minRating) newParams.minRating = minRating;
    if (searchTerm) newParams.q = searchTerm;
    newParams.page = '1';
    setSearchParams(newParams);
  };

  const handleReset = () => {
    setSelectedCity('');
    setSelectedCategory('');
    setMinRating('');
    setSearchTerm('');
    setSearchParams({});
  };

  const handlePageChange = (newPage) => {
    const newParams = Object.fromEntries(searchParams.entries());
    newParams.page = newPage.toString();
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Business Search & Discovery</h1>
        <p style={{ color: '#94a3b8' }}>Filter establishments connected in the CognoDB Cloud graph database</p>
      </div>

      {/* Filter Panel */}
      <form onSubmit={handleApplyFilters} className="filter-panel">
        {/* Search Input */}
        <div className="form-group">
          <label className="form-label">Search Name / Keyword</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Coffee, Bakery, Taco..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* City Filter */}
        <div className="form-group">
          <label className="form-label">City</label>
          <select
            className="form-select"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            <option value="">All Cities</option>
            {cities.map((c, idx) => (
              <option key={idx} value={c.name}>
                {c.name} ({c.state})
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div className="form-group">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Minimum Rating */}
        <div className="form-group">
          <label className="form-label">Minimum Rating</label>
          <select
            className="form-select"
            value={minRating}
            onChange={(e) => setMinRating(e.target.value)}
          >
            <option value="">Any Rating</option>
            <option value="4.5">4.5★ & Above</option>
            <option value="4.0">4.0★ & Above</option>
            <option value="3.5">3.5★ & Above</option>
            <option value="3.0">3.0★ & Above</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
            <Filter size={16} />
            <span>Apply</span>
          </button>
          <button type="button" onClick={handleReset} className="btn btn-secondary" title="Reset Filters">
            <RotateCcw size={16} />
          </button>
        </div>
      </form>

      {/* Results Section */}
      {loading ? (
        <LoadingSkeleton count={12} label="Executing openCypher search query..." />
      ) : error ? (
        <ErrorAlert message={error} onRetry={fetchBusinesses} />
      ) : businesses.length === 0 ? (
        <EmptyState
          title="No businesses found"
          description="No businesses in the graph database match your current filter parameters."
          actionButton={
            <button onClick={handleReset} className="btn btn-secondary">
              Clear All Filters
            </button>
          }
        />
      ) : (
        <>
          <div className="cards-grid">
            {businesses.map((bus) => (
              <BusinessCard key={bus.business_id} business={bus} />
            ))}
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '3rem' }}>
            <button
              disabled={pageParam <= 1}
              onClick={() => handlePageChange(pageParam - 1)}
              className="btn btn-secondary"
              style={{ opacity: pageParam <= 1 ? 0.5 : 1, cursor: pageParam <= 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} />
              <span>Previous</span>
            </button>
            <span style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>
              Page {pageParam}
            </span>
            <button
              disabled={businesses.length < 12}
              onClick={() => handlePageChange(pageParam + 1)}
              className="btn btn-secondary"
              style={{ opacity: businesses.length < 12 ? 0.5 : 1, cursor: businesses.length < 12 ? 'not-allowed' : 'pointer' }}
            >
              <span>Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
