# Interactive Interview Flashcards: Full-Stack Ad Dashboard

Welcome to your interactive prep deck. This file contains **42 highly structured, high-yield flashcards** covering every module and deep-dive guide in your study program.

### 💡 How to Use
These cards use standard Markdown inside HTML `<details>` blocks. 
*   Read the **Question/Front** of the card.
*   Formulate your answer mentally.
*   Click the **triangle dropdown arrow** on the left of each question to reveal the hidden answer.

---

## 🗂️ DECK 1: Advanced React & TypeScript (Hooks & States)

<details>
<summary><b>Q1: What is the React Fiber Reconciler, and how does it manage hooks?</b></summary>

**Answer:**

*   **Fiber Engine:** Fiber is React's concurrent reconciler. It splits rendering work into asynchronous, non-blocking chunks (Render Phase) before synchronously applying updates to the browser DOM (Commit Phase).
*   **The Linked List:** React tracks hook states using a singly linked list called `memoizedState` on the Fiber node.
*   **Sequential Rule:** React traverses this list in the exact same order on every render, which is why hooks must never be called conditionally or inside loops.

</details>

<details>
<summary><b>Q2: What is a "stale closure" inside a React hook, and what are three ways to resolve it?</b></summary>

**Answer:**

A stale closure occurs when an asynchronous callback (such as a timeout, event listener, or `useEffect`) closes over variables from an older render scope, executing operations with outdated references.

**Three ways to resolve:**
1.  **Functional state updates:** Use `setCount(prev => prev + 1)` to query state directly from React internals.
2.  **Declare dependency arrays:** Include the variable in the hook's dependency list to trigger re-creation of the closure scope when value changes.
3.  **Utilize `useRef`:** Store the variable inside a mutable ref object (`ref.current`), which maintains a persistent reference across renders.

</details>

<details>
<summary><b>Q3: What is the performance cost of useMemo and useCallback, and when should you avoid them?</b></summary>

**Answer:**

*   **The Cost:** They are not free. Both hooks allocate system memory to cache dependencies and references, executing comparisons on every single render.
*   **When to Avoid:** Avoid on primitive mathematical operations or lightweight values where the cost of caching exceeds the calculation speed.
*   **When to Use:** Use only for heavy computations (sorting large lists) or when passing reference arrays/objects down to child components wrapped in `React.memo` to preserve identity checks.

</details>

<details>
<summary><b>Q4: What is the difference between React Context API and Redux Toolkit (RTK) in terms of rendering performance?</b></summary>

**Answer:**

*   **Context API:** Lacks selector optimizations. Any state change inside a Provider forces **every single component that consumes that context** to re-render, even if a component only references a sub-field of the context.
*   **Redux Toolkit (RTK):** Uses highly optimized selectors (`useSelector`). It performs strict reference equality checks on the returned values, triggering re-renders **only** if the specific selected slice of state actually changes.

</details>

<details>
<summary><b>Q5: How do you split State and Dispatch Context Providers to optimize performance?</b></summary>

**Answer:**

Create two separate contexts:
```typescript
const StateContext = createContext(initialState);
const DispatchContext = createContext(null);
```

Wrap your component with both Providers. Components that only trigger actions consume `DispatchContext` (which maintains a stable function reference and never changes), allowing them to bypass re-renders completely when state values change.

</details>

<details>
<summary><b>Q6: What does the 'as const' assertion do in TypeScript when returning hook tuple structures?</b></summary>

**Answer:**

By default, TS infers returned arrays as dynamic unions (e.g., `(string | Function)[]`). Adding `as const` forces TS to treat the array as a read-only, fixed-position, immutable tuple (e.g., `[string, (v: string) => void]`), preserving exact type checking during destructuring.

</details>

---

## 🗂️ DECK 2: Front-End Performance & Build Pipelines (Profiling & Webpack)

<details>
<summary><b>Q7: How do you identify rendering bottlenecks using the React DevTools Profiler?</b></summary>

**Answer:**

