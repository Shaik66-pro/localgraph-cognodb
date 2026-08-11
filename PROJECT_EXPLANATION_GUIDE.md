# LocalGraph — Complete Project & Purpose Guide

## 1. What is this Project For? (Core Purpose & Real-World Problem)

### The Real-World Problem
When people search for local businesses (restaurants, cafes, shops, service providers), existing platforms like Yelp or Google Maps typically rely on **isolated star ratings**, **keyword matching**, or **generic city filters**. 

However, average star ratings are often misleading:
- A 4.5-star fast-food drive-thru and a 4.5-star fine-dining Italian restaurant have the same rating, but serve completely different audiences.
- A user searching for a specialty coffee shop doesn't just want any high-rated cafe; they want a place trusted by **people with similar taste and preferences**.

### The Solution: LocalGraph
**LocalGraph** is a **Graph-Native Business Discovery & Recommendation Engine** backed by **CognoDB Cloud** (an openCypher graph database running over Bolt protocol).

Instead of treating businesses and reviews as isolated rows in a traditional database table, LocalGraph models local commerce as a **connected social-business graph**:

> **"If users who loved Business A also reviewed and loved Business B, then Business B is a high-confidence recommendation for anyone interested in Business A."**

---

## 2. What Can You Do With This Application? (Key Features)

### 1. Discover Similar Businesses via 2-Hop Graph Traversals
- When a user opens any business page (e.g. *Santa Barbara Shellfish Company* or *Helena Avenue Bakery*), LocalGraph automatically executes a **live 2-hop openCypher graph traversal** in CognoDB Cloud.
- It finds other businesses that share active reviewers, ranking them by **shared reviewer density** (e.g. *"Connected by 45 shared reviewers"*).

### 2. Multi-Hop Category & Community Insights (3-Hop Traversal)
- Users can explore hidden community connections that cross business categories (e.g. discovering that people who visit local bakeries also frequent specific artisan coffee roasters and craft breweries).

### 3. Smart Multi-Filter Search
- Search and filter establishments by:
  - **City / Metro Region** (e.g. Santa Barbara, Goleta, Montecito)
  - **Category** (e.g. Restaurants, Seafood, Coffee, Taqueria)
  - **Minimum Star Rating** (e.g. 4.0★ & above)
  - **Keyword / Name Search**

### 4. Interactive Business Profiles & Community Reviews
- View detailed business profiles, address, geographic coordinates, star badges, category tags, and authentic reviews connected through `(User)-[:WROTE]->(Review)-[:ABOUT]->(Business)` graph relationships.

### 5. Resilient Offline/Online Database Status
- Real-time CognoDB status monitor. If CognoDB is unreachable or disconnected, the application gracefully presents a non-crashing fallback notice (*"Unable to connect to the business network. Please try again later."*) without breaking the frontend interface.

---

