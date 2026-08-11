// /**
//  * Parameterized openCypher queries for CognoDB
//  * RULE: All user inputs MUST be passed as parameters.
//  */

// // 1. Health check & basic stats
// const GET_GRAPH_STATS = `
//   CALL {
//     MATCH (b:Business)
//     RETURN count(b) AS totalBusinesses
//   }
//   CALL {
//     MATCH (u:User)
//     RETURN count(u) AS totalUsers
//   }
//   CALL {
//     MATCH (r:Review)
//     RETURN count(r) AS totalReviews
//   }
//   CALL {
//     MATCH (c:City)
//     RETURN count(c) AS totalCities
//   }
//   CALL {
//     MATCH (cat:Category)
//     RETURN count(cat) AS totalCategories
//   }
//   RETURN
//     totalBusinesses,
//     totalUsers,
//     totalReviews,
//     totalCities,
//     totalCategories
// `;

// // 2. Search & filter businesses
// const SEARCH_BUSINESSES = `
//   MATCH (b:Business)-[:LOCATED_IN]->(c:City)
//   OPTIONAL MATCH (b)-[:HAS_CATEGORY]->(cat:Category)
//   WHERE ($city IS NULL OR $city = '' OR toLower(c.name) = toLower($city))
//     AND ($category IS NULL OR $category = '' OR toLower(cat.name) = toLower($category))
//     AND ($minRating IS NULL OR b.stars >= $minRating)
//     AND ($searchTerm IS NULL OR $searchTerm = '' OR toLower(b.name) CONTAINS toLower($searchTerm))

//   WITH b, c, collect(DISTINCT cat.name) AS categories

//   RETURN b.business_id AS business_id,
//          b.name AS name,
//          b.address AS address,
//          c.name AS city,
//          b.state AS state,
//          b.stars AS stars,
//          b.review_count AS review_count,
//          categories

//   ORDER BY b.business_id
//   SKIP $skip
//   LIMIT $limit
// `;

// // 3. Business details by ID
// const GET_BUSINESS_BY_ID = `
//   MATCH (b:Business {business_id: $business_id})
//         -[:LOCATED_IN]->(c:City)

//   OPTIONAL MATCH (b)-[:HAS_CATEGORY]->(cat:Category)
//   OPTIONAL MATCH (r:Review)-[:ABOUT]->(b)

//   RETURN
//     b.business_id AS business_id,
//     b.name AS name,
//     b.address AS address,
//     c.name AS city,
//     b.state AS state,
//     b.postal_code AS postal_code,
//     b.latitude AS latitude,
//     b.longitude AS longitude,
//     b.stars AS stars,
//     b.review_count AS review_count,
//     b.is_open AS is_open,
//     collect(DISTINCT cat.name) AS categories,
//     count(DISTINCT r) AS graph_review_count
// `;

// // 4. Reviews for a business
// const GET_BUSINESS_REVIEWS = `
//   MATCH (u:User)-[:WROTE]->(r:Review)
//         -[:ABOUT]->(b:Business {business_id: $business_id})

//   RETURN
//     r.review_id AS review_id,
//     r.stars AS stars,
//     r.useful AS useful,
//     r.text AS text,
//     r.date AS date,
//     u.user_id AS user_id,
//     u.name AS user_name,
//     u.average_stars AS user_avg_stars

//   ORDER BY r.date DESC
//   LIMIT $limit
// `;

// // 5. MAIN FEATURE: Similar Business Recommendations
// //
// // Recommendation signals:
// // 1. Same categories
// // 2. Shared reviewers
// // 3. Rating
// //
// const GET_SIMILAR_BUSINESSES = `
//   MATCH (b:Business {business_id: $business_id})

//   OPTIONAL MATCH (b)-[:HAS_CATEGORY]->(sourceCat:Category)

//   MATCH (rec:Business)
//   WHERE rec.business_id <> $business_id

//   OPTIONAL MATCH (rec)-[:HAS_CATEGORY]->(recCat:Category)

