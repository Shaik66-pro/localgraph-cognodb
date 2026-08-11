const fs = require('fs');
const path = require('path');
const readline = require('readline');

const DATASET_DIR = path.join(__dirname, '../dataset');
const OUTPUT_DIR = path.join(__dirname, '../data/cleaned');

// Indian Cities mapping for the Yelp dataset hubs
const CITY_MAPPING = {
  'Santa Barbara': { name: 'Mumbai', state: 'MH' },
  'Goleta': { name: 'Bengaluru', state: 'KA' },
  'Montecito': { name: 'Delhi', state: 'DL' },
  'Carpinteria': { name: 'Goa', state: 'GA' },
  'Summerland': { name: 'Pune', state: 'MH' }
};

const TARGET_CITIES = new Set(Object.keys(CITY_MAPPING));

async function preprocess() {
  console.log('🚀 Starting Yelp Dataset Preprocessing with Indian Cities Mapping...');
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // 1. Process Business Data
  console.log('📍 Phase 1: Filtering Businesses, Cities & Categories...');
  const busStream = fs.createReadStream(
    path.join(DATASET_DIR, 'yelp_academic_dataset_business.json'),
    { encoding: 'utf8' }
  );
  const rlBus = readline.createInterface({ input: busStream, crlfDelay: Infinity });

  const businesses = [];
  const validBusinessIds = new Set();
  const citiesMap = new Map();
  const categoriesMap = new Map();
  const businessCategoriesMap = new Map();

  for await (const line of rlBus) {
    if (!line.trim()) continue;
    const item = JSON.parse(line);

    if (item.city && TARGET_CITIES.has(item.city)) {
      validBusinessIds.add(item.business_id);

      // Map to Indian City & State
      const mappedCity = CITY_MAPPING[item.city];
      const cityKey = `${mappedCity.name}_${mappedCity.state}`;
      
      if (!citiesMap.has(cityKey)) {
        citiesMap.set(cityKey, {
          city_id: `city_${mappedCity.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
          name: mappedCity.name,
          state: mappedCity.state
        });
      }

      // Parse categories string into array
      const catList = item.categories
        ? item.categories.split(',').map((c) => c.trim()).filter(Boolean)
        : [];
      
      catList.forEach((catName) => {
        const catId = `cat_${catName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
        if (!categoriesMap.has(catId)) {
          categoriesMap.set(catId, {
            category_id: catId,
            name: catName
          });
        }
      });

      businessCategoriesMap.set(item.business_id, catList);

      businesses.push({
        business_id: item.business_id,
        name: item.name,
        address: item.address || '',
        city: mappedCity.name,
        state: mappedCity.state,
        postal_code: item.postal_code || '',
        latitude: item.latitude || 0,
        longitude: item.longitude || 0,
        stars: item.stars || 0,
        review_count: item.review_count || 0,
        is_open: item.is_open !== undefined ? item.is_open : 1,
        categories: catList
      });
    }
  }

  console.log(`✅ Extracted ${businesses.length} Businesses across ${citiesMap.size} Indian Cities (${Array.from(citiesMap.values()).map(c=>c.name).join(', ')}) and ${categoriesMap.size} Categories.`);

  // 2. Process Reviews
  console.log('📝 Phase 2: Scanning Reviews for Selected Businesses...');
  const revStream = fs.createReadStream(
    path.join(DATASET_DIR, 'yelp_academic_dataset_review.json'),
    { encoding: 'utf8' }
  );
  const rlRev = readline.createInterface({ input: revStream, crlfDelay: Infinity });

  const rawReviews = [];
  const userReviewFreq = new Map();

  let reviewCounter = 0;
  for await (const line of rlRev) {
    if (!line.trim()) continue;
    reviewCounter++;

    const rev = JSON.parse(line);
    if (validBusinessIds.has(rev.business_id)) {
      rawReviews.push({
        review_id: rev.review_id,
        user_id: rev.user_id,
        business_id: rev.business_id,
        stars: rev.stars,
        useful: rev.useful || 0,
        funny: rev.funny || 0,
        cool: rev.cool || 0,
        text: rev.text ? rev.text.substring(0, 500) : '',
        date: rev.date || ''
      });

      userReviewFreq.set(rev.user_id, (userReviewFreq.get(rev.user_id) || 0) + 1);
    }
  }

  console.log(`✅ Found ${rawReviews.length} total reviews for target businesses across ${userReviewFreq.size} distinct users.`);

  // Filter users with >= 2 reviews to create a rich multi-hop co-review graph
  const selectedUserIds = new Set();
  for (const [userId, count] of userReviewFreq.entries()) {
    if (count >= 2) {
      selectedUserIds.add(userId);
    }
  }

  if (selectedUserIds.size < 5000) {
    for (const [userId] of userReviewFreq.entries()) {
      selectedUserIds.add(userId);
      if (selectedUserIds.size >= 8000) break;
    }
  }

  console.log(`🎯 Selected ${selectedUserIds.size} active users for dense graph recommendations.`);

  const finalReviews = rawReviews.filter((r) => selectedUserIds.has(r.user_id));
  console.log(`✅ Final graph review count: ${finalReviews.length}`);

  // 3. Process User Data
  console.log('👤 Phase 3: Extracting User Profiles...');
  const userStream = fs.createReadStream(
    path.join(DATASET_DIR, 'yelp_academic_dataset_user.json'),
    { encoding: 'utf8' }
  );
  const rlUser = readline.createInterface({ input: userStream, crlfDelay: Infinity });

  const finalUsers = [];
  const foundUserIds = new Set();

  for await (const line of rlUser) {
    if (!line.trim()) continue;
    const usr = JSON.parse(line);

    if (selectedUserIds.has(usr.user_id)) {
      foundUserIds.add(usr.user_id);
      finalUsers.push({
        user_id: usr.user_id,
        name: usr.name || 'Anonymous',
        review_count: usr.review_count || 0,
        average_stars: usr.average_stars || 0,
        fans: usr.fans || 0,
        yelping_since: usr.yelping_since || ''
      });
    }
  }

  for (const uid of selectedUserIds) {
    if (!foundUserIds.has(uid)) {
      finalUsers.push({
        user_id: uid,
        name: 'Yelp Reviewer',
        review_count: userReviewFreq.get(uid) || 1,
        average_stars: 4.0,
        fans: 0,
        yelping_since: '2020-01-01 00:00:00'
      });
    }
  }

  console.log(`✅ Extracted ${finalUsers.length} User profiles.`);

  // 4. Save Cleaned Data Files
  console.log('💾 Phase 4: Writing Cleaned Dataset to data/cleaned/...');
  fs.writeFileSync(path.join(OUTPUT_DIR, 'businesses.json'), JSON.stringify(businesses, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'cities.json'), JSON.stringify(Array.from(citiesMap.values()), null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'categories.json'), JSON.stringify(Array.from(categoriesMap.values()), null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'users.json'), JSON.stringify(finalUsers, null, 2));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'reviews.json'), JSON.stringify(finalReviews, null, 2));

  console.log('\n🎉 Dataset Preprocessing with Indian Cities Complete!');
  console.log('Summary of Cleaned Data:');
  console.log(` - Businesses: ${businesses.length}`);
  console.log(` - Cities:     ${citiesMap.size} (${Array.from(citiesMap.values()).map(c=>c.name).join(', ')})`);
  console.log(` - Categories: ${categoriesMap.size}`);
  console.log(` - Users:      ${finalUsers.length}`);
  console.log(` - Reviews:    ${finalReviews.length}`);
}

preprocess().catch((err) => {
  console.error('❌ Preprocessing failed:', err);
  process.exit(1);
});
