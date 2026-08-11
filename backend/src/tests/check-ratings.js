const { getSession, closeDriver } = require('../config/db');

async function checkRatings() {
    let session;

    try {
        session = getSession();

        console.log('\n🔎 Checking Business Rating Distribution...\n');

        // 1. Rating distribution
        const distribution = await session.run(`
      MATCH (b:Business)
      RETURN b.stars AS stars, count(b) AS business_count
      ORDER BY stars ASC
    `);

        console.log('📊 Rating Distribution:');

        distribution.records.forEach((record) => {
            const stars = record.get('stars');
            const count = record.get('business_count');

            console.log(
                `- ${stars} ★ : ${count.toNumber ? count.toNumber() : count} businesses`
            );
        });

        // 2. Lowest ratings
        const lowest = await session.run(`
      MATCH (b:Business)
      RETURN b.business_id AS business_id,
             b.name AS name,
             b.stars AS stars,
             b.review_count AS review_count
      ORDER BY b.stars ASC
      LIMIT 20
    `);

        console.log('\n⬇️ Lowest-rated businesses:');

        lowest.records.forEach((record) => {
            console.log(
                `- ${record.get('name')} | ${record.get('stars')} ★ | ${record.get('review_count')} reviews`
            );
        });

        // 3. Highest ratings
        const highest = await session.run(`
      MATCH (b:Business)
      RETURN b.business_id AS business_id,
             b.name AS name,
             b.stars AS stars,
             b.review_count AS review_count
      ORDER BY b.stars DESC
      LIMIT 20
    `);

        console.log('\n⬆️ Highest-rated businesses:');

        highest.records.forEach((record) => {
            console.log(
                `- ${record.get('name')} | ${record.get('stars')} ★ | ${record.get('review_count')} reviews`
            );
        });

        console.log('\n✅ Rating check completed successfully.');
    } catch (err) {
        console.error('\n❌ Rating check failed:', err.message);
    } finally {
        if (session) {
            await session.close();
        }

        await closeDriver();
    }
}

checkRatings();