1.  Enable "Record why each component rendered" in React DevTools settings.
2.  Click Record, trigger the laggy dashboard interactions (such as filter changes), and stop.
3.  In the **Ranked Chart** view, inspect the heaviest rendering components at the top.
4.  Read the render explanation directly (e.g., `Props changed: [onSelect]`) to identify missing memoization hooks.

</details>

<details>
<summary><b>Q8: How does List Virtualization (windowing) optimize dashboard performance?</b></summary>

**Answer:**

*   **The DOM Limit:** Mounting thousands of raw table row DOM nodes exhausts memory, forcing browser reflow layouts to freeze during scrolling.
*   **The Optimization:** Virtualization keeps a static scroll container, only mounting DOM nodes that physically intersect with the user's visible viewport (plus a small buffer). It recycles elements dynamically, keeping the DOM footprint microscopic.

</details>

<details>
<summary><b>Q9: What is the core architectural difference between a Webpack Loader and a Plugin?</b></summary>

**Answer:**

*   **Loader:** Operates on individual files **before** or during compilation. Translates non-JS files (e.g., compiling TypeScript via `ts-loader`, importing CSS via `css-loader`) into valid JS modules.
*   **Plugin:** Operates on the **entire compilation bundle output**. Handles advanced tasks like bundle minification (`TerserPlugin`), extracting CSS (`MiniCssExtractPlugin`), and automatic script injection.

</details>

<details>
<summary><b>Q10: What does the [contenthash] placeholder do in Webpack output configurations, and why is it crucial?</b></summary>

**Answer:**

It appends a unique cryptographic hash generated from the file's content directly to the bundled file name (e.g., `main.8f9b2d.js`).

**Importance:** It prevents browser caching issues. When code is updated, the hash changes, forcing browsers to immediately fetch the new file, while maintaining cached files for unmodified assets.

</details>

<details>
<summary><b>Q11: How do you configure Webpack to split heavy libraries (like Recharts or Lodash) into separate bundles?</b></summary>

**Answer:**

Utilize Webpack's `splitChunks` optimization block inside `webpack.config.js`:
```javascript
optimization: {
  splitChunks: {
    chunks: 'all'
  }
}
```

Pair this on the frontend using React dynamic imports: `const Charts = React.lazy(() => import('./Charts'))`.

</details>

<details>
<summary><b>Q12: What is "Tree Shaking," and what Webpack setting enables it?</b></summary>

**Answer:**

*   **Tree Shaking:** The static analysis process of dead-code elimination. It strips out unused exported functions from your final bundle.
*   **Enabling:** Webpack enables tree shaking automatically in `mode: 'production'`, provided your source files are compiled using ES Modules (`import` and `export` statements) instead of CommonJS.

</details>

---

## 🗂️ DECK 3: Modern EcmaScript Specifications (ES6 to ESNext)

<details>
<summary><b>Q13: What is the Temporal Dead Zone (TDZ) in ES6, and which keywords trigger it?</b></summary>

**Answer:**

*   TDZ is the phase in a block scope between code entry and the line where a variable is declared.
*   Variables declared with `let` and `const` trigger the TDZ. If they are accessed during this phase, the engine throws a fatal `ReferenceError`.

</details>

<details>
<summary><b>Q14: Why is '0 ?? 10' different from '0 || 10'? When should you choose nullish coalescing?</b></summary>

**Answer:**

*   The logical OR (`||`) checks for any **falsy** value (which includes `0`, empty strings, and `false`). Thus, `0 || 10` evaluates to 10.
*   The nullish coalescing (`??`) checks strictly for **nullish** values (`null` and `undefined`). Thus, `0 ?? 10` evaluates to 0.
*   Choose `??` when processing integers or options where `0` or `false` are valid operating values.

</details>

<details>
<summary><b>Q15: How does ES14 'Change Array by Copy' maintain state immutability in React?</b></summary>

**Answer:**

Legacy methods (`sort()`, `reverse()`, `splice()`) mutate arrays in-place. ES14 introduces non-mutating equivalents that perform the operation and return a **brand new array** block in memory:

*   `arr.toSorted()` (Replaces `[...arr].sort()`)
*   `arr.toReversed()` (Replaces `[...arr].reverse()`)
*   `arr.toSpliced()` (Replaces `[...arr].splice()`)
*   `arr.with(index, value)` (Replaces manual indexing mutations)