//   WITH
//     b,
//     rec,
//     collect(DISTINCT sourceCat.name) AS sourceCategories,
//     collect(DISTINCT recCat.name) AS recCategories

//   WITH
//     b,
//     rec,
//     [x IN sourceCategories WHERE x IN recCategories] AS matchedCategories

//   OPTIONAL MATCH (b)<-[:ABOUT]-(r1:Review)
//         <-[:WROTE]-(u:User)
//         -[:WROTE]->(r2:Review)
//         -[:ABOUT]->(rec)

//   WITH
//     rec,
//     matchedCategories,
//     count(DISTINCT u) AS shared_reviewers,
//     avg(r2.stars) AS avg_shared_rating

//   OPTIONAL MATCH (rec)-[:LOCATED_IN]->(c:City)

//   OPTIONAL MATCH (rec)-[:HAS_CATEGORY]->(cat:Category)

//   WITH
//     rec,
//     c,
//     matchedCategories,
//     shared_reviewers,
//     avg_shared_rating,
//     collect(DISTINCT cat.name) AS categories

//   WITH
//     rec,
//     c,
//     categories,
//     matchedCategories,
//     shared_reviewers,
//     avg_shared_rating,
//     (
//       size(matchedCategories) * 10 +
//       shared_reviewers * 5 +
//       coalesce(avg_shared_rating, rec.stars)
//     ) AS recommendation_score

//   WHERE
//     size(matchedCategories) > 0
//     OR shared_reviewers > 0

//   RETURN
//     rec.business_id AS business_id,
//     rec.name AS name,
//     rec.stars AS stars,
//     rec.review_count AS review_count,
//     rec.address AS address,
//     c.name AS city,
//     categories,
//     size(matchedCategories) AS matched_categories,
//     shared_reviewers,
//     avg_shared_rating,
//     recommendation_score

//   ORDER BY
//     recommendation_score DESC,
//     rec.stars DESC,
//     rec.review_count DESC

//   LIMIT $limit
// `;

// // 6. Multi-hop community insights
// const GET_MULTI_HOP_COMMUNITY_INSIGHTS = `
//   MATCH (b:Business {business_id: $business_id})
//         -[:HAS_CATEGORY]->(cat:Category)
//         <-[:HAS_CATEGORY]-(b2:Business)
//         <-[:ABOUT]-(r1:Review)
//         <-[:WROTE]-(u:User)
//         -[:WROTE]->(r2:Review)
//         -[:ABOUT]->(b3:Business)

//   WHERE
//     b.business_id <> b3.business_id
//     AND b2.business_id <> b3.business_id

//   RETURN
//     b3.business_id AS business_id,
//     b3.name AS name,
//     cat.name AS matched_category,
//     b3.stars AS stars,
//     count(DISTINCT u) AS connected_users

//   ORDER BY connected_users DESC, b3.stars DESC
//   LIMIT $limit
// `;

// // 7. Distinct categories
// const GET_CATEGORIES = `
//   MATCH (c:Category)

//   RETURN
//     c.name AS name,
//     c.category_id AS category_id

//   ORDER BY c.name ASC
//   LIMIT 200
// `;

// // 8. Distinct cities
// const GET_CITIES = `
//   MATCH (c:City)

//   RETURN
//     c.name AS name,
//     c.state AS state

//   ORDER BY c.name ASC
// `;

// // 9. Featured highly-rated businesses
// const GET_FEATURED_BUSINESSES = `
//   MATCH (b:Business)-[:LOCATED_IN]->(c:City)

//   OPTIONAL MATCH (b)-[:HAS_CATEGORY]->(cat:Category)

//   WHERE
//     b.stars >= 4.5
//     AND b.review_count >= 10

//   WITH
//     b,
//     c,
//     collect(DISTINCT cat.name) AS categories

