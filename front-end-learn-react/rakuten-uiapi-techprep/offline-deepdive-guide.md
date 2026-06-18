# 🚀 Rakuten GATD UI/API Technical Interview Prep: 4-Hour Crash Course
This offline-ready guide is custom-tailored for **Gede Ocha Dipa Ananda**'s upcoming Software Development Engineer (UI/API) interview with the Global Ad Technology Supervisory Department (GATD) at Rakuten.

---

## 📅 Crash Course Roadmap (4 Hours + Capstone)

```
┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐     ┌────────────────────────┐
│ HOUR 1: React Engine   │ ──> │ HOUR 2: Optimization   │ ──> │ HOUR 3: Redux Flows    │ ──> │ HOUR 4: Go Core & APIs │
│ Hooks, Closures, Fibers│     │ Reconciliation, Caching│     │ CQRS, RTK, Mutability  │     │ Concurrency, GMP, SQS  │
└────────────────────────┘     └────────────────────────┘     └────────────────────────┘     └────────────────────────┘
                                                                                                         │
                                                                                                         ▼
                                                                                      ┌─────────────────────────────────────┐
                                                                                      │ CAPSTONE PROJECT: GATD Ad Dashboard │
                                                                                      └─────────────────────────────────────┘
```

---

## 🧠 HOUR 1: React Fundamentals & The Render Loop
*Targeting JD Qualification: "Practical React experience" (Mandatory)*

### 1. The Rendering Model (React vs. Vue 3)
*   **Vue 3 (Fine-grained, reactive):** Vue tracks dependencies automatically via ES6 Proxies. The `<script setup>` block runs **once** when the component is created. Changing `state.value` triggers highly targeted re-renders of only the specific DOM nodes bound to that state.
*   **React (Coarse-grained, functional):** A React component is a plain JavaScript function. **It runs completely from top to bottom on every single render.** Every variable, function, and calculation inside the component body is re-created from scratch on every tick unless explicitly cached.

### 2. State Under the Hood: The Fiber Node Linked List
Since React components are just stateless functions running repeatedly, where does the state live? It lives in the **Fiber Tree** on the JavaScript heap.
*   For every mounted component, React maintains a `FiberNode` object.
*   The `FiberNode` has a property called `memoizedState`, which points to a **singly linked list** of hooks:
    ```
    FiberNode
      └── memoizedState ──> [ useState (Slot 1) ] ──> [ useEffect (Slot 2) ] ──> [ useState (Slot 3) ]
    ```
*   **The Golden Hook Rule:** Hooks must always be called at the top-level, in the **exact same order** on every render. If you place a hook inside an `if` block, the index of the subsequent hooks shifts, causing React to fetch state from the wrong linked list node, corrupting your app.

### 3. Stale Closures & The Render Scope
A "closure" is a function that remembers its outer variables. Since React functions re-run every render, nested functions (event handlers, timeouts) capture the state variables *of that specific render cycle*.

```jsx
// ❌ STALE CLOSURE PITFALL
function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // 'count' here is locked to 0 (its value during the mount render)
      setCount(count + 1); 
    }, 1000);
    return () => clearInterval(timer);
  }, []); // Empty dependency array means this closure is never refreshed

  return <div>{count}</div>; // Will count up to 1 and get stuck!
}
```

#### How to fix:
1.  **Functional Updates (State Setter Callback):**
    ```javascript
    setCount(prevCount => prevCount + 1); // Reads current value directly from the Fiber Node, bypassing closure scope
    ```
2.  **Effect Dependencies:**
    ```javascript
    useEffect(() => {
      const timer = setInterval(() => setCount(count + 1), 1000);
      return () => clearInterval(timer);
    }, [count]); // Re-runs the effect, creating a fresh interval closure whenever count changes
    ```

---

### 📝 HOUR 1: Mini-Quiz

#### Q1.1: If `useState` returns a setter function `setCount`, does calling `setCount(5)` immediately update the local variable `count` on the very next line?
<details>
<summary><b>Click for Answer & Mental Model</b></summary>
<b>No.</b> `setCount` schedules an asynchronous render. The local variable `count` is a constant bound to the <i>current</i> render frame. It will only hold the new value when the component function executes again on the next render.
</details>