</details>

<details>
<summary><b>Q16: How does ES15 Object.groupBy() simplify dashboard data aggregation?</b></summary>

**Answer:**

It natively buckets arrays into categorized objects using an evaluation callback, completely replacing the need to write complex `reduce` loops or import third-party libraries like Lodash:
```javascript
const groupedByStatus = Object.groupBy(campaigns, c => c.status);
```

</details>

<details>
<summary><b>Q17: Why can you use 'await' at the top level of a file in modern ESM modules?</b></summary>

**Answer:**

ES13 (ES2022) standardizes **Top-Level Await** inside ES Modules. This allows modules to act as async dependencies, waiting for databases or network configurations to resolve directly during execution, without wrapping the entry point in immediate-invoked async wrappers (IIFEs).

</details>

<details>
<summary><b>Q18: What is the risk of using an arrow function as an object method?</b></summary>

**Answer:**

Arrow functions do not bind their own execution context (`this`). Instead, they inherit `this` from their enclosing lexical block. If declared as an object method, `this` will reference the outer block (e.g., the global `window` object) rather than the object instance, causing property accesses inside the method to crash.

</details>

---

## 🗂️ DECK 4: Golang Backend Engineering (HTTP, Mutexes, Concurrency)

<details>
<summary><b>Q19: What is the structural difference between an Array and a Slice in Go?</b></summary>

**Answer:**

*   **Array:** Fixed length, part of the type signature. Allocated sequentially in memory, and passed to functions strictly **by value** (copying the entire array).
*   **Slice:** Dynamic size. A 24-byte header consisting of an underlying array **Pointer**, **Length**, and **Capacity**. Copied by value, but references the identical underlying array address.

</details>

<details>
<summary><b>Q20: Why should you pre-allocate slice capacities using 'make([]T, 0, capacity)'?</b></summary>

**Answer:**

If a slice's capacity is exceeded during an `append()`, Go's runtime executes allocation thrashing: it allocates a new, doubled-size array, physically copies all elements, and updates the pointer. Pre-allocating allocates memory once, eliminating latency and garbage collection overhead.

</details>

<details>
<summary><b>Q21: How do implicit interfaces (duck typing) work in Go, and why is this useful?</b></summary>

**Answer:**

*   **How:** If a struct defines methods matching all signatures outlined by an interface, Go implicitly implements that interface for the struct (no `implements` keywords required).
*   **Why:** Decouples codebase packages. You can mock dependencies, create pluggable API services, and test structures cleanly without maintaining strict dependency coupling.

</details>

<details>
<summary><b>Q22: Why does Go use explicit error returns instead of try-catch blocks?</b></summary>

**Answer:**

In Go, **errors are values**. Forcing developers to handle errors on every assignment ensures that failures are treated as expected, structured control flows rather than exceptional runtime interruptions. This prevents unhandled exceptions from silently crashing servers.

</details>

<details>
<summary><b>Q23: How do you prevent and detect concurrent map write panics in Go?</b></summary>

**Answer:**

*   **Prevention:** Protect write operations on shared maps using a mutual exclusion lock (`sync.Mutex` or `sync.RWMutex`) to serialize memory writes.
*   **Detection:** Compile or run your tests using Go's built-in race detector flag: `go run -race main.go`.

</details>

<details>
<summary><b>Q24: What is the difference between Buffered and Unbuffered channels?</b></summary>

**Answer:**

*   **Unbuffered Channel:** Synchronous. Sending values (`ch <- val`) blocks execution immediately until another goroutine reads from the channel (and vice-versa).
*   **Buffered Channel:** Asynchronous. Sends are non-blocking until the internal queue buffer is completely filled.

</details>

---

## 🗂️ DECK 5: Cryptography, Auth & Security (JWT, Storage, RTR)

<details>
<summary><b>Q25: What is the main scalability trade-off of stateless JWT auth vs. session cookies?</b></summary>

**Answer:**

