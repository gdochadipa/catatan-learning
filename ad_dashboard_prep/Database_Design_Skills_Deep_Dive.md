# Masterclass Deep-Dive: Database Design and Query Optimization

Welcome to your comprehensive, 1-day deep-dive training guide focusing exclusively on the core requirement: **"Practical experience in database design"**.

Ad tech platforms generate immense volumes of raw event data. Serving real-time analytics to your **Ad Dashboard** requires bulletproof database schemas. A poorly structured table layout or missing index will result in slow dashboard loads, CPU spikes, and database locking.

This guide covers Relational Modeling, Normalization theory, Indexing mechanics, Range Partitioning architectures, OLTP vs. OLAP trade-offs, and high-performance SQL aggregate operations.

---

# 📅 THE 1-DAY CURRICULUM

---

## 1. Relational Database Modeling and Normalization

Database design begins with structuring entities to guarantee data integrity and minimize redundancy.

### Normalization Theory (1NF to 3NF)
Normalization is the process of organizing data in a database to reduce redundancy and prevent update anomalies.

Let's walk through normalizing an un-structured ad platform campaign log:

#### Un-normalized Data (The Spreadsheet Anti-pattern):
```
[ Campaign_ID ] [ Campaign_Name ]  [ Budget ] [ Creative_Title ] [ Impression_Count ]
camp-101        "Summer Promo"     500.00     "Sunny Banner"     12,500
camp-101        "Summer Promo"     500.00     "Beach Sale Video" 34,200
```
*Vulnerability:* If you update the campaign budget, you must write changes to multiple rows. If one write fails, the database falls into an inconsistent state (an **Update Anomaly**).

#### First Normal Form (1NF): Atomic Values
*   **The Rule:** Each table cell must contain a single, atomic value. No multi-value arrays or repeating groups. Every row must have a unique identifier (Primary Key).

#### Second Normal Form (2NF): No Partial Dependencies
*   **The Rule:** Must satisfy 1NF, and **all non-key attributes must depend on the entire Primary Key**.
*   *Application:* If we have a composite primary key `(campaign_id, creative_id)`, a non-key attribute like `campaign_budget` only depends on the `campaign_id` (a partial dependency). We must separate this into two tables: `campaigns` and `creatives`.

#### Third Normal Form (3NF): No Transitive Dependencies
*   **The Rule:** Must satisfy 2NF, and **no non-key attribute should depend transitively on the primary key** through another non-key attribute.
*   *Application:* In a campaign table containing `advertiser_id` and `advertiser_billing_currency`, the currency depends on the advertiser, not the campaign ID. To resolve, we split this into `advertisers` and `campaigns` tables.

```
[ advertisers ] (1:N) ──► [ campaigns ] (1:N) ──► [ ad_creatives ] (1:N) ──► [ hourly_analytics ]
```

### When to Denormalize
While 3NF is perfect for operational transactions (updating status, changing budgets), it slows down complex reporting aggregates. Calculating total impressions across 50 advertisers requires traversing 4 table joins (`JOIN`).
*   **Denormalization Rule:** For analytical dashboards, we deliberately introduce redundant data (e.g., storing `campaign_id` directly inside `hourly_analytics` table instead of traversing through `creative_id`) to bypass expensive joins and maximize read speeds.

---

## 2. SQL Indexing Mechanics and Query Planning

An index is a separate data structure (typically a **B-Tree**) that acts as a lookup pointer for your table. Without an index, the database engine must scan every single physical page on disk (a **Full Table Scan**) to execute a search.

```
       B-TREE INDEX TREE
           [ ID: 50 ]
          /          \
    [ ID: 25 ]     [ ID: 75 ]
    /        \     /        \
  [1..10]  [26..49] [51..74] [76..100]  <-- Leaf nodes pointing to physical disk locations
```

### Composite Indexes & The Leftmost Prefix Rule
When creating an index on multiple columns, column order matters.
```sql
CREATE INDEX idx_campaign_date ON hourly_analytics(campaign_id, date_hour);
```
*   **How it works:** The B-Tree sorts records first by `campaign_id`, and then by `date_hour`.
*   **The Rule:** You can search using `(campaign_id)` or `(campaign_id, date_hour)`. However, searching strictly for `date_hour` **cannot** use the B-Tree index, because the tree is structured from left to right. This is called the **Leftmost Prefix Rule**.

