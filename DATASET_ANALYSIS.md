# Dataset Analysis — LocalGraph (Yelp Academic Dataset)

## 1. Overview of Dataset Files
The project workspace contains the official Kaggle Yelp Academic Dataset in JSON Lines (JSONL) format:

| File Name | File Size | Approximate Record Count | Description / Role in Graph |
| :--- | :--- | :--- | :--- |
| `yelp_academic_dataset_business.json` | 118.8 MB | ~150,346 records | Core Business nodes, Categories, Locations |
| `yelp_academic_dataset_user.json` | 3.36 GB | ~1,980,000 records | User nodes, reviewer profile metrics |
| `yelp_academic_dataset_review.json` | 5.34 GB | ~6,990,000 records | Review nodes / WROTE & ABOUT relationships |
| `yelp_academic_dataset_checkin.json` | 286.9 MB | ~131,930 records | Business check-in timestamps |
| `yelp_academic_dataset_tip.json` | 180.6 MB | ~1,215,600 records | Short user tips on businesses |

---

## 2. Record Structure & Field Inspection

### A. Business (`yelp_academic_dataset_business.json`)
```json
{
  "business_id": "Pns2l4eNsfO8kk83dixA6A",
  "name": "Abby Rappoport, LAC, CMQ",
  "address": "1616 Chapala St, Ste 2",
  "city": "Santa Barbara",
  "state": "CA",
  "postal_code": "93101",
  "latitude": 34.4266787,
  "longitude": -119.7111968,
  "stars": 5.0,
  "review_count": 7,
  "is_open": 0,
  "attributes": { "ByAppointmentOnly": "True" },
  "categories": "Doctors, Traditional Chinese Medicine, Naturopathic/Holistic, Acupuncture, Health & Medical, Nutritionists",
  "hours": null
}
```
* **Useful Fields for Graph**:
  * `business_id` (Primary Key)
  * `name`, `address`, `postal_code`, `stars`, `review_count`, `is_open`, `latitude`, `longitude`
  * `city`, `state` (Normalizable into `City` nodes and `LOCATED_IN` relationships)
  * `categories` (Comma-separated string, normalizable into `Category` nodes and `HAS_CATEGORY` relationships)

### B. User (`yelp_academic_dataset_user.json`)
```json
{
  "user_id": "qVc8ODYU5SZjKXVBgXdI7w",
  "name": "Walker",
  "review_count": 585,
  "yelping_since": "2007-01-25 16:47:26",
  "useful": 7217,
  "funny": 1259,
  "cool": 5994,
  "fans": 267,
  "average_stars": 3.91
}
```
* **Useful Fields for Graph**:
  * `user_id` (Primary Key)
  * `name`, `review_count`, `average_stars`, `fans`, `yelping_since`

### C. Review (`yelp_academic_dataset_review.json`)
```json
{
  "review_id": "KU_O5udG6zpxOg-VcAEodg",
  "user_id": "mh_-eMZ6K5RLWhZyISBhwA",
  "business_id": "XQfwVwDr-v0ZS3_CbbE5Xw",
  "stars": 3,
  "useful": 0,
  "funny": 0,
  "cool": 0,
  "text": "If you decide to eat here...",
  "date": "2018-07-07 22:09:11"
}
```
* **Useful Fields for Graph**:
  * `review_id` (Primary Key)
  * `user_id` (Foreign Key -> User)
  * `business_id` (Foreign Key -> Business)
  * `stars`, `useful`, `funny`, `cool`, `text`, `date`

---

## 3. Geographic & Community Distribution
Empirical analysis of the dataset shows the following top business concentrations:
- **Philadelphia, PA**: 14,569 businesses (967,552 reviews)
- **Tucson, AZ**: 9,250 businesses
- **Tampa, FL**: 9,050 businesses
- **Indianapolis, IN**: 7,540 businesses
- **Nashville, TN**: 6,971 businesses
- **New Orleans, LA**: 6,209 businesses (635,364 reviews)
- **Santa Barbara, CA**: 3,829 businesses (269,630 reviews)

---

## 4. Subset Selection Strategy for CognoDB Cloud Instance

### Why Subsetting is Required
The full Kaggle dataset comprises **~9 million total records** (150k businesses + 1.9M users + 6.9M reviews), taking over 8.8 GB in raw JSON. Ingesting 9M nodes into a cloud-hosted free instance of CognoDB would exceed memory limits and cause high seed timeouts.

### Selected Subset: Santa Barbara & Coastal CA Hub
We select **Santa Barbara, CA** as our primary focal region.
- **Businesses**: 3,829 businesses in Santa Barbara.
- **Reviews**: Filter reviews corresponding to Santa Barbara businesses (~269,630 raw reviews).
- **Users**: Filter users who reviewed businesses in Santa Barbara. To maintain a dense co-review graph with meaningful multi-hop recommendations, we select users with $\ge 2$ reviews in the region (~10,000 active co-reviewing users).
- **Extracted Seed Size**:
  - **Businesses**: ~3,829
  - **Users**: ~10,000
  - **Reviews**: ~35,000
  - **Categories**: ~1,200
  - **Cities**: ~1 (`Santa Barbara`)
  - **Total Nodes**: ~50,000
  - **Total Relationships**: ~100,000

This subset guarantees **dense multi-hop traversal paths** (e.g. `Business A <-[:ABOUT]- Review <-[:WROTE]- User -[:WROTE]-> Review -[:ABOUT]-> Business B`) while staying well within CognoDB Cloud free instance limits.
