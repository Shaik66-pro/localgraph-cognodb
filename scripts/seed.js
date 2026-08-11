require('dotenv').config();
const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');

const DATA_DIR = path.join(__dirname, '../data/cleaned');

const uri = process.env.COGNODB_URI;
const username = process.env.COGNODB_USERNAME;
const password = process.env.COGNODB_PASSWORD;

if (!uri || !username || !password) {
  console.error('❌ Missing CognoDB environment variables in .env!');
  console.error('Expected COGNODB_URI, COGNODB_USERNAME, COGNODB_PASSWORD.');
  process.exit(1);
}

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password), {
  maxConnectionPoolSize: 10,
  connectionTimeout: 30000
});

async function runSeed() {
  console.log('🌱 Starting CognoDB Database Seeding...');
  console.log(`🔌 Connecting to CognoDB at: ${uri}`);

  try {
    await driver.verifyConnectivity();
    console.log('✅ Connected to CognoDB successfully!');
  } catch (err) {
    console.error('❌ Failed to connect to CognoDB Cloud:', err.message);
    console.error('Please verify COGNODB_URI, COGNODB_USERNAME, and COGNODB_PASSWORD in .env.');
    process.exit(1);
  }

  // Load cleaned JSON files
  console.log('📂 Loading cleaned dataset files...');
  const cities = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'cities.json'), 'utf8'));
  const categories = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'categories.json'), 'utf8'));
  let businesses = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'businesses.json'), 'utf8'));
  let users = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'users.json'), 'utf8'));
  let reviews = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'reviews.json'), 'utf8'));

  // Target optimal seeding numbers for CognoDB Cloud Free Instance:
  // ~2,500 Businesses, ~5,000 Users, ~15,000 Reviews, ~800 Categories
  if (businesses.length > 2500) businesses = businesses.slice(0, 2500);
  const activeBusIds = new Set(businesses.map((b) => b.business_id));
  reviews = reviews.filter((r) => activeBusIds.has(r.business_id));

  if (users.length > 6000) users = users.slice(0, 6000);
  const activeUserIds = new Set(users.map((u) => u.user_id));
  reviews = reviews.filter((r) => activeUserIds.has(r.user_id));
  if (reviews.length > 15000) reviews = reviews.slice(0, 15000);

  console.log(`📊 Seed Payload Targets:`);
  console.log(`   - Cities:     ${cities.length}`);
  console.log(`   - Categories: ${categories.length}`);
  console.log(`   - Businesses: ${businesses.length}`);
  console.log(`   - Users:      ${users.length}`);
  console.log(`   - Reviews:    ${reviews.length}`);

  const session = driver.session();

  try {
    // 1. Create uniqueness indexes / constraints if supported
    console.log('⚡ Creating Indexes & Constraints...');
    const constraintQueries = [
      'CREATE CONSTRAINT bus_id_unique IF NOT EXISTS FOR (b:Business) REQUIRE b.business_id IS UNIQUE',
      'CREATE CONSTRAINT user_id_unique IF NOT EXISTS FOR (u:User) REQUIRE u.user_id IS UNIQUE',
      'CREATE CONSTRAINT rev_id_unique IF NOT EXISTS FOR (r:Review) REQUIRE r.review_id IS UNIQUE',
      'CREATE CONSTRAINT cat_name_unique IF NOT EXISTS FOR (c:Category) REQUIRE c.name IS UNIQUE',
      'CREATE CONSTRAINT city_name_unique IF NOT EXISTS FOR (ci:City) REQUIRE ci.name IS UNIQUE'
    ];

    for (const q of constraintQueries) {
      try {
        await session.run(q);
      } catch (e) {
        // Silently catch unsupported index syntax if CognoDB version differs
      }
    }

    // Helper for executing batch transactions
    const batchExecute = async (query, items, batchSize = 500, label = 'Items') => {
      console.log(`   -> Loading ${items.length} ${label}...`);
      for (let i = 0; i < items.length; i += batchSize) {
        const chunk = items.slice(i, i + batchSize);
        await session.executeWrite((tx) => tx.run(query, { batch: chunk }));
        process.stdout.write(`      Processed ${Math.min(i + batchSize, items.length)} / ${items.length}\r`);
      }
      console.log(`\n   ✅ ${label} loaded.`);
    };

    // 2. Seed Cities
    const cityQuery = `
      UNWIND $batch AS item
      MERGE (c:City {name: item.name})
      SET c.city_id = item.city_id,
          c.state = item.state
    `;
    await batchExecute(cityQuery, cities, 500, 'Cities');

    // 3. Seed Categories
    const catQuery = `
      UNWIND $batch AS item
      MERGE (cat:Category {name: item.name})
      SET cat.category_id = item.category_id
    `;
    await batchExecute(catQuery, categories, 500, 'Categories');

    // 4. Seed Businesses & LOCATED_IN
    const busQuery = `
      UNWIND $batch AS item
      MERGE (b:Business {business_id: item.business_id})
      SET b.name = item.name,
          b.address = item.address,
          b.city = item.city,
          b.state = item.state,
          b.postal_code = item.postal_code,
          b.latitude = item.latitude,
          b.longitude = item.longitude,
          b.stars = item.stars,
          b.review_count = item.review_count,
          b.is_open = item.is_open
      WITH b, item
      MATCH (c:City {name: item.city})
      MERGE (b)-[:LOCATED_IN]->(c)
    `;
    await batchExecute(busQuery, businesses, 300, 'Businesses & Cities');

    // 5. Seed Business -> Category Relationships
    const busCatItems = [];
    businesses.forEach((b) => {
      if (b.categories && Array.isArray(b.categories)) {
        b.categories.forEach((catName) => {
          busCatItems.push({ business_id: b.business_id, category_name: catName });
        });
      }
    });

    const busCatQuery = `
      UNWIND $batch AS item
      MATCH (b:Business {business_id: item.business_id})
      MATCH (cat:Category {name: item.category_name})
      MERGE (b)-[:HAS_CATEGORY]->(cat)
    `;
    await batchExecute(busCatQuery, busCatItems, 500, 'Business-Category Relationships');

    // 6. Seed Users
    const userQuery = `
      UNWIND $batch AS item
      MERGE (u:User {user_id: item.user_id})
      SET u.name = item.name,
          u.review_count = item.review_count,
          u.average_stars = item.average_stars,
          u.fans = item.fans,
          u.yelping_since = item.yelping_since
    `;
    await batchExecute(userQuery, users, 400, 'Users');

    // 7. Seed Reviews & WROTE / ABOUT Relationships
    const reviewQuery = `
      UNWIND $batch AS item
      MATCH (u:User {user_id: item.user_id})
      MATCH (b:Business {business_id: item.business_id})
      MERGE (r:Review {review_id: item.review_id})
      SET r.stars = item.stars,
          r.useful = item.useful,
          r.text = item.text,
          r.date = item.date
      MERGE (u)-[:WROTE]->(r)
      MERGE (r)-[:ABOUT]->(b)
    `;
    await batchExecute(reviewQuery, reviews, 250, 'Reviews & Relationships (WROTE / ABOUT)');

    // 8. Verification Counts
    console.log('\n🔍 Verifying Seeding Node & Relationship Counts...');
    const countsRes = await session.run(`
      CALL { MATCH (b:Business) RETURN count(b) AS busCount }
      CALL { MATCH (u:User) RETURN count(u) AS userCount }
      CALL { MATCH (r:Review) RETURN count(r) AS revCount }
      CALL { MATCH (c:City) RETURN count(c) AS cityCount }
      CALL { MATCH (cat:Category) RETURN count(cat) AS catCount }
      RETURN busCount, userCount, revCount, cityCount, catCount
    `);

    if (countsRes.records.length > 0) {
      const rec = countsRes.records[0];
      console.log('✅ Graph DB Counts in CognoDB Cloud:');
      console.log(`   - Businesses: ${rec.get('busCount')}`);
      console.log(`   - Users:      ${rec.get('userCount')}`);
      console.log(`   - Reviews:    ${rec.get('revCount')}`);
      console.log(`   - Cities:     ${rec.get('cityCount')}`);
      console.log(`   - Categories: ${rec.get('catCount')}`);
    }

    console.log('\n🎉 CognoDB Database Seeding Completed Successfully!');
  } finally {
    await session.close();
    await driver.close();
  }
}

runSeed().catch((err) => {
  console.error('❌ Seeding Error:', err);
  process.exit(1);
});
