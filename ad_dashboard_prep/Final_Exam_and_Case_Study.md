# Final Examination & System Design Case Study

This final evaluation is divided into two sections:
1.  **Technical Quiz (15 Questions):** Checks your front-end, build pipeline, Go backend, and Ad Tech knowledge.
2.  **System Design Case Study:** Challenges you to outline an end-to-end architecture for an Ad Platform Analytics dashboard.

---

## Section 1: Technical & Ad Tech Examination
*Test your preparedness interactively. Click on each card to expand and reveal the answers.*

### 📂 1. React & TypeScript

<details>
<summary><b>Q1: A developer creates a custom hook that returns [value, setValue] as an array. When importing, TS complains that the returned types are union types (string | ((val: string) => void))[] instead of specific tuple positions [string, (val: string) => void]. How do you fix this in TypeScript?</b></summary>
<p><b>Answer:</b></p>
<p>TS infers arrays as dynamic lists, so types are grouped in a union. To fix, append <code>as const</code> to force TS to treat the return value as a immutable, read-only tuple of fixed index positions:</p>
<pre><code>return [value, setValue] as const;</code></pre>
</details>

<details>
<summary><b>Q2: Explain what a React "stale closure" is inside a useEffect callback, and how you resolve it.</b></summary>
<p><b>Answer:</b></p>
<p>A stale closure occurs when an effect captures values (variables, state, props) from its initial render scope, but those values change over time. If they are omitted from the <code>useEffect</code> dependency array, the effect is never re-evaluated, meaning it operates using outdated references. To fix, declare all variables referenced in the effect inside its **dependency array** or wrap values in a mutable <code>useRef</code>.</p>
</details>

<details>
<summary><b>Q3: In a dense ad campaign analytics page with multiple sub-components, how does React Context compare to Redux Toolkit in terms of render performance? Under what circumstances does React Context cause excessive renders?</b></summary>
<p><b>Answer:</b></p>
<p>React Context is designed for low-frequency updates (like theme or locale settings). It has a major performance drawback: **every component consuming the context is forced to re-render whenever the context value changes**, even if the specific component only cares about 1 sub-field. Redux Toolkit uses **selectors** (<code>useSelector</code>) that run a strict reference equality check on selected values. Components only re-render if the specifically selected slice of state actually changes, making Redux RTK much faster for high-frequency dashboards.</p>
</details>

### 📂 2. Frontend Performance & Build Pipelines

<details>
<summary><b>Q4: Describe the exact steps you would take to find why a specific table row in your Campaign Dashboard is taking 120ms to render after clicking its "Pause Campaign" button.</b></summary>
<p><b>Answer:</b></p>
<ol>
  <li>Open React DevTools and check "Record why each component rendered."</li>
  <li>Start recording in the Profiler, click the button, and stop.</li>
  <li>Inspect the Ranked Chart. Find the target table row.</li>
  <li>Verify the rendering cause (e.g., "Props changed: <code>onSelect</code> reference").</li>
  <li>Check if <code>onSelect</code> is wrapped in <code>useCallback</code> in the parent.</li>
  <li>Review Chrome DevTools Performance CPU tab to check if heavy JS processing (like list formatting) or standard layouts are blocking the main thread.</li>
</ol>
</details>

<details>
<summary><b>Q5: Why is rendering 1,000 campaigns with standard mapping arrays slower than using a virtualized list container? Explain the DOM-level reason.</b></summary>
<p><b>Answer:</b></p>
<p>Standard lists load all 1,000 sets of nodes into the browser's DOM tree simultaneously. This forces the browser to run expensive Reflow/Layout computations and increases memory overhead. Virtualized lists keep a static container size and only append nodes actually intersecting with the scroll viewport. The total loaded DOM node count stays small (e.g., only 15-20 rows), resulting in rapid scrolling and minimal memory consumption.</p>
</details>

<details>
<summary><b>Q6: In Webpack, what is the core architectural difference between a Loader and a Plugin?</b></summary>
<p><b>Answer:</b></p>
<p><b>Loaders</b> act on individual files before or during the bundling process (e.g., transforming <code>.ts</code> into <code>.js</code> via <code>ts-loader</code> or translating sass to css). <b>Plugins</b> operate on the entire compilation bundle output stream (e.g., extracting CSS into independent static files, minimizing outputs, or optimizing chunk allocations).</p>
</details>