//   RETURN
//     b.business_id AS business_id,
//     b.name AS name,
//     b.address AS address,
//     c.name AS city,
//     b.stars AS stars,
//     b.review_count AS review_count,
//     categories

//   ORDER BY b.stars DESC, b.review_count DESC
//   LIMIT $limit
// `;

// module.exports = {
//   GET_GRAPH_STATS,
//   SEARCH_BUSINESSES,
//   GET_BUSINESS_BY_ID,
//   GET_BUSINESS_REVIEWS,
//   GET_SIMILAR_BUSINESSES,
//   GET_MULTI_HOP_COMMUNITY_INSIGHTS,
//   GET_CATEGORIES,
//   GET_CITIES,
//   GET_FEATURED_BUSINESSES
// };

/**
 * Parameterized openCypher queries for CognoDB (Neo4j JavaScript Driver)
 * RULE: All user inputs MUST be passed as parameters ($param), NEVER concatenated.
 */

// 1. Health check & basic stats
const GET_GRAPH_STATS = `
  CALL {
    MATCH (b:Business)
    RETURN count(b) AS totalBusinesses
  }
  CALL {
    MATCH (u:User)
    RETURN count(u) AS totalUsers
  }
  CALL {
    MATCH (r:Review)
    RETURN count(r) AS totalReviews
  }
  CALL {
    MATCH (c:City)
    RETURN count(c) AS totalCities
  }
  CALL {
    MATCH (cat:Category)
    RETURN count(cat) AS totalCategories
  }
  RETURN totalBusinesses,
         totalUsers,
         totalReviews,
         totalCities,
         totalCategories
`;

// 2. Search & filter businesses
// DISTINCT/aggregation prevents duplicate businesses when a business
// has multiple categories.
const SEARCH_BUSINESSES = `
  MATCH (b:Business)-[:LOCATED_IN]->(c:City)
  OPTIONAL MATCH (b)-[:HAS_CATEGORY]->(cat:Category)

  WHERE ($city IS NULL OR $city = '' OR toLower(c.name) = toLower($city))
    AND ($category IS NULL OR $category = '' OR toLower(cat.name) = toLower($category))
    AND ($minRating IS NULL OR b.stars >= $minRating)
    AND (
      $searchTerm IS NULL
      OR $searchTerm = ''
      OR toLower(b.name) CONTAINS toLower($searchTerm)
    )

  WITH b,
       c,
       collect(DISTINCT cat.name) AS categories

  RETURN b.business_id AS business_id,
         b.name AS name,
         b.address AS address,
         c.name AS city,
         b.state AS state,
         b.stars AS stars,
         b.review_count AS review_count,
         categories

  ORDER BY b.business_id ASC
  SKIP $skip
  LIMIT $limit
`;

// 3. Business details by ID
const GET_BUSINESS_BY_ID = `
  MATCH (b:Business {business_id: $business_id})
        -[:LOCATED_IN]->(c:City)

  OPTIONAL MATCH (b)-[:HAS_CATEGORY]->(cat:Category)

  OPTIONAL MATCH (r:Review)-[:ABOUT]->(b)

  RETURN b.business_id AS business_id,
         b.name AS name,
         b.address AS address,
         c.name AS city,
         b.state AS state,
         b.postal_code AS postal_code,
         b.latitude AS latitude,
         b.longitude AS longitude,
         b.stars AS stars,
         b.review_count AS review_count,
         b.is_open AS is_open,
         collect(DISTINCT cat.name) AS categories,
         count(DISTINCT r) AS graph_review_count
`;

// 4. Reviews for a business
const GET_BUSINESS_REVIEWS = `
  MATCH (u:User)-[:WROTE]->(r:Review)-[:ABOUT]->
        (b:Business {business_id: $business_id})

  RETURN r.review_id AS review_id,
         r.stars AS stars,
         r.useful AS useful,
         r.text AS text,
         r.date AS date,
         u.user_id AS user_id,
         u.name AS user_name,
         u.average_stars AS user_avg_stars

  ORDER BY r.date DESC
  LIMIT $limit
`;

