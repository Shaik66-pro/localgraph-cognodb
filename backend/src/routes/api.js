const express = require('express');
const router = express.Router();
const controller = require('../controllers/businessController');

// 1. Health check & database status
router.get('/health', controller.getHealth);

// 2. Filter & search businesses
router.get('/businesses', controller.getBusinesses);

// 3. Featured top-rated businesses
router.get('/businesses/featured', controller.getFeaturedBusinesses);

// 4. Distinct filter options
router.get('/categories', controller.getCategories);
router.get('/cities', controller.getCities);

// 5. Multi-hop community graph insights
router.get('/insights', controller.getGraphInsights);

// 6. Single business details by ID
router.get('/businesses/:id', controller.getBusinessById);

// 7. Reviews for a business
router.get('/businesses/:id/reviews', controller.getBusinessReviews);

// 8. MAIN FEATURE: Similar Business Recommendations (2-Hop Graph Traversal)
router.get('/businesses/:id/recommendations', controller.getBusinessRecommendations);

module.exports = router;