<details>
<summary><b>Q7: How do you configure Webpack to ensure your heavy charting library (e.g., recharts) is split into a separate bundle instead of loading in the primary index.js payload?</b></summary>
<p><b>Answer:</b></p>
<p>Implement Webpack's <code>splitChunks</code> optimization configuration:</p>
<pre><code>optimization: {
  splitChunks: {
    chunks: 'all',
  }
}</code></pre>
<p>Additionally, wrap charts in a React Dynamic Import (<code>const Charts = React.lazy(() => import('./Charts'))</code>) to ensure they are compiled into separate lazy-loaded chunks.</p>
</details>

### 📂 3. Golang Backend & Security

<details>
<summary><b>Q8: How does Go's http.Request.Context() propagate variables across middlewares and handlers? Write a quick pseudo-code block showing how you'd retrieve user metadata set by a JWT middleware inside a dashboard endpoint.</b></summary>
<p><b>Answer:</b></p>
<p>Go's <code>context.Context</code> propagates request-scoped data down call stacks safely.</p>
<pre><code>func getProfile(w http.ResponseWriter, r *http.Request) {
    // Retrieve custom claims from context
    claims, ok := r.Context().Value(UserContextKey).(*CustomClaims)
    if !ok {
        http.Error(w, "Unauthorized", http.StatusUnauthorized)
        return
    }
    fmt.Fprintf(w, "Logged in user: %s", claims.UserID)
}</code></pre>
</details>

<details>
<summary><b>Q9: In JWT authentication, what are "claims," and what are the security trade-offs of using symmetric signing (HS256) vs. asymmetric signing (RS256)?</b></summary>
<p><b>Answer:</b></p>
<p>"Claims" are attributes or key-value structures stored in the token's JSON payload (such as expiration time <code>exp</code> or user ID <code>user_id</code>). <b>Symmetric signing (HS256)</b> uses a single secret key to both sign and verify tokens—if an API microservice gets compromised, attackers can sign fraudulent tokens. <b>Asymmetric signing (RS256)</b> uses a private key on the auth server to sign, and a public key on resource APIs to verify. Microservices can safely verify tokens using the public key without any risk of creating new tokens.</p>
</details>

<details>
<summary><b>Q10: Your backend API needs to support file uploads for campaign image ads. How do you process multi-part forms in Go without running out of server RAM if an advertiser uploads a 100MB file?</b></summary>
<p><b>Answer:</b></p>
<p>Do not parse the entire file into server RAM using standard byte slices. Instead, use Go's <code>r.ParseMultipartForm(maxMemory)</code> (limiting RAM usage, e.g., to 10MB). Any remaining file size overflows onto temporary disk partitions automatically. Then read the file as a stream (<code>multipart.File</code>) and pipe it directly to your cloud storage bucket (e.g., AWS S3) using <code>io.Copy</code>.</p>
</details>

### 📂 4. Database Design & SQL

<details>
<summary><b>Q11: In your hourly analytics database table, write a raw SQL statement to fetch the top 5 campaigns with the highest CTR for the week of June 1, 2026.</b></summary>
<p><b>Answer:</b></p>
<pre><code>SELECT 
    c.id, 
    c.name, 
    SUM(ha.clicks) AS clicks, 
    SUM(ha.impressions) AS impressions,
    (SUM(ha.clicks)::DECIMAL / NULLIF(SUM(ha.impressions), 0)) * 100 AS ctr
FROM campaigns c
JOIN ad_creatives ac ON c.id = ac.campaign_id
JOIN hourly_analytics ha ON ac.id = ha.creative_id
WHERE ha.date_hour BETWEEN '2026-06-01 00:00:00' AND '2026-06-07 23:59:59'
GROUP BY c.id, c.name
ORDER BY ctr DESC
LIMIT 5;</code></pre>
</details>

<details>
<summary><b>Q12: Explain the difference between a relational indexes B-Tree lookup vs. an analytical database columnar layout (such as ClickHouse or Postgres with TimescaleDB) for running aggregation calculations over 100 Million daily records.</b></summary>
<p><b>Answer:</b></p>
<p>Relational databases store tables in row-oriented configurations (storing entire records sequentially on disk). Doing aggregations like <code>SUM(clicks)</code> requires loading full row structures into memory, which slows down at scale. <b>Columnar databases</b> store values column-by-column (storing all clicks together, all impressions together). Summing click values requires reading just that single column from the disk, allowing for sub-second calculations on billions of records.</p>
</details>

### 📂 5. Ad Tech Domain Expertise