## 3. Step-by-Step Architecture: How It Works From End to End

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           RAW DATASET LAYER                             │
│ Kaggle Yelp Academic Dataset (business.json, user.json, review.json)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       PREPROCESSING & SUBSETTING                        │
│ Filter Santa Barbara Hub -> Clean IDs -> Export data/cleaned/*.json     │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           COGNODB CLOUD SEED                            │
│ Batch parameterized MERGE queries over Bolt (2,500 Bus, 6,000 Users)    │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         NODE.JS / EXPRESS BACKEND                        │
│ neo4j-driver -> Parameterized Cypher Query Layer -> REST Endpoints      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           REACT / VITE FRONTEND                         │
│ Modern CSS Glassmorphism -> Interactive Pages -> Graph Rec Cards        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Preprocessing & Data Subsetting (`scripts/preprocess.js`)
- Raw Kaggle Yelp JSON files contain millions of records (~8.8 GB).
- The preprocessor extracts a dense, well-connected regional hub (**Santa Barbara, CA & surrounding coastal towns**).
- It filters users with $\ge 2$ local reviews to guarantee a **dense co-review graph topology**.
- Outputs clean JSON files: `businesses.json`, `users.json`, `reviews.json`, `cities.json`, `categories.json`.

### Step 2: Graph Data Modeling (`GRAPH_MODEL.md`)
- **Nodes**:
  - `(:Business {business_id, name, address, city, state, stars, review_count})`
  - `(:User {user_id, name, review_count, average_stars, fans})`
  - `(:Review {review_id, stars, text, date})`
  - `(:City {name, state})`
  - `(:Category {name})`
- **Relationships**:
  - `(:User)-[:WROTE]->(:Review)`
  - `(:Review)-[:ABOUT]->(:Business)`
  - `(:Business)-[:LOCATED_IN]->(:City)`
  - `(:Business)-[:HAS_CATEGORY]->(:Category)`

### Step 3: Database Seeding (`scripts/seed.js`)
- Establishes a secure TLS Bolt connection (`bolt+s://db-ca8b7c27.databases.cognodb.com`) using `neo4j-driver`.
- Sets up uniqueness constraints on IDs (`business_id`, `user_id`, `review_id`).
- Loads nodes and typed relationships using idempotent `UNWIND $batch AS item MERGE ...` queries.

### Step 4: Parameterized Cypher Query Layer (`backend/src/queries/cypherQueries.js`)
- Houses all openCypher queries.
- All user inputs are passed as parameters (`$business_id`, `$city`, `$minRating`, `$searchTerm`) to prevent Cypher injection vulnerabilities.

### Step 5: Express REST API Layer (`backend/src/controllers/businessController.js`)
- Provides REST endpoints (`/api/health`, `/api/businesses`, `/api/businesses/:id/recommendations`, `/api/insights`, etc.).
- Converts Neo4j integer structures into native JavaScript objects.
- Handles database downtime gracefully with 503 fallback responses.

### Step 6: React + Vite Frontend UI (`frontend/src/`)
- Polished single-page application built with React 18, Vite, and custom CSS.
- Features glassmorphism dark theme, pill badges, loading skeletons, empty state boxes, error alerts, and graph recommendation cards.

---

## 4. Deep-Dive: The Core Graph Traversal Query

### The 2-Hop openCypher Query
```cypher
MATCH (b:Business {business_id: $business_id})<-[:ABOUT]-(r1:Review)<-[:WROTE]-(u:User)-[:WROTE]->(r2:Review)-[:ABOUT]->(rec:Business)
WHERE rec.business_id <> $business_id
OPTIONAL MATCH (rec)-[:LOCATED_IN]->(c:City)
OPTIONAL MATCH (rec)-[:HAS_CATEGORY]->(cat:Category)
WITH rec, c, collect(DISTINCT cat.name) AS categories, count(DISTINCT u) AS shared_reviewers, avg(r2.stars) AS avg_shared_rating
RETURN rec.business_id AS business_id,
       rec.name AS name,
       rec.stars AS stars,
       rec.review_count AS review_count,
       rec.address AS address,
       c.name AS city,
       categories,
       shared_reviewers,
       avg_shared_rating
ORDER BY shared_reviewers DESC, rec.stars DESC
LIMIT $limit
```

### Why a Graph Database Beats Relational Databases (SQL)
1. **SQL 5-Table JOIN Penalty**: In PostgreSQL or MySQL, finding co-reviewed businesses requires joining `businesses b1 JOIN reviews r1 ON ... JOIN users u ON ... JOIN reviews r2 ON ... JOIN businesses b2 ON ...` with heavy `GROUP BY` operations. As the review table grows to millions of rows, relational JOIN performance degrades exponentially ($O(N^k)$).
2. **Index-Free Adjacency in CognoDB**: In CognoDB Cloud, relationships are stored as direct physical memory pointers. Traversing from `Business -> Review -> User -> Review -> Business` executes in **constant time $O(1)$ per edge hop**, delivering recommendations in milliseconds regardless of total graph size.

---

## 5. How to Explain This Project in an Interview

### 30-Second Elevator Pitch
> *"I built **LocalGraph**, a graph-native business discovery and recommendation network backed by CognoDB Cloud and the Kaggle Yelp Academic Dataset. Instead of using generic star ratings, LocalGraph runs 2-hop openCypher graph traversals to recommend local businesses based on shared reviewer density—connecting users with places trusted by people who share their taste. It includes a Node.js/Express backend with 100% parameterized queries, a polished React/Vite frontend with modern CSS glassmorphism, automated tests, and graceful offline fallback handling."*

### Key Technical Points You Can Defend:
1. **Data Modeling**: *"I modeled Users, Reviews, Businesses, Cities, and Categories as labeled nodes connected by typed relationships (`WROTE`, `ABOUT`, `LOCATED_IN`, `HAS_CATEGORY`), taking advantage of Index-Free Adjacency."*
2. **Subsetting & Scaling**: *"To respect CognoDB free-tier RAM limits while guaranteeing graph density, I extracted a focused multi-city hub (Santa Barbara, CA) filtered for active co-reviewers, producing 2,500 businesses, 6,000 users, and 15,000 reviews."*
3. **Security**: *"All Cypher queries are strictly parameterized using `$param` bindings with the official `neo4j-driver`, avoiding any Cypher string concatenation vulnerabilities."*
4. **Resilience**: *"If CognoDB Cloud is unreachable, the Express backend returns structured 503 fallback responses and the React UI displays a friendly notification banner with retry functionality."*
