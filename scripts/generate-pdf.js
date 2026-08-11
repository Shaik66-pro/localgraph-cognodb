const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const doc = new PDFDocument({
  margin: 50,
  size: 'A4'
});

const outputPath = path.join(__dirname, '../PROJECT_DOCUMENTATION.pdf');
const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Helper styles
const primaryColor = '#2563EB'; // Blue
const secondaryColor = '#1F2937'; // Dark Gray
const accentColor = '#D97706'; // Amber

function addHeader(title) {
  doc.fillColor(primaryColor).fontSize(20).text(title, { underline: true });
  doc.moveDown(0.5);
  doc.fillColor(secondaryColor);
}

function addSubHeader(subtitle) {
  doc.fillColor(accentColor).fontSize(14).text(subtitle);
  doc.moveDown(0.3);
  doc.fillColor(secondaryColor);
}

function addParagraph(text) {
  doc.fontSize(10).text(text, { align: 'justify', lineGap: 3 });
  doc.moveDown(0.5);
}

function addBullet(bullet, text) {
  doc.fontSize(10).text(`• ${bullet}: `, { continued: true }).text(text);
  doc.moveDown(0.2);
}

// --- TITLE PAGE / HEADER ---
doc.fillColor(primaryColor).fontSize(26).text('LocalGraph Business Discovery Network', { align: 'center' });
doc.fontSize(14).fillColor(secondaryColor).text('Full Stack Graph Database Application Documentation', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(10).fillColor('#6B7280').text(`Generated: ${new Date().toLocaleDateString()} | Backed by CognoDB Cloud Graph DB`, { align: 'center' });
doc.moveDown(1.5);

// --- SECTION 1: EXECUTIVE SUMMARY ---
addHeader('1. Executive Summary & Architecture');
addParagraph('LocalGraph is a modern, graph-powered business discovery and personalized recommendation application built on top of CognoDB Cloud (Neo4j Graph Database). It models real-world entity relationships between Users, Businesses, Categories, Cities, and Reviews to provide real-time graph insights.');

addBullet('Backend Tech Stack', 'Node.js, Express.js, Neo4j JavaScript Driver, Helmet, CORS');
addBullet('Frontend Tech Stack', 'React 18, Vite, Tailwind CSS, Lucide React Icons, Axios');
addBullet('Graph Database', 'CognoDB Cloud (bolt+s://db-ca8b7c27.databases.cognodb.com)');
addBullet('Deployment Targets', 'Render.com, Vercel, Docker Container, Railway');
doc.moveDown(1);

// --- SECTION 2: GRAPH DATABASE MODEL ---
addHeader('2. Graph Database Schema & Data Model');
addParagraph('The dataset models Yelp local business activity converted into property graph nodes and directed relationships.');

addSubHeader('Node Labels & Properties');
addBullet(':Business', 'business_id, name, address, city, state, postal_code, stars, review_count, is_open');
addBullet(':Category', 'name (e.g. Restaurants, Seafood, Coffee, Shopping)');
addBullet(':City', 'name, state');
addBullet(':User', 'user_id, name, review_count');
addBullet(':Review', 'review_id, stars, date, text');
doc.moveDown(0.5);

addSubHeader('Graph Relationships');
addBullet('(Business)-[:IN_CATEGORY]->(Category)', 'Categorizes business into domain taxonomies');
addBullet('(Business)-[:LOCATED_IN]->(City)', 'Links business to its geographical city');
addBullet('(User)-[:WROTE]->(Review)', 'Connects user to their submitted review');
addBullet('(Review)-[:REVIEWS]->(Business)', 'Links review directly to target business');
doc.moveDown(1);

// --- SECTION 3: CYPHER GRAPH QUERIES & RECOMMENDATIONS ---
addHeader('3. Core Cypher Graph Traversals');
addParagraph('LocalGraph executes optimized Cypher graph traversal patterns to deliver graph-based recommendations and analytics:');

addSubHeader('Collaborative Filtering Recommendation Query');
doc.font('Courier').fontSize(8.5).fillColor('#1E293B').text(`MATCH (b:Business {business_id: $businessId})<-[:REVIEWS]-(r1:Review)<-[:WROTE]-(u:User)
MATCH (u)-[:WROTE]->(r2:Review)-[:REVIEWS]->(rec:Business)
WHERE rec.business_id <> $businessId AND r2.stars >= 4
MATCH (rec)-[:IN_CATEGORY]->(c:Category)
RETURN rec.business_id, rec.name, rec.stars, rec.review_count,
       count(DISTINCT u) AS commonReviewers,
       collect(DISTINCT c.name)[..3] AS categories
ORDER BY commonReviewers DESC, rec.stars DESC LIMIT $limit`);
doc.font('Helvetica').fontSize(10).fillColor(secondaryColor);
doc.moveDown(1);

// --- SECTION 4: API ENDPOINT REFERENCE ---
addHeader('4. REST API Endpoint Reference');
addBullet('GET /api/health', 'Returns server status, uptime, and CognoDB Cloud graph database connection health.');
addBullet('GET /api/businesses', 'Paginated search with query, city, category, minStars, and sort options.');
addBullet('GET /api/businesses/:id', 'Retrieves detailed properties and connected nodes for a specific business.');
addBullet('GET /api/businesses/:id/recommendations', 'Triggers graph traversal to return recommended businesses based on shared reviewers.');
addBullet('GET /api/categories', 'Returns top business categories with entity counts.');
addBullet('GET /api/cities', 'Returns available cities in graph dataset.');
addBullet('GET /api/insights', 'Returns graph statistics and top connected business nodes.');
doc.moveDown(1);

// --- SECTION 5: GLOBAL DEPLOYMENT GUIDE ---
addHeader('5. Global Cloud Deployment Guide');
addParagraph('The project is fully configured for single-command production deployment on Render, Vercel, or Docker:');

addSubHeader('Deploying to Render.com (Free Tier)');
addBullet('1. Push Code to GitHub', 'Ensure all changes are pushed to repository main branch.');
addBullet('2. Create Render Web Service', 'Connect GitHub repo to Render, select Node environment.');
addBullet('3. Configure Commands', 'Build Command: npm run build | Start Command: npm start');
addBullet('4. Set Environment Variables', 'COGNODB_URI, COGNODB_USERNAME, COGNODB_PASSWORD');
addBullet('5. Go Live', 'Render automatically deploys your app to a global live URL (https://localgraph-cognodb.onrender.com).');

writeStream.on('finish', () => {
  console.log('✅ PDF Documentation successfully generated at PROJECT_DOCUMENTATION.pdf');
});
