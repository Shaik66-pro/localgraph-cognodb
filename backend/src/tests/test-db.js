require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') });
const { getSession, verifyConnection, closeDriver } = require('../config/db');
const queries = require('../queries/cypherQueries');
const neo4j = require('neo4j-driver');

async function runTests() {
  console.log('🧪 Running CognoDB Database & Graph Query Verification Tests...\n');

  // Test 1: Connectivity
  console.log('Test 1: Connection Verification');
  const isConnected = await verifyConnection();
  if (!isConnected) {
    console.error('❌ Test 1 FAILED: Cannot connect to CognoDB Cloud.');
    process.exit(1);
  }
  console.log('✅ Test 1 PASSED: CognoDB Bolt connection successful!\n');

  const session = getSession();

  try {
    // Test 2: Graph Statistics Query
    console.log('Test 2: Graph Database Node & Relationship Counts');
    const statsRes = await session.run(queries.GET_GRAPH_STATS);
    if (statsRes.records.length > 0) {
      const rec = statsRes.records[0];
      console.log('   - Total Businesses:', rec.get('totalBusinesses').toNumber());
      console.log('   - Total Users:     ', rec.get('totalUsers').toNumber());
      console.log('   - Total Reviews:   ', rec.get('totalReviews').toNumber());
      console.log('   - Total Cities:    ', rec.get('totalCities').toNumber());
      console.log('   - Total Categories:', rec.get('totalCategories').toNumber());
    }
    console.log('✅ Test 2 PASSED: Graph stats retrieved successfully.\n');

    // Test 3: Search Businesses Query
    console.log('Test 3: Parameterized Business Search Query');
    const searchRes = await session.run(queries.SEARCH_BUSINESSES, {
      city: 'Santa Barbara',
      category: null,
      minRating: 4.0,
      searchTerm: null,
      skip: neo4j.int(0),
      limit: neo4j.int(3)
    });
    console.log(`   Retrieved ${searchRes.records.length} highly-rated businesses in Santa Barbara:`);
    let sampleBusId = null;
    searchRes.records.forEach((r) => {
      if (!sampleBusId) sampleBusId = r.get('business_id');
      console.log(`   - [${r.get('business_id')}] ${r.get('name')} (${r.get('stars')} ★, ${r.get('review_count')} reviews)`);
    });
    console.log('✅ Test 3 PASSED: Business search query works.\n');

    // Test 4: MAIN FEATURE — 2-Hop Similar Business Recommendation Query
    if (sampleBusId) {
      console.log(`Test 4: 2-Hop Similar Business Recommendation Query for Business ID: '${sampleBusId}'`);
      const recsRes = await session.run(queries.GET_SIMILAR_BUSINESSES, {
        business_id: sampleBusId,
        limit: neo4j.int(3)
      });
      console.log(`   Found ${recsRes.records.length} graph recommendations via shared reviewer graph traversal:`);
      recsRes.records.forEach((r) => {
        const shared = r.get('shared_reviewers');
        const sharedNum = shared && shared.toNumber ? shared.toNumber() : shared;
        console.log(`   - Recommendation: ${r.get('name')} (${r.get('stars')} ★) | Shared Reviewers: ${sharedNum} | Shared Rating: ${r.get('avg_shared_rating')} ★`);
      });
      console.log('✅ Test 4 PASSED: 2-Hop graph recommendation query executed cleanly!\n');
    }

    console.log('🎉 ALL BACKEND DATABASE TESTS PASSED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Test Execution Error:', err);
    process.exit(1);
  } finally {
    await session.close();
    await closeDriver();
  }
}

runTests();