*   **Stateless JWT:** Gateways verify signatures completely in-memory using public/secret keys. No database queries are needed, allowing microservices to scale. However, instant token revocation is difficult.
*   **Session Cookies:** Stateful. Easily revoked by deleting sessions from Redis. However, every incoming HTTP request requires a database check, creating scaling bottlenecks.

</details>

<details>
<summary><b>Q26: What is the architectural difference between HS256 and RS256 signing algorithms?</b></summary>

**Answer:**

*   **HS256 (Symmetric):** Uses a single shared secret key to both sign and verify. If a downstream service is breached, the attacker gains the key and can sign fraudulent tokens.
*   **RS256 (Asymmetric):** Uses a Private-Public key pair. The private key signs (kept secure on auth server), and public keys verify (distributed freely). Downstream servers can verify tokens safely with no compromise risks.

</details>

<details>
<summary><b>Q27: What is XSS, and why does it make storing JWTs in LocalStorage insecure?</b></summary>

**Answer:**

*   **XSS (Cross-Site Scripting):** Malicious JavaScript executed inside a user's browser (e.g., via a compromised npm library).
*   **Vulnerability:** Any script running in the browser has direct access to `localStorage.getItem()`, allowing attackers to exfiltrate active tokens.

</details>

<details>
<summary><b>Q28: How does storing Access Tokens in-memory and Refresh Tokens in HttpOnly cookies protect against XSS and CSRF?</b></summary>

**Answer:**

*   **XSS Protection:** Access Tokens are stored in short-lived JS variables, invisible to external scripts.
*   **CSRF Protection:** Refresh Tokens are stored in HttpOnly cookies, which are completely inaccessible to JavaScript. Configuring `SameSite=Lax` prevents browsers from attaching cookies to cross-origin requests, blocking CSRF attacks.

</details>

<details>
<summary><b>Q29: How does Refresh Token Rotation (RTR) mitigate stolen session cookies?</b></summary>

**Answer:**

Every time a refresh token is exchanged, the server invalidates it and issues a **new** refresh token. If an old token is reused (indicating an attacker stole it), the server detects the double-use anomaly, invalidates the entire token family tree, and forces an immediate re-authorization on all devices.

</details>

<details>
<summary><b>Q30: Why is hmac.Equal critical when comparing signature byte structures in Go?</b></summary>

**Answer:**

Standard comparisons stop executing on the first byte mismatch. This leaks timing information, allowing attackers to measure processing speeds and brute-force signatures byte-by-byte (a **Timing Attack**). `hmac.Equal` executes a constant-time check, taking identical processing cycles regardless of where a mismatch occurs.

</details>

---

## 🗂️ DECK 6: Database Schema Design & SQL Optimization

<details>
<summary><b>Q31: What is Third Normal Form (3NF), and how does it prevent database anomalies?</b></summary>

**Answer:**

*   **Rule:** Must satisfy 2NF, and no non-key column should transitively depend on the primary key through another non-key column.
*   **Benefit:** Maps all data attributes to a single source of truth. If a record changes, it is written to only one cell, preventing update inconsistencies.

</details>

<details>
<summary><b>Q32: When is it appropriate to intentionally denormalize a database schema?</b></summary>

**Answer:**

For high-performance reporting dashboards. While normalized schemas keep tables clean, executing aggregates across millions of rows requires expensive joins (`JOIN`). Denormalizing (e.g., writing `campaign_id` directly inside `hourly_analytics`) bypasses joins, allowing the query engine to scan single tables directly.

</details>

<details>
<summary><b>Q33: What is the Leftmost Prefix Rule in multi-column composite database indexes?</b></summary>

**Answer:**

A composite index (such as `idx(colA, colB)`) sorts the B-Tree sequentially from left to right. This means searching by `(colA)` or `(colA, colB)` can use the index, but searching strictly by `(colB)` alone cannot walk the tree, forcing a costly Full Table Scan.

</details>

<details>
<summary><b>Q34: How does Range Partitioning optimize queries on massive analytical tables?</b></summary>

**Answer:**

*   **Mechanism:** Splitting a massive logical table into physically smaller tables on disk based on a range (such as daily timestamps).
*   **Benefit:** Enables **Query Pruning**. If a query filters for "June 1st", the query planner ignores all other daily sub-tables, reading only the target physical slice to minimize disk I/O.