<details>
<summary><b>Q13: Walk through the complete network event cycle of a conversion event, starting from a user clicking an ad on a publisher's site, purchasing an item on an advertiser's store, to the conversion showing up on your dashboard.</b></summary>
<p><b>Answer:</b></p>
<ol>
  <li>User clicks an ad displaying custom link containing a click identifier: <code>https://store.com?click_id=102030</code>.</li>
  <li>Ad platform logs click event, associates <code>click_id=102030</code> with the user's browser cookied profile, and increments the campaign click count in the database.</li>
  <li>User buys an item. The checkout page fires a pixel tag request: <code>https://adserver.com/pixel?click_id=102030&revenue=100.00</code>.</li>
  <li>Ad server matches the <code>click_id</code> or user's third-party tracking cookie with the original click event.</li>
  <li>Server records a successful conversion, stores it in the analytical database, and the aggregation engine updates dashboard campaign metrics.</li>
</ol>
</details>

<details>
<summary><b>Q14: Compare cookie-based tracking pixels to Server-to-Server (S2S) conversion tracking. What is the security and data reliability difference in modern browser environments?</b></summary>
<p><b>Answer:</b></p>
<p>Cookie-based tracking relies on browsers reading cookies in third-party environments. Due to modern security restrictions (ITP, Apple iOS tracking controls, cookie blocking), these are heavily limited or blocked entirely, resulting in incomplete attribution reports. Server-to-Server tracking registers conversions by sending clicks with explicit first-party query IDs (<code>click_id</code>) which are stored directly on the client's store. When a purchase completes, their server fires the conversion back to the ad system backend directly, ensuring 100% data reliability and bypasses browser blocking.</p>
</details>

<details>
<summary><b>Q15: What is the mathematical calculation for effective Cost Per Click (eCPC) and Click-Through Rate (CTR)?</b></summary>
<p><b>Answer:</b></p>
<ul>
  <li>$\text{CTR} = \frac{\text{Clicks}}{\text{Impressions}} \times 100$</li>
  <li>$\text{eCPC} = \frac{\text{Total Spend}}{\text{Total Clicks}}$</li>
</ul>
</details>

---

## Section 2: Case Study Architecture Blueprint

Below is the industry-standard architecture blueprint for the **Ad-Aggregator** System. Use this to score your design proposal:

```
[Tracking Pixel Snippet]  ──(conversion / S2S)──> [Load Balancer]
                                                        │
                                                        ▼
                                             [Go Event Ingestion API]
                                             (validates & pushes quickly)
                                                        │
                                                        ▼
                                               [Kafka Event Stream]
                                                        │
                                                        ▼
                                             [Flink / Aggregator Worker]
                                             (hourly summaries)
                                                        │
                                                        ▼
  [React/TS Frontend] ◄──(JSON API)── [Go Query Service] ◄── [ClickHouse DB]
  (dashboard tables/charts)                                (Reporting Store)
```

#### 1. Real-Time Event Ingestion (Low-Latency)
*   Deploy lightweight **Go Event APIs** behind an Application Load Balancer.
*   **Avoid Database Writes on Ingestion:** Go servers must NOT write raw click/impression rows to SQL databases in real-time. Instead, they write to a message broker like **Apache Kafka** or **AWS Kinesis** (processing writes in microsecond intervals).
*   Respond to the client pixel immediately with a `204 No Content` or 1x1 transparent image.

#### 2. Data Aggregation & Storage (The Analytical Layer)
*   **Raw Logs:** Stream raw events from Kafka into an object storage cold warehouse (e.g., S3 via Parquet files) for future audits.
*   **Processing Engine:** Use a stream processing framework (e.g., Apache Flink or structured background workers) to process and summarize events hourly.
*   **Reporting Database:** Store aggregated metrics inside a columnar analytical store (e.g., **ClickHouse** or **PostgreSQL with TimescaleDB**). This ensures analytical aggregates execute in milliseconds.

#### 3. Real-Time Command Pipeline (Campaign Pause/Play)
*   Dashboard interactions must propagate instantly. When an advertiser clicks "Pause":
    *   The **React Frontend** hits the Go Admin API.
    *   The API updates the SQL database campaign status to `PAUSED`.
    *   The API fires an immediate invalidation message to a cache layer (e.g., **Redis Pub/Sub**).
    *   The edge ad-serving servers subscribe to Redis and immediately stop rendering the campaign creative.

#### 4. Frontend Optimization (Dashboard Rendering)
*   **Lazy Load Views:** Wrap dashboard modules (like campaign management vs. invoices) in dynamic imports.
*   **Dashboard Charts:** Render temporal graphs using canvas or WebGL wrappers (like `recharts` or `apexcharts`). Apply `useMemo` on aggregate calculations.
*   **Tables:** Render massive campaigns list with a virtualized container (e.g., `react-window` or `react-virtual`) to guarantee smooth 60fps scrolling and keep DOM footprints minimal.
*   **Filter States:** Centralize parameters (like date range, campaign filter) in **Redux Toolkit** to ensure state changes propagate to charts and lists in sync.