// 5. MAIN FEATURE:
// Similar Business Recommendations using 2-Hop Graph Traversal
//
// Business A
//    <- Review
//    <- User
//    -> Review
//    -> Business B
//
const GET_SIMILAR_BUSINESSES = `
  MATCH
    (b:Business {business_id: $business_id})
      <-[:ABOUT]-(r1:Review)
      <-[:WROTE]-(u:User)
      -[:WROTE]->(r2:Review)
      -[:ABOUT]->(rec:Business)

  WHERE rec.business_id <> $business_id

  OPTIONAL MATCH (rec)-[:LOCATED_IN]->(c:City)
  OPTIONAL MATCH (rec)-[:HAS_CATEGORY]->(cat:Category)

  WITH rec,
       c,
       collect(DISTINCT cat.name) AS categories,
       count(DISTINCT u) AS shared_reviewers,
       avg(r2.stars) AS avg_shared_rating

  RETURN rec.business_id AS business_id,
         rec.name AS name,
         rec.stars AS stars,
         rec.review_count AS review_count,
         rec.address AS address,
         c.name AS city,
         categories,
         shared_reviewers,
         avg_shared_rating

  ORDER BY shared_reviewers DESC,
           rec.stars DESC,
           rec.review_count DESC

  LIMIT $limit
`;

// 6. MULTI-HOP GRAPH COMMUNITY INSIGHTS
//
// Business A
//    -> Category
//    <- Business B
//    <- Review
//    <- User
//    -> Review
//    -> Business C
//
const GET_MULTI_HOP_COMMUNITY_INSIGHTS = `
  MATCH
    (b:Business {business_id: $business_id})
      -[:HAS_CATEGORY]->(cat:Category)
      <-[:HAS_CATEGORY]-(b2:Business)
      <-[:ABOUT]-(r1:Review)
      <-[:WROTE]-(u:User)
      -[:WROTE]->(r2:Review)
      -[:ABOUT]->(b3:Business)

  WHERE b.business_id <> b3.business_id
    AND b2.business_id <> b3.business_id

  RETURN b3.business_id AS business_id,
         b3.name AS name,
         cat.name AS matched_category,
         b3.stars AS stars,
         count(DISTINCT u) AS connected_users

  ORDER BY connected_users DESC,
           b3.stars DESC

  LIMIT $limit
`;

// 7. Distinct categories list
const GET_CATEGORIES = `
  MATCH (c:Category)

  RETURN c.name AS name,
         c.category_id AS category_id

  ORDER BY c.name ASC

  LIMIT 200
`;

// 8. Distinct cities list
const GET_CITIES = `
  MATCH (c:City)

  RETURN c.name AS name,
         c.state AS state

  ORDER BY c.name ASC
`;

// 9. Featured highly-rated businesses
// Intentionally only returns 4.5+ businesses.
const GET_FEATURED_BUSINESSES = `
  MATCH (b:Business)-[:LOCATED_IN]->(c:City)
  OPTIONAL MATCH (b)-[:HAS_CATEGORY]->(cat:Category)

  WHERE b.stars >= 4.5
    AND b.review_count >= 10

  WITH b,
       c,
       collect(DISTINCT cat.name) AS categories

  RETURN b.business_id AS business_id,
         b.name AS name,
         b.address AS address,
         c.name AS city,
         b.stars AS stars,
         b.review_count AS review_count,
         categories

  ORDER BY b.stars DESC,
           b.review_count DESC

  LIMIT $limit
`;

module.exports = {
  GET_GRAPH_STATS,
  SEARCH_BUSINESSES,
  GET_BUSINESS_BY_ID,
  GET_BUSINESS_REVIEWS,
  GET_SIMILAR_BUSINESSES,
  GET_MULTI_HOP_COMMUNITY_INSIGHTS,
  GET_CATEGORIES,
  GET_CITIES,
  GET_FEATURED_BUSINESSES
};