</details>

<details>
<summary><b>Q35: What is the architectural difference between row-oriented (OLTP) and columnar (OLAP) database engines?</b></summary>

**Answer:**

*   **OLTP (Row-Oriented):** Stores full records sequentially on disk. Optimized for rapid single-row writes (adding campaigns, editing user profiles).
*   **OLAP (Columnar):** Stores all values of a single column together on disk. Optimized for scanning and aggregating single columns across millions of rows (calculating total spends) in milliseconds.

</details>

<details>
<summary><b>Q36: What does 'EXPLAIN ANALYZE' do, and what key scan terms indicate a need for optimization?</b></summary>

**Answer:**

It runs the SQL statement and outputs the query planner's execution path, showing costs, loop counts, and execution times.

*   `Seq Scan` (Sequence Scan): The engine is scanning the entire table sequentially from disk, indicating a missing index.
*   `Nested Loop`: Indicates nested join evaluations; check if child tables have foreign key indexing.

</details>

---

## 🗂️ DECK 7: Ad Tech Domain Knowledge & Dashboard Systems

<details>
<summary><b>Q37: What is the programmatic difference between a DSP and an SSP?</b></summary>

**Answer:**

*   **DSP (Demand-Side Platform):** Platform used by **advertisers** to search and buy ad placements across networks efficiently. Handles bidding, targeting, budget pacing, and campaign analytics.
*   **SSP (Supply-Side Platform):** Platform used by **publishers** (websites/apps) to list and sell their available ad inventory to ad exchanges, maximizing their yield.

</details>

<details>
<summary><b>Q38: How do a DSP and a DMP sync to target custom user audiences?</b></summary>

**Answer:**

1.  The DMP collects user browser behavior and groups them into **User Segments** (e.g., "Frequent Travelers").
2.  DMP and DSP run a **Cookie Sync** to match user cookies to shared anonymous user IDs.
3.  When the DSP processes bid opportunities, it queries the matched DMP ID to check if the user belongs to the target segment, bidding on the placement if they match.

</details>

<details>
<summary><b>Q39: How does a client-side tracking pixel track user conversions?</b></summary>

**Answer:**

1.  The advertiser loads a JS container tag on their store checkout success page.
2.  When a purchase occurs, the tag fires a GET request to load an invisible 1x1 GIF from your ad server.
3.  Conversion details (revenue, currency) are appended as query parameters.
4.  The ad server receives the request along with the user's cookie, matching the conversion to the original campaign impression.

</details>

<details>
<summary><b>Q40: Why are cookie-based pixels being replaced by Server-to-Server (S2S) tracking, and how does S2S work?</b></summary>

**Answer:**

*   **Why:** Browser privacy updates (Safari ITP, third-party cookie deprecation) block tracking tags in third-party cookie contexts.
*   **How:** When an ad is clicked, the ad platform appends a unique `click_id` to the landing page URL. The advertiser stores this ID in their session database. When a conversion occurs, their backend server fires a POST request directly to your Go API, matching conversions without cookies.

</details>

<details>
<summary><b>Q41: How do Product/Data Feeds automate Google Shopping dynamic ad creatives?</b></summary>

**Answer:**

Advertisers host a structured XML or JSON file listing their complete e-commerce inventory (including product names, prices, stocks, and images). Your dashboard schedules daily imports of this file. Dynamic ad builders parse the feed, generating individual ad creatives with up-to-date pricing and stock status automatically.

</details>

<details>
<summary><b>Q42: What are the mathematical formulas for CTR and eCPC? How do you prevent database crashes when calculating them?</b></summary>

**Answer:**

*   $$\text{CTR} = \frac{\text{Clicks}}{\text{Impressions}} \times 100$$
*   $$\text{eCPC} = \frac{\text{Spend}}{\text{Clicks}}$$
*   **Safety Check:** Prevent division-by-zero crashes using the SQL `NULLIF(column, 0)` function, which returns a safe `NULL` instead of crashing the database if impressions or clicks are zero.

</details>
