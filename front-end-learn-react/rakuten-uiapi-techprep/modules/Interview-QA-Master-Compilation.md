# 🏆 GATD UI/API Technical Interview: Master Q&A & Implementation Guide

This Master Compilation brings together **all core technical questions, STAR behavioral frameworks, and live coding challenges** for your Rakuten interview. It includes production-ready code implementations and step-by-step guides to run, test, and master these concepts offline.

---

## 📅 Compilation Index

```
┌──────────────────────────────────────────────┐
│ SECTION 1: Framework & Role Transitions      │ -> Vue to React, Backend to Hybrid UI/API
├──────────────────────────────────────────────┤
│ SECTION 2: System Architecture & Databases   │ -> Stripe Idempotency, EXPLAIN MySQL Tuning
├──────────────────────────────────────────────┤
│ SECTION 3: React Master Code Challenges      │ -> API Race Conditions, Selective rendering, RTK
├──────────────────────────────────────────────┤
│ SECTION 4: Go Concurrency Code Challenges     │ -> SQS concurrent worker pools, zero-leak selects
├──────────────────────────────────────────────┤
│ SECTION 5: Step-by-Step Local Verification   │ -> CLI execution and runtime verification
└──────────────────────────────────────────────┘
```

---

## 📂 SECTION 1: Framework & Role Transitions (STAR Qs)

### Q1.1: Transitioning from Vue 3 to React
> **Question:** *"I see you have extensive Vue.js background. Since this position centers on React and TypeScript, how do you plan to transition, and how do your existing skills translate?"*

#### STAR Structured Answer:
*   **Situation (S):** "At my previous roles, I built high-scale user dashboards using Vue.js. However, I know Rakuten’s Global Ad Technology Department (GATD) leverages React and TypeScript for their ad platform."
*   **Task (T):** "My goal was to bridge this framework gap rapidly, proving that frontend engineering fundamentals are framework-agnostic."
*   **Action (A):** "I built an explicit translation map:
    1.  **Reactivity Mapping:** I mapped Vue 3’s functional Composition API (`ref`, `computed`, `watchEffect`) to React Hooks (`useState`, `useMemo`, `useEffect`).
    2.  **Rendering Mindset:** I mastered React’s coarse-grained rendering model. I trained myself to understand that React component functions run top-to-bottom on every frame, which requires explicit caching (`useCallback`/`useMemo`) to prevent render loops.
    3.  **Hands-on Application:** I scaffolded a React + TS dashboard from scratch with Redux Toolkit and set up ESLint rules to enforce React best-practices."
*   **Result (R):** "By mastering the *why* behind React's engine, I was able to build a functional ad dashboard within two weeks. I am ready to write high-quality, type-safe React code from my very first sprint."

---

### Q1.2: Moving from Backend-Heavy to Hybrid UI/API
> **Question:** *"Your recent achievements are highly backend-focused (Go, SQS, AWS Lambda). How will you balance the UI demands of this hybrid SDE (UI/API) role?"*

#### STAR Structured Answer:
*   **Situation (S):** "Most of my recent work at Igloo and Djoin was scaling microservices. However, GATD requires engineers who can own features end-to-end—from the database schema to the React interface."
*   **Task (T):** "My objective was to position my backend strengths as an asset for the frontend, ensuring high-performance, frictionless integration."
*   **Action (A):** "I leveraged my API background to build 'API-First' UI systems:
    1.  **Frontend-Friendly Payloads:** I design microservice schemas to deliver exact, lightweight JSON payloads to the UI, minimizing client-side parsing.
    2.  **Robust Error Boundaries:** I understand HTTP status codes, SQS queue limits, and authorization flows deeply from the backend. This helps me build robust React error boundaries and interceptors that gracefully handle network latency or offline states."
*   **Result (R):** "This dual understanding cuts down on integration friction. At my last company, it shortened our feature integration cycles by 25% and reduced deployment integration bugs to 0%."

---

## 🔒 SECTION 2: System Architecture & Databases (STAR Qs)

### Q2.1: Stripe Idempotency (AWS SQS + PostgreSQL)
> **Question:** *"At Igloo, you handled Stripe payments via AWS SQS. Webhooks can fail or retry. How did you design this system to guarantee absolute idempotency?"*

#### STAR Structured Answer:
*   **Situation (S):** "If we processed a payment webhook twice, we double-charged customers. If we failed to process it due to timeout, users were locked out of their smart locks."
*   **Task (T):** "I had to design a payment handler that is 100% reliable and guarantees that no webhook is ever processed twice."
*   **Action (A):** "I implemented a multi-layered security flow:
    1.  **Ingestion Buffer:** API Gateway received the Stripe webhook, immediately dropped it into an AWS SQS FIFO queue, and returned a fast `200 OK` (under 50ms) to Stripe.
    2.  **First Deduplication Layer:** SQS FIFO utilized Message Deduplication IDs to block duplicates inside a 5-minute window.
    3.  **Database Constraint Layer:** To handle retries that occur hours or days later, I created an `idempotency_keys` table in PostgreSQL. The `stripe_event_id` column had a `UNIQUE` constraint. When the worker picked up a job, it attempted to insert the ID. If the database rejected the write with a constraint violation, the worker knew it was a duplicate and safely skipped execution, returning the previously cached success response."
*   **Result (R):** "This dual-layer system successfully handled over 4,000 transactions with zero double-billing errors and maintained 100% reliability."

---

### Q2.2: MySQL Database Optimization (Djoin.id Report Tuning)
> **Question:** *"You optimized slow loan account queries at Djoin.id by 20%. Walk me through how you isolated the bottlenecks."*

#### STAR Structured Answer:
*   **Situation (S):** "During peak hours at Djoin, generating loan reports ran huge queries that locked database tables, causing timeouts across the entire microservice stack."
*   **Task (T):** "I needed to identify the slow queries, optimize database access, and move report generation out of the main thread."
*   **Action (A):** "I approached the problem in three steps:
    1.  **Query Profiling:** I ran `EXPLAIN ANALYZE` on our slow MySQL queries. This revealed that the query was performing massive **Full Table Scans** because of missing indexes and executing nested queries (the $N+1$ problem).
    2.  **Indexing & Joins:** I added a compound index on the search criteria: `(loan_id, status, created_at)` and rewrote the SQL queries to perform indexed `INNER JOINs` instead of nested subqueries. This slashed query execution time by 20%.
    3.  **Asynchronous Processing:** To completely protect our API, I moved report generation to the background. I utilized Laravel Batch Jobs to chunk processing. The backend compiled reports asynchronously, uploaded them to AWS S3, and emailed the download link to the user."
*   **Result (R):** "This optimization reduced database CPU utilization from 90% to 40% during peak hours, and reduced customer timeout complaints by 85%."

---

## ⚛️ SECTION 3: React Master Code Challenges

### Challenge 3.1: The API Race Condition Solution
*   **The Problem:** Out-of-order network responses overwrite fresh state.
*   **The Solution:** Use an `active` boolean flag inside the `useEffect` cleanup closure, or use an `AbortController` to cancel pending HTTP queries.

#### Implementation (AbortController & Active-Flag Hybrid):
```typescript
import { useState, useEffect } from 'react';

export function SearchCampaigns() {
  const [searchTerm, setSearchTerm] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!searchTerm) {
      setCampaigns([]);
      return;
    }

    // 1. Create a local flag inside the render's closure
    let isCurrentRenderActive = true;
    const controller = new AbortController();

    setLoading(true);

    fetch(`http://localhost:8080/api/campaigns?search=${searchTerm}`, {
      signal: controller.signal
    })
      .then(res => res.json())
      .then(data => {
        // 2. Only update state if this render's closure is still active!
        if (isCurrentRenderActive) {
          setCampaigns(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          console.log('Query aborted safely for term:', searchTerm);
        } else if (isCurrentRenderActive) {
          setLoading(false);
        }
      });

    // 3. Cleanup function: Triggered when dependency changes, before re-running!
    return () => {
      isCurrentRenderActive = false; // Mark previous render closure as dead
      controller.abort(); // Cancel the actual network socket
    };
  }, [searchTerm]);

  return (
    <div>
      <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      {loading && <p>Loading...</p>}
      <ul>{campaigns.map(c => <li key={c.id}>{c.name}</li>)}</ul>
    </div>
  );
}
```

---

### Challenge 3.2: Selective Rendering of Ad Trees
*   **The Problem:** Updating one child in a massive list triggers a cascade of re-renders for all siblings.
*   **The Solution:** Wrap child items in `React.memo` and pass callbacks wrapped in `useCallback`.

#### Implementation:
```tsx
import React, { useState, useCallback } from 'react';

interface Creative {
  id: string;
  name: string;
  status: 'active' | 'paused';
}

// 1. CHILD: Wrapped in React.memo to skip render if props are identical
const AdCreativeItem = React.memo(({ creative, onToggle }: { creative: Creative; onToggle: (id: string) => void }) => {
  console.log(`[RENDERED] Creative ID: ${creative.id}`);
  return (
    <div style={{ padding: 12, border: '1px solid #ccc', margin: 8 }}>
      <span>{creative.name} - <b>{creative.status}</b></span>
      <button onClick={() => onToggle(creative.id)}>Toggle</button>
    </div>
  );
});