#### Q1.2: Why is calling a React Hook conditionally (inside an `if` block) a critical bug, whereas Vue's Composition API allows conditional hook patterns under certain conditions?
<details>
<summary><b>Click for Answer & Mental Model</b></summary>
React maps hooks to the component's Fiber state by their strict call order (as a linked list). Changing the order breaks the indexing. Vue 3 tracks reactivity using reactive data proxies directly on the object scope rather than relying on sequential array index registers.
</details>

---

## ⚡ HOUR 2: Reconciliation & Performance Optimization
*Targeting JD Qualification: "Profiling and improving front-end performance" (Mandatory)*

### 1. Reconciliation (Virtual DOM Diffing)
Reconciling two deep object trees is naturally an $O(N^3)$ algorithm. React uses two heuristic assumptions to reduce this complexity to **$O(N)$**:
1.  **Different Element Types:** Two elements of different HTML types (e.g., swapping a `<div>` with a `<span>`) will produce completely different trees. React will tear down the entire old tree and build the new one from scratch.
2.  **Stable Keys:** When rendering lists of items, React uses the `key` prop to map virtual nodes to real DOM nodes across updates.

#### The Array Index Key Trap
If you render a list using the array index as the key:
```jsx
// ❌ BAD PRACTICE
{campaigns.map((camp, index) => <CampaignCard key={index} data={camp} />)}
```
If you delete the *first* item in the array:
*   The item at index `0` is removed.
*   What was at index `1` now becomes index `0`.
*   React sees key `0` still exists, and merely updates its props, triggering unnecessary DOM updates for every single card below it.
*   **The Fix:** Always use a stable, unique identifier (e.g., `key={camp.id}`).

### 2. Memoization: `useMemo` vs `useCallback`
*   **`useMemo`:** Caches a *computed value* to avoid expensive recalculations on every render.
    ```javascript
    const optimizedStats = useMemo(() => heavyMathCalculation(campaigns), [campaigns]);
    ```
*   **`useCallback`:** Caches the *function reference* itself.
    ```javascript
    const handleToggle = useCallback((id) => {
      dispatch(toggleCampaign(id));
    }, [dispatch]); // Keeps the exact same function reference across renders
    ```

#### When to actually use them:
*   **Premature Optimization Trap:** Don't wrap every single inline function in `useCallback`. Caching has its own overhead (allocating memory, running dependency checks).
*   **When they matter:**
    1.  Passing callbacks to deeply-nested children wrapped in `React.memo` (so the children skip rendering because the function reference didn't change).
    2.  The callback is a dependency of another hook (like a `useEffect` dependency array).

---

### 📝 HOUR 2: Mini-Quiz

#### Q2.1: Suppose a parent component renders a child component: `<Child onClick={handleClick} />`. Under what condition does wrapping `handleClick` in `useCallback` actually improve application performance?
<details>
<summary><b>Click for Answer & Mental Model</b></summary>
Only if the <code>Child</code> component is wrapped in <code>React.memo()</code>. If <code>Child</code> is not memoized, it will re-render anyway whenever the parent re-renders, making the <code>useCallback</code> call overhead redundant and wasteful.
</details>

#### Q2.2: How does the virtual DOM reconciliation process differ between an element type change (e.g., `<div>` to `<section>`) vs an attribute change (e.g., class modifier change on a `<div>`)?
<details>
<summary><b>Click for Answer & Mental Model</b></summary>
An element type change causes React to completely unmount and destroy the old DOM node and all its children (triggering unmount cleanup hooks). An attribute change updates only the specific real DOM node attributes inline without destroying the underlying DOM node.
</details>

---

## 📦 HOUR 3: Global State & Redux Toolkit (RTK)
*Targeting JD Qualification: "React workflows (Hooks, Flux, Redux)" (Desired)*

### 1. The Redux Architecture Pattern
Redux implements **unidirectional data flow** with three simple tenets:
1.  **Single Source of Truth:** Your global state is stored in a single object tree within a central **Store**.
2.  **State is Read-Only:** The only way to modify state is to dispatch an **Action** (a JS object describing *what* happened).
3.  **Changes are Made with Pure Functions:** **Reducers** take the current state and the Action, and return the exact *next* state. They must never contain side-effects or mutate variables directly.

### 2. Shallow Equality & Mutability Bugs
React and Redux optimize re-rendering using **shallow reference comparisons**:
```javascript
// Shallow check: is prevStoreState === nextStoreState?
```
If you mutate an array directly:
```javascript
// ❌ CRITICAL REDUX BUG
state.campaigns.push(action.payload); // Mutates original array reference
return state; // Redux sees state === state, and SKIPS re-rendering!
```
To fix this, you must write immutable updates, creating copies of references:
```javascript
return {
  ...state,
  campaigns: [...state.campaigns, action.payload] // Fresh array reference
};
```

### 3. Redux Toolkit (RTK) and Immer
Modern Redux uses **Redux Toolkit**. RTK uses a library called **Immer** under the hood. Immer uses ES6 Proxies to intercept updates, allowing you to write "mutative" syntax that gets automatically translated into clean, immutable updates.

```typescript
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused';
}

// 1. Define Asynchronous Actions (Thunks)
export const fetchCampaigns = createAsyncThunk('campaigns/fetchAll', async () => {
  const response = await fetch('/api/campaigns');
  return (await response.json()) as Campaign[];
});

// 2. Define Slice (Reducers + Actions)
const campaignSlice = createSlice({
  name: 'campaigns',
  initialState: { list: [] as Campaign[], loading: false },
  reducers: {
    // Immer makes this safe!
    toggleStatus(state, action: PayloadAction<string>) {
      const camp = state.list.find(c => c.id === action.payload);
      if (camp) {
        camp.status = camp.status === 'active' ? 'paused' : 'active';
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => { state.loading = true; })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      });
  }
});

export const { toggleStatus } = campaignSlice.actions;
export default campaignSlice.reducer;
```

---

### 📝 HOUR 3: Mini-Quiz

#### Q3.1: What is the purpose of `createAsyncThunk` in Redux Toolkit, and why does Redux require a middleware layer like Thunk to handle network requests?
<details>
<summary><b>Click for Answer & Mental Model</b></summary>
Redux reducers must be synchronous pure functions (determinism). Async side-effects (like network requests) violate this. <code>createAsyncThunk</code> handles async logic outside the reducer and automatically dispatches lifecycle actions (<code>pending</code>, <code>fulfilled</code>, <code>rejected</code>) which the synchronous reducers listen to.
</details>

#### Q3.2: If RTK utilizes Immer under the hood, can we safely mutate variables directly inside regular JavaScript helpers outside of `createSlice`?
<details>
<summary><b>Click for Answer & Mental Model</b></summary>
<b>No.</b> Immer wraps your updates in ES6 Proxies <i>only</i> inside the reducer functions generated by <code>createSlice</code>. Mutating data anywhere else will bypass Immer, causing classic React re-rendering silences.
</details>

---

## 🐹 HOUR 4: Go Core Architecture & API Bridges
*Targeting JD Qualification: "Familiarity with Golang" (Desired) + "Experience developing Web APIs" (Mandatory)*

### 1. High-Performance Concurrency: GMP Model
Go stands out because of its custom runtime scheduler.
*   **G (Goroutine):** Lightweight threads of execution. They begin with a tiny **2KB stack** (OS threads take ~1-2MB). They grow and shrink dynamically on the heap.
*   **M (Machine):** OS thread managed by the kernel.
*   **P (Processor):** Logical context/resource required to execute Go code (typically maps to CPU cores).

```
  Go Scheduler
  ┌─────────┐
  │    P    │ (Logical Processor)
  └────┬────┘
       │
  ┌────▼────┐
  │    M    │ (OS Thread)
  └────┬────┘
       │
  ┌────▼────┐      Run Queue
  │  G1     ├────> [ G2 ] ──> [ G3 ] (Goroutines queueing)
  └─────────┘
```

#### Goroutines vs JS Event Loop
*   JavaScript utilizes a **Single-Threaded Event Loop**. Long CPU computations block the stack, pausing rendering.
*   Go utilizes a **Work-Stealing Scheduler**. If OS thread `M1` is blocked by a system call, processor `P` unbinds from `M1` and spawns/associates with another thread `M2` to keep running other Goroutines.

### 2. Channels and Safe Memory Sharing
The Go philosophy: *"Do not communicate by sharing memory; instead, share memory by communicating."*

```go
package main

import (
	"context"
	"fmt"
	"time"
)

// ProcessCampaigns processes items concurrently using channels and a context for cancellation
func ProcessCampaigns(ctx context.Context, ids []int) <-chan string {
	out := make(chan string)

	go func() {
		defer close(out)
		for _, id := range ids {
			select {
			case <-ctx.Done():
				return // Gracefully cancel execution if context times out
			case <-time.After(100 * time.Millisecond): // Simulate heavy API load
				out <- fmt.Sprintf("Campaign-%d processed", id)
			}
		}
	}()

	return out
}
```

### 3. Idiomatic Error Wrapping (Go 1.13+)
Never discard errors with `_`. Always wrap errors with contextual detail to help trace bugs across high-throughput GATD microservices:
```go
if err != nil {
    return fmt.Errorf("GATD database insertion failed for campaign %s: %w", campaignID, err)
}
```

---

### 📝 HOUR 4: Mini-Quiz

#### Q4.1: What is the key difference between a buffered channel and an unbuffered channel in Go in terms of block scheduling?
<details>
<summary><b>Click for Answer & Mental Model</b></summary>
An unbuffered channel blocks the sender goroutine immediately until a receiver goroutine reads the value (handshake sync). A buffered channel allows the sender to write values without blocking up to the capacity size of the buffer.
</details>

#### Q4.2: Why is the Go garbage collector optimized for low latency rather than maximum throughput, and how does that fit a UI/API microservices context?
<details>
<summary><b>Click for Answer & Mental Model</b></summary>
Go's concurrent, tri-color mark-and-sweep garbage collector runs concurrently with goroutines to prioritize <b>sub-millisecond pause times (STW - Stop The World)</b>. This guarantees reliable, low-latency API response times for our front-end React apps.
</details>

---

## 🏆 CAPSTONE: The GATD Micro-Ad Dashboard Project

To solidify these learnings, you will implement a **GATD Micro-Ad Dashboard** from scratch. This project connects a high-throughput Go API with a responsive React/Redux UI, simulating a real GATD production service.

### 🛠️ Architecture Specification

```
┌─────────────────────────────────┐               ┌───────────────────────────────────┐
│     REACT FRONTEND (PORT 3000)  │               │       GO BACKEND (PORT 8080)      │
│                                 │               │                                   │
│  ┌───────────────────────────┐  │  HTTP GET     │  ┌─────────────────────────────┐  │
│  │    Search Debounce Hook   │  ├──────────────>│  │  /api/campaigns Endpoint    │  │
│  └─────────────┬─────────────┘  │               │  └──────────────┬──────────────┘  │
│                │ debounced value│               │                 │                 │
│  ┌─────────────▼─────────────┐  │               │  ┌──────────────▼──────────────┐  │
│  │   Redux Toolkit Store     │  │               │  │  Concurrent Data Generator  │  │
│  │   (Actions, Thunks, Slices)  │               │  │  (Goroutines, Channels)     │  │
│  └─────────────┬─────────────┘  │               │  └─────────────────────────────┘  │
│                │ updates state  │               │                                   │
│  ┌─────────────▼─────────────┐  │               │                                   │
│  │ React Hooks Component Tree│  │               │                                   │
│  └───────────────────────────┘  │               │                                   │
└─────────────────────────────────┘               └───────────────────────────────────┘
```

---

### Part 1: High-Performance Go Backend (`main.go`)
Your Go API will serve Campaign Data. It will fetch campaign metadata concurrently using goroutines and compile the payload.

```go
package main

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type Campaign struct {
	ID        string `json:"id"`
	Name      string `json:"name"`
	Impressions int    `json:"impressions"`
	Status    string `json:"status"`
}

// Simulated high-latency database queries
func fetchCampaignDetails(ctx context.Context, id string, wg *sync.WaitGroup, ch chan<- Campaign) {
	defer wg.Done()

	// Handle timeout context
	select {
	case <-time.After(150 * time.Millisecond): // Simulate slow query
		ch <- Campaign{
			ID:          id,
			Name:        fmt.Sprintf("Ad Campaign - %s", id),
			Impressions: int(time.Now().UnixNano() % 100000),
			Status:      "active",
		}
	case <-ctx.Done():
		return
	}
}

func campaignHandler(w http.ResponseWriter, r *http.Request) {
	// CORS Headers for React
	w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	if r.Method == http.MethodOptions {
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 500*time.Millisecond)
	defer cancel()

	campaignIDs := []string{"101", "102", "103", "104"}
	campaignsChan := make(chan Campaign, len(campaignIDs))
	var wg sync.WaitGroup

	for _, id := range campaignIDs {
		wg.Add(1)
		go fetchCampaignDetails(ctx, id, &wg, campaignsChan)
	}

	// Wait for goroutines in background, then close channel
	wg.Wait()
	close(campaignsChan)

	var list []Campaign
	for c := range campaignsChan {
		list = append(list, c)
	}

	json.NewEncoder(w).Encode(list)
}

func main() {
	http.HandleFunc("/api/campaigns", campaignHandler)
	fmt.Println("GATD mock backend running concurrently on :8080...")
	http.ListenAndServe(":8080", nil)
}
```

---

### Part 2: React & Redux Toolkit Frontend (`App.tsx`)

#### 1. Custom Debounce Hook (`useDebounce.ts`)
Avoids spamming GATD servers on every single user keystroke.
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler); // Cleanup on component unmount or value change
    };
  }, [value, delay]);

  return debouncedValue;
}
```

#### 2. The Global State & UI Tree (`index.tsx`)
This single component renders the list, registers user search, invokes the debounce hook, and handles state toggles through standard Redux architecture.

```tsx
import React, { useEffect, useState } from 'react';
import { configureStore, createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { useDebounce } from './useDebounce';

interface Campaign {
  id: string;
  name: string;
  impressions: number;
  status: 'active' | 'paused';
}

// RTK Async Thunk to fetch from our Go Backend
export const fetchCampaigns = createAsyncThunk('campaigns/fetch', async () => {
  const res = await fetch('http://localhost:8080/api/campaigns');
  return (await res.json()) as Campaign[];
});

const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState: { list: [] as Campaign[], loading: false },
  reducers: {
    toggleStatus(state, action: PayloadAction<string>) {
      const camp = state.list.find(c => c.id === action.payload);
      if (camp) {
        camp.status = camp.status === 'active' ? 'paused' : 'active';
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => { state.loading = true; })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      });
  }
});

const { toggleStatus } = campaignsSlice.actions;

const store = configureStore({
  reducer: { campaigns: campaignsSlice.reducer }
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

function Dashboard() {
  const dispatch = useDispatch<AppDispatch>();
  const { list: campaigns, loading } = useSelector((state: RootState) => state.campaigns);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom Hook invocation
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    dispatch(fetchCampaigns());
  }, [dispatch]);

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
  );

  return (
    <div style={{ padding: 24, fontFamily: 'sans-serif' }}>
      <h1>GATD Ad Delivery Dashboard</h1>
      <input
        type="text"
        placeholder="Search campaigns..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{ padding: 8, width: 300, marginBottom: 16 }}
      />
      {loading ? (
        <p>Loading concurrently from Go API...</p>
      ) : (
        <table border={1} cellPadding={8} style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Impressions</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map(c => (
              <tr key={c.id}>
                <td>{c.id}</td>
                <td>{c.name}</td>
                <td>{c.impressions.toLocaleString()}</td>
                <td>
                  <span style={{ color: c.status === 'active' ? 'green' : 'red', fontWeight: 'bold' }}>
                    {c.status.toUpperCase()}
                  </span>
                </td>
                <td>
                  <button onClick={() => dispatch(toggleStatus(c.id))}>
                    Toggle Status
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <Dashboard />
    </Provider>
  );
}
```
