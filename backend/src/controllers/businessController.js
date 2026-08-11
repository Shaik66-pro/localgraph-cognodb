const { getSession, verifyConnection } = require('../config/db');
const queries = require('../queries/cypherQueries');

// Utility helper to convert Neo4j integers to JS numbers
function toNative(record) {
  const obj = {};
  record.keys.forEach((key) => {
    let val = record.get(key);
    if (val && typeof val === 'object' && val.low !== undefined && val.high !== undefined) {
      val = val.toNumber();
    }
    obj[key] = val;
  });
  return obj;
}

// 1. Health check & Graph DB status
exports.getHealth = async (req, res) => {
  const isConnected = await verifyConnection();
  if (!isConnected) {
    return res.status(503).json({
      status: 'error',
      connected: false,
      message: 'Unable to connect to the business network. Please try again later.'
    });
  }

  let session;
  try {
    session = getSession();
    const result = await session.run(queries.GET_GRAPH_STATS);
    const stats = result.records.length > 0 ? toNative(result.records[0]) : {};

    return res.json({
      status: 'ok',
      connected: true,
      database: 'CognoDB (openCypher / Bolt)',
      stats: {
        totalBusinesses: stats.totalBusinesses || 0,
        totalUsers: stats.totalUsers || 0,
        totalReviews: stats.totalReviews || 0,
        totalCities: stats.totalCities || 0,
        totalCategories: stats.totalCategories || 0
      }
    });
  } catch (err) {
    console.error('Health Check Error:', err);
    return res.status(500).json({
      status: 'error',
      connected: false,
      message: 'Unable to query database stats.',
      error: err.message
    });
  } finally {
    if (session) await session.close();
  }
};

// 2. Search & filter businesses
exports.getBusinesses = async (req, res) => {
  let session;
  try {
    const { city, category, minRating, q, page = 1, limit = 20 } = req.query;
    const skip = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
    const parsedMinRating = minRating ? parseFloat(minRating) : null;

    session = getSession();
    const result = await session.run(queries.SEARCH_BUSINESSES, {
      city: city || null,
      category: category || null,
      minRating: parsedMinRating,
      searchTerm: q || null,
      skip: neo4j.int(skip),
      limit: neo4j.int(parseInt(limit))
    });

    const businesses = result.records.map(toNative);
    return res.json({
      success: true,
      count: businesses.length,
      page: parseInt(page),
      data: businesses
    });
  } catch (err) {
    console.error('getBusinesses Error:', err);
    return res.status(503).json({
      success: false,
      message: 'Unable to connect to the business network. Please try again later.',
      error: err.message
    });
  } finally {
    if (session) await session.close();
  }
};

// 3. Featured businesses
exports.getFeaturedBusinesses = async (req, res) => {
  let session;
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 6;
    session = getSession();
    const result = await session.run(queries.GET_FEATURED_BUSINESSES, {
      limit: neo4j.int(limit)
    });

    const businesses = result.records.map(toNative);
    return res.json({
      success: true,
      count: businesses.length,
      data: businesses
    });
  } catch (err) {
    console.error('getFeaturedBusinesses Error:', err);
    return res.status(503).json({
      success: false,
      message: 'Unable to connect to the business network. Please try again later.',
      error: err.message
    });
  } finally {
    if (session) await session.close();
  }
};

// 4. Single Business Details by ID
exports.getBusinessById = async (req, res) => {
  let session;
  try {
    const { id } = req.params;
    session = getSession();
    const result = await session.run(queries.GET_BUSINESS_BY_ID, {
      business_id: id
    });

    if (result.records.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Business with ID '${id}' was not found.`
      });
    }

    const business = toNative(result.records[0]);
    if (!business.business_id) {
      return res.status(404).json({
        success: false,
        message: `Business with ID '${id}' was not found.`
      });
    }

    return res.json({
      success: true,
      data: business
    });
  } catch (err) {
    console.error('getBusinessById Error:', err);
    return res.status(503).json({
      success: false,
      message: 'Unable to connect to the business network. Please try again later.',
      error: err.message
    });
  } finally {
    if (session) await session.close();
  }
};

// 5. Reviews for a Business
exports.getBusinessReviews = async (req, res) => {
  let session;
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    session = getSession();
    const result = await session.run(queries.GET_BUSINESS_REVIEWS, {
      business_id: id,
      limit: neo4j.int(limit)
    });

    const reviews = result.records.map(toNative);
    return res.json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (err) {
    console.error('getBusinessReviews Error:', err);
    return res.status(503).json({
      success: false,
      message: 'Unable to connect to the business network. Please try again later.',
      error: err.message
    });
  } finally {
    if (session) await session.close();
  }
};

// 6. MAIN FEATURE — Similar Business Recommendations (2-Hop Cypher Traversal)
exports.getBusinessRecommendations = async (req, res) => {
  let session;
  try {
    const { id } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit) : 6;

    session = getSession();
    const result = await session.run(queries.GET_SIMILAR_BUSINESSES, {
      business_id: id,
      limit: neo4j.int(limit)
    });

    const recommendations = result.records.map(toNative);
    return res.json({
      success: true,
      count: recommendations.length,
      data: recommendations
    });
  } catch (err) {
    console.error('getBusinessRecommendations Error:', err);
    return res.status(503).json({
      success: false,
      message: 'Unable to connect to the business network. Please try again later.',
      error: err.message
    });
  } finally {
    if (session) await session.close();
  }
};

// 7. MULTI-HOP GRAPH INSIGHT (3-Hop Community Traversal)
exports.getGraphInsights = async (req, res) => {
  let session;
  try {
    const { businessId } = req.query;
    if (!businessId) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter businessId is required for graph community insights.'
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    session = getSession();
    const result = await session.run(queries.GET_MULTI_HOP_COMMUNITY_INSIGHTS, {
      business_id: businessId,
      limit: neo4j.int(limit)
    });

    const insights = result.records.map(toNative);
    return res.json({
      success: true,
      count: insights.length,
      data: insights
    });
  } catch (err) {
    console.error('getGraphInsights Error:', err);
    return res.status(503).json({
      success: false,
      message: 'Unable to connect to the business network. Please try again later.',
      error: err.message
    });
  } finally {
    if (session) await session.close();
  }
};

// 8. Categories List
exports.getCategories = async (req, res) => {
  let session;
  try {
    session = getSession();
    const result = await session.run(queries.GET_CATEGORIES);
    const categories = result.records.map((r) => r.get('name'));
    return res.json({
      success: true,
      data: categories
    });
  } catch (err) {
    console.error('getCategories Error:', err);
    return res.status(503).json({
      success: false,
      message: 'Unable to connect to the business network. Please try again later.',
      error: err.message
    });
  } finally {
    if (session) await session.close();
  }
};

// 9. Cities List
exports.getCities = async (req, res) => {
  let session;
  try {
    session = getSession();
    const result = await session.run(queries.GET_CITIES);
    const cities = result.records.map(toNative);
    return res.json({
      success: true,
      data: cities
    });
  } catch (err) {
    console.error('getCities Error:', err);
    return res.status(503).json({
      success: false,
      message: 'Unable to connect to the business network. Please try again later.',
      error: err.message
    });
  } finally {
    if (session) await session.close();
  }
};

// Need neo4j module helper for integer handling
const neo4j = require('neo4j-driver');