// 2. PARENT: Controls the list state
export function AdGroupDashboard() {
  const [creatives, setCreatives] = useState<Creative[]>([
    { id: '1', name: 'Tokyo Summer Banner', status: 'active' },
    { id: '2', name: 'Osaka Video Promo', status: 'paused' },
    { id: '3', name: 'Nagoya Newsletter text', status: 'active' },
  ]);

  // 3. useCallback guarantees stable function reference across render frames
  const handleToggle = useCallback((id: string) => {
    setCreatives((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c))
    );
  }, []); // Empty dependencies array ensures reference never changes

  return (
    <div>
      <h2>Ad Placement Dashboard</h2>
      {creatives.map((c) => (
        // Key is stable and unique. Props are memo-checked.
        <AdCreativeItem key={c.id} creative={c} onToggle={handleToggle} />
      ))}
    </div>
  );
}
```

---

### Challenge 3.3: Memoized Selector (Redux Toolkit)
*   **The Problem:** Selecting nested lists and running aggregate calculations inside a component triggers expensive recalculations on every render.
*   **The Solution:** Use RTK’s `createSelector` to perform dependency-based memoization.

#### Implementation:
```typescript
import { createSelector } from '@reduxjs/toolkit';

interface RootState {
  campaigns: {
    list: Array<{ id: string; name: string; status: 'active' | 'paused'; impressions: number }>;
    loading: boolean;
  };
}

// 1. Input selectors (cheap lookup)
const selectCampaignsList = (state: RootState) => state.campaigns.list;

// 2. Memoized Selector: Only recalculates if selectCampaignsList's reference changes
export const selectActiveCampaignsImpressions = createSelector(
  [selectCampaignsList],
  (campaigns) => {
    console.log('[CALCULATING] Processing impressions...');
    return campaigns
      .filter(c => c.status === 'active')
      .reduce((sum, c) => sum + c.impressions, 0);
  }
);
```

---

## 🐹 SECTION 4: Go Concurrency Code Challenges

### Challenge 4.1: Concurrent SQS Slicing (Worker Pool with Deadline Timeout)
*   **The Requirements:** 
    *   Process SQS batch items concurrently using Goroutines.
    *   Enforce a hard SLA Timeout of **3 Seconds** using contexts.
    *   **Crucial:** Prevent goroutine leaks by using buffered channels, ensuring that even if a timeout occurs, background goroutines don't block forever trying to write to a abandoned channel.

#### Implementation:
```go
package main

import (
	"context"
	"fmt"
	"sync"
	"time"
)

type Result struct {
	ID    string
	Error error
	Value string
}

// ProcessBatchConcurrently handles batch tasks with worker bounds and SQS deadlines
func ProcessBatchConcurrently(ctx context.Context, ids []string) []Result {
	// 1. Buffered channel size matched to input size to prevent goroutine leak on early timeout
	resultsChan := make(chan Result, len(ids))
	var wg sync.WaitGroup

	// Set a 3-second deadline context
	timeoutCtx, cancel := context.WithTimeout(ctx, 3*time.Second)
	defer cancel()

	for _, id := range ids {
		wg.Add(1)
		go func(taskID string) {
			defer wg.Done()

			// Create a task-specific processing channel
			taskDone := make(chan Result, 1)

			go func() {
				// Simulate API I/O processing
				time.Sleep(2 * time.Second) 
				taskDone <- Result{ID: taskID, Value: fmt.Sprintf("Processed-%s", taskID)}
			}()

			select {
			case res := <-taskDone:
				resultsChan <- res
			case <-timeoutCtx.Done():
				// Return a timeout error if context is completed before taskDone sends
				resultsChan <- Result{ID: taskID, Error: timeoutCtx.Err()}
			}
		}(id)
	}

	// 2. Separate monitor goroutine closes resultsChan after all workers finish
	go func() {
		wg.Wait()
		close(resultsChan)
	}()

	var finalResults []Result
	for r := range resultsChan {
		finalResults = append(finalResults, r)
	}

	return finalResults
}

func main() {
	ids := []string{"id-1", "id-2", "id-3", "id-4"}
	fmt.Println("Processing batch concurrently...")
	results := ProcessBatchConcurrently(context.Background(), ids)

	for _, r := range results {
		if r.Error != nil {
			fmt.Printf("Task %s FAILED: %v\n", r.ID, r.Error)
		} else {
			fmt.Printf("Task %s SUCCESS: %v\n", r.ID, r.Value)
		}
	}
}
```

---

## 🛠️ SECTION 5: Step-by-Step Local Verification Guide

You can run and verify both the React optimizations and the Go concurrency patterns locally on your terminal.

### 1. Running the Go Concurrency Challenge
Navigate to your project root and execute the Go binary directly:
```bash
go run modules/Hour-4_Go-Runtime-and-API-Bridges.md
```
*   **Verification Exercise:** Open `ProcessBatchConcurrently` inside the file and change `time.Sleep(2 * time.Second)` to `time.Sleep(4 * time.Second)`. Run it again. Watch how the program gracefully handles the 3-second SLA timeout and prints `Context Deadline Exceeded` errors without locking up!

### 2. Sandbox Verification of the Capstone Project
To verify the full integrated setup (React frontend querying Go backend concurrently):
1.  **Start Go Server:**
    ```bash
    go run modules/capstone/backend/main.go
    ```
2.  **Verify Endpoint:** Curl the server concurrently to watch it compile mock database metrics:
    ```bash
    curl http://localhost:8080/api/campaigns
    ```
