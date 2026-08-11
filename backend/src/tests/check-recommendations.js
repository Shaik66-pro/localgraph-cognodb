const { getSession, closeDriver } = require('../config/db');

async function testRecommendationGraph() {
    let session;

    try {
        session = getSession();

        console.log('\n🔍 TESTING RECOMMENDATION GRAPH...\n');

        const businessId = '3MieDW5uihkPvXqnxAIGmg';

        const result = await session.run(
            `
            MATCH (b:Business {business_id: $businessId})
            <-[:ABOUT]-(r1:Review)
            <-[:WROTE]-(u:User)
            -[:WROTE]->(r2:Review)
            -[:ABOUT]->(rec:Business)

            WHERE rec.business_id <> $businessId

            RETURN
                rec.business_id AS business_id,
                rec.name AS name,
                rec.stars AS stars,
                count(DISTINCT u) AS shared_users

            ORDER BY shared_users DESC, rec.stars DESC

            LIMIT 10
            `,
            {
                businessId
            }
        );

        console.log('Business:', businessId);
        console.log('\nRECOMMENDATIONS FOUND:', result.records.length);
        console.log('----------------------------------------');

        result.records.forEach((record) => {
            console.log(
                record.get('name'),
                '|',
                record.get('stars'),
                '★ | shared users:',
                record.get('shared_users').toNumber()
            );
        });

        if (result.records.length === 0) {
            console.log('\n❌ NO RECOMMENDATIONS FOUND');
            console.log('SB Buggie has no shared-reviewer path.');
        } else {
            console.log('\n✅ RECOMMENDATION GRAPH IS WORKING!');
        }

    } catch (err) {
        console.error('\n❌ ERROR:', err.message);
    } finally {
        if (session) {
            await session.close();
        }

        await closeDriver();
    }
}

testRecommendationGraph();