### Explaining Your Queries
Before deploying database updates, run your queries through the database engine's query planner using `EXPLAIN ANALYZE`:
```sql
EXPLAIN ANALYZE 
SELECT SUM(impressions) FROM hourly_analytics WHERE campaign_id = 'camp-101';
```
*   **Key terms to inspect in query plans:**
    *   `Seq Scan` (Sequence Scan): Bad. The engine is scanning the entire table sequentially from disk. Indicates a missing index.
    *   `Index Scan` / `Index Only Scan`: Good. The engine is querying the pre-sorted B-Tree directly, avoiding physical table reads.
    *   `Nested Loop`: Indicates the engine is looping through outer join conditions, which can drag performance if nested collections lack indices.

---

## 3. High-Scale Aggregation Architectures

An ad platform processing 100M daily tracking pings will quickly overflow a standard relational database. You must scale the storage layers.

### Declarative Range Partitioning
Partitioning splits a massive logical table into smaller, physically independent tables based on a key (e.g., transaction date).

```
                 [ LOGICAL ANALYTICS TABLE ]
                             │
         ┌───────────────────┼───────────────────┐
         ▼                   ▼                   ▼
 [ PARTITION JUN_01 ] [ PARTITION JUN_02 ] [ PARTITION JUN_03 ] (Physical sub-tables)
```

*   **Query Pruning:** When querying statistics for "June 2nd", the database planner ignores all other partitions, executing the query only against the physical table slice for June 2nd. This limits disk I/O, maintaining rapid query times even as the dataset grows into billions of rows.

### OLTP vs. OLAP Database Systems
Architecting reporting dashboards requires choosing the correct tool for the job.

#### OLTP (Online Transaction Processing)
*   **Systems:** PostgreSQL, MySQL, SQLite.
*   **Storage Layout:** Row-oriented. Stores all columns of a record sequentially on disk.
*   **Best for:** Highly structured, low-latency CRUD actions (e.g., adding user profiles, updating billing payment records, toggling campaign status).

#### OLAP (Online Analytical Processing)
*   **Systems:** ClickHouse, Snowflake, Google BigQuery.
*   **Storage Layout:** Columnar. Stores all values of a single column together on disk.
*   **Best for:** Processing aggregations (`SUM`, `AVG`, `GROUP BY`) across millions of historical log entries in milliseconds.

```
Row-Oriented Layout (OLTP):
[Row 1: ID, Name, Status, Budget] ──► [Row 2: ID, Name, Status, Budget]

Columnar Layout (OLAP):
[All IDs] ──► [All Names] ──► [All Statuses] ──► [All Budgets]  <-- Highly compressible!
```

---

## 🛠️ Practical Hands-On Lab

### Task: Code a complete PostgreSQL database schema featuring relational constraints, Range Partitioning on time-series logs, data seeding, and advanced analytical SQL queries (with Window Functions).

You can run this SQL code on any local PostgreSQL engine. It establishes a partitioned table structure, inserts temporal records, and calculates ad-tech KPI metrics.

#### File: `schema_lab.sql`
```sql
-- ============================================================================
-- STEP 1: Establish Relational Base Tables (OLTP Layers)
-- ============================================================================

-- Clean up existing mock environments
DROP TABLE IF EXISTS hourly_analytics CASCADE;
DROP TABLE IF EXISTS ad_creatives CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS advertisers CASCADE;

CREATE TABLE advertisers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE campaigns (
    id VARCHAR(36) PRIMARY KEY,
    advertiser_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'PAUSED',
    budget DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (advertiser_id) REFERENCES advertisers(id) ON DELETE CASCADE
);

CREATE TABLE ad_creatives (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    format VARCHAR(50) NOT NULL, -- DISPLAY, VIDEO, NATIVE
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- ============================================================================
-- STEP 2: Declarative Range Partitioning for High-Scale Time-Series Metrics
-- ============================================================================

-- Base table defined as PARTITION BY RANGE
CREATE TABLE hourly_analytics (
    id BIGSERIAL,
    creative_id VARCHAR(36) NOT NULL,
    campaign_id VARCHAR(36) NOT NULL, -- Denormalized field to speed up campaigns GROUP BY calculations
    date_hour TIMESTAMP NOT NULL,
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    spend DECIMAL(12, 4) DEFAULT 0.0000,
    PRIMARY KEY (id, date_hour) -- Partition key must be part of the primary key constraint!
) PARTITION BY RANGE (date_hour);

-- Define individual daily physical partition tables
CREATE TABLE hourly_analytics_y2026m06d01 PARTITION OF hourly_analytics
    FOR VALUES FROM ('2026-06-01 00:00:00') TO ('2026-06-02 00:00:00');

CREATE TABLE hourly_analytics_y2026m06d02 PARTITION OF hourly_analytics
    FOR VALUES FROM ('2026-06-02 00:00:00') TO ('2026-06-03 00:00:00');

-- Add supporting indices directly to partitions for rapid query resolution
CREATE INDEX idx_partition_camp_date ON hourly_analytics(campaign_id, date_hour);

-- ============================================================================
-- STEP 3: Seed Mock Data Records
-- ============================================================================

INSERT INTO advertisers (id, name, currency) VALUES
('adv-01', 'Rakuten E-Commerce', 'JPY'),
('adv-02', 'Tokyo Travel Agency', 'JPY');

INSERT INTO campaigns (id, advertiser_id, name, status, budget) VALUES
('camp-display', 'adv-01', 'Rakuten Summer Banner Sale', 'ACTIVE', 50000.00),
('camp-video', 'adv-01', 'Tokyo Travel Video Promo', 'ACTIVE', 120000.00);

INSERT INTO ad_creatives (id, campaign_id, title, format) VALUES
('cr-banner-blue', 'camp-display', 'Blue Promo Banner', 'DISPLAY'),
('cr-banner-red', 'camp-display', 'Red Promo Banner', 'DISPLAY'),
('cr-video-15s', 'camp-video', 'Mount Fuji Video Ad', 'VIDEO'),
('cr-video-30s', 'camp-video', 'Kyoto Tour Video Ad', 'VIDEO');

-- Seed records explicitly mapped to distinct daily partition boundaries
INSERT INTO hourly_analytics (creative_id, campaign_id, date_hour, impressions, clicks, spend) VALUES
-- Day 1 Partition (June 1st)
('cr-banner-blue', 'camp-display', '2026-06-01 10:00:00', 10000, 250, 45.50),
('cr-banner-red', 'camp-display', '2026-06-01 11:00:00', 12000, 210, 42.10),
('cr-video-15s', 'camp-video', '2026-06-01 10:00:00', 50000, 1500, 320.00),
('cr-video-30s', 'camp-video', '2026-06-01 11:00:00', 65000, 1850, 410.50),

-- Day 2 Partition (June 2nd)
('cr-banner-blue', 'camp-display', '2026-06-02 10:00:00', 15000, 380, 68.20),
('cr-banner-red', 'camp-display', '2026-06-02 11:00:00', 11000, 195, 38.50),
('cr-video-15s', 'camp-video', '2026-06-02 10:00:00', 52000, 1420, 310.00),
('cr-video-30s', 'camp-video', '2026-06-02 11:00:00', 70000, 2100, 450.00);

-- ============================================================================
-- STEP 4: High-Performance Analytical Queries
-- ============================================================================

-- Query A: Retrieve Daily Campaign Performance Report with Computed KPIs
SELECT 
    c.name AS campaign_name,
    DATE(ha.date_hour) AS reporting_day,
    SUM(ha.impressions) AS total_impressions,
    SUM(ha.clicks) AS total_clicks,
    ROUND(SUM(ha.spend), 2) AS total_spend,
    
    -- CTR calculation with NULLIF to prevent division-by-zero
    ROUND((SUM(ha.clicks)::DECIMAL / NULLIF(SUM(ha.impressions), 0)) * 100, 3) AS ctr_pct,
    
    -- eCPC calculation
    ROUND(SUM(ha.spend) / NULLIF(SUM(ha.clicks), 0), 2) AS ecpc_cost,
    
    -- eCPM calculation: (spend / impressions) * 1000
    ROUND((SUM(ha.spend) / NULLIF(SUM(ha.impressions), 0)) * 1000, 2) AS ecpm_cost
FROM campaigns c
JOIN hourly_analytics ha ON c.id = ha.campaign_id
WHERE ha.date_hour BETWEEN '2026-06-01 00:00:00' AND '2026-06-02 23:59:59'
GROUP BY c.id, c.name, DATE(ha.date_hour)
ORDER BY reporting_day ASC, total_spend DESC;

-- Query B: Rank Ad Creatives per Campaign based on total Spend using Window Functions
-- Highly relevant interview pattern to show advanced analytics capability!
WITH creative_spend_totals AS (
    SELECT 
        ac.campaign_id,
        ac.title AS creative_title,
        ac.format AS creative_format,
        SUM(ha.spend) AS total_creative_spend
    FROM ad_creatives ac
    JOIN hourly_analytics ha ON ac.id = ha.creative_id
    GROUP BY ac.campaign_id, ac.id, ac.title, ac.format
)
SELECT 
    campaign_id,
    creative_title,
    creative_format,
    total_creative_spend,
    -- Rank creatives per campaign dynamically
    DENSE_RANK() OVER (PARTITION BY campaign_id ORDER BY total_creative_spend DESC) AS spend_rank
FROM creative_spend_totals;
```

---

---

## 🗂️ Interactive Flashcard Deck
*Test your knowledge interactively. Click on each card to reveal the hidden answer.*

<details>
<summary><b>Card 1: What is an update anomaly, and how does Third Normal Form (3NF) prevent it?</b></summary>
<p><b>Answer:</b></p>
<p>An update anomaly occurs when redundant copies of a data field exist across a database. If a value changes but is only updated in some rows, the database falls into an inconsistent state. 3NF prevents this by eliminating transitive dependencies, ensuring every non-key value depends strictly on the primary key, mapping attributes to a single source of truth.</p>
</details>

<details>
<summary><b>Card 2: If you have a table index on columns (advertiser_id, campaign_id), will a query searching using only campaign_id benefit from the index? Why or why not?</b></summary>
<p><b>Answer:</b></p>
<p>No. Under the B-Tree Leftmost Prefix Rule, composite indexes are sorted sequentially from left to right. Because the index is organized first by <code>advertiser_id</code>, querying for <code>campaign_id</code> alone cannot walk the index hierarchy, forcing a costly Full Table Scan.</p>
</details>

<details>
<summary><b>Card 3: Explain the difference between Row Partitioning vs. Database Sharding.</b></summary>
<p><b>Answer:</b></p>
<p>Row Partitioning splits a massive logical table into physically smaller tables on the **same physical server instance**. Database Sharding distributes the database rows **across physically independent server nodes**, horizontally scaling both hardware compute power and network capacity.</p>
</details>

<details>
<summary><b>Card 4: In PostgreSQL range partitioning, why must the partition key column (e.g. date_hour) be included in the primary key constraint definition?</b></summary>
<p><b>Answer:</b></p>
<p>To guarantee global uniqueness constraints across partitions. Because PostgreSQL implements partitions as separate physical tables, enforcing a primary key unique constraint requires that any incoming record maps to a predictable partition based on the key, making the partition column a mandatory part of the primary key definition.</p>
</details>

<details>
<summary><b>Card 5: Why do analytical databases (like ClickHouse) execute SUM aggregates significantly faster than standard OLTP databases (like PostgreSQL)?</b></summary>
<p><b>Answer:</b></p>
<p>Analytical databases utilize a **Columnar Storage Layout**. This allows the engine to load only the specific targeted columns (e.g., clicks) from disk, bypassing all other unneeded columns (like titles, names, etc.). Since columns are stored sequentially on disk, the database can run superfast sequential vector scans directly in CPU cache memory.</p>
</details>
