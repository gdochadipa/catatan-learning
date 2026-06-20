# Module 5: Practical Hands-On Lab (Ad Dashboard Prototype)

Welcome to Module 5. To master a stack, you must write code. In this practical lab, you will study and run a miniature **Ad Platform Dashboard**. 

This lab consists of:
1.  **A Golang API Server:** Managing mock ad campaigns in-memory, supporting status toggles, serving analytical aggregates, and authenticating with custom simulated JWT checks.
2.  **A React + TypeScript Dashboard UI:** Showing a dynamic table of campaigns, calculating metrics (CTR), filtering using your custom typed `useDebounce` hook, and executing API mutations.

---

## 1. Project Directory Structure

Create a local workspace directory on your machine to host this lab:
```bash
ad-dashboard-lab/
├── backend/
│   └── main.go         # Golang HTTP server & Mock DB
└── frontend/
    ├── useDebounce.ts  # Custom typed hook
    └── Dashboard.tsx   # React + TS Dashboard layout
```

---

## 2. Backend Layer: Golang API (`backend/main.go`)

This Go script uses only the standard library (`net/http`) so it can be executed instantly with no dependencies. It includes:
*   In-memory data store representing database campaigns.
*   CORS headers middleware enabling communication with local frontend React servers.
*   Routes: `/api/login` (Auth), `/api/campaigns` (GET - Read list), `/api/campaigns/toggle` (POST - Update status).

Copy the code below into your `backend/main.go`:

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Campaign defines our ad campaign database model with reporting metrics
type Campaign struct {
	ID          string  `json:"id"`
	Name        string  `json:"name"`
	Status      string  `json:"status"` // "ACTIVE" or "PAUSED"
	Budget      float64 `json:"budget"`
	Impressions int64   `json:"impressions"`
	Clicks      int64   `json:"clicks"`
	Spend       float64 `json:"spend"`
}

// In-Memory Thread-Safe Data Store
type Store struct {
	mu        sync.RWMutex
	campaigns []Campaign
}

var dbStore = &Store{
	campaigns: []Campaign{
		{ID: "camp-101", Name: "Summer Banner display", Status: "ACTIVE", Budget: 350.00, Impressions: 125000, Clicks: 2500, Spend: 120.50},
		{ID: "camp-102", Name: "Black Friday Sale Video", Status: "ACTIVE", Budget: 1500.00, Impressions: 450000, Clicks: 9200, Spend: 870.20},
		{ID: "camp-103", Name: "Google Shopping Feed Ad", Status: "PAUSED", Budget: 800.00, Impressions: 85000, Clicks: 1100, Spend: 195.40},
		{ID: "camp-104", Name: "Spring Clearance Native", Status: "ACTIVE", Budget: 200.00, Impressions: 50000, Clicks: 850, Spend: 45.10},
	},
}

// Enable Cross-Origin Resource Sharing (CORS) Middleware
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

		// Handle preflight OPTIONS request
		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Handler: Returns list of campaigns
func getCampaignsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	dbStore.mu.RLock()
	defer dbStore.mu.RUnlock()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(dbStore.campaigns)
}

// Handler: Toggles status between "ACTIVE" and "PAUSED"
func toggleStatusHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Read input payload
	var req struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Bad request payload", http.StatusBadRequest)
		return
	}

	dbStore.mu.Lock()
	defer dbStore.mu.Unlock()

	success := false
	var updatedCampaign Campaign

	for i, c := range dbStore.campaigns {
		if c.ID == req.ID {
			if c.Status == "ACTIVE" {
				dbStore.campaigns[i].Status = "PAUSED"
			} else {
				dbStore.campaigns[i].Status = "ACTIVE"
			}
			updatedCampaign = dbStore.campaigns[i]
			success = true
			break
		}
	}

	if !success {
		http.Error(w, "Campaign not found", http.StatusNotFound)
		return
	}

	log.Printf("[DB Update] Campaign %s status toggled to %s", updatedCampaign.ID, updatedCampaign.Status)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedCampaign)
}

// Handler: Simplified Login Mock yielding a dummy JWT token string
func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var loginReq struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&loginReq); err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	// Check credentials (mock check)
	if loginReq.Username == "admin" && loginReq.Password == "password123" {
		w.Header().Set("Content-Type", "application/json")
		// Simulate returning a static token for dashboard access
		json.NewEncoder(w).Encode(map[string]string{
			"token": "simulated-jwt-token-xyz-987654321",
			"user":  "Administrator",
		})
	} else {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
	}
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/api/login", loginHandler)
	mux.HandleFunc("/api/campaigns", getCampaignsHandler)
	mux.HandleFunc("/api/campaigns/toggle", toggleStatusHandler)

	// Wrap handlers with logging and CORS capabilities
	siteHandler := corsMiddleware(mux)

	fmt.Println("🚀 Go Ad-Dashboard Lab Server starting on http://localhost:8080 ...")
	if err := http.ListenAndServe(":8080", siteHandler); err != nil {
		log.Fatal(err)
	}
}
```

---

## 3. Frontend Layer: Custom Debounce Hook (`frontend/useDebounce.ts`)

Create a local hook file to optimize dashboard filter updates:

```typescript
import { useState, useEffect } from 'react';

// Generics T allows debouncing any type (string, array, object)
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean up timer if dependency values change (keystroke input changes)
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 4. Frontend Layer: Dashboard Layout (`frontend/Dashboard.tsx`)

This React component aggregates state management, API integration, styling, and rendering optimizations.

Copy the code below into `frontend/Dashboard.tsx`:

```tsx
import React, { FC, useState, useEffect, useMemo, useCallback, ChangeEvent } from 'react';
import { useDebounce } from './useDebounce';

// 1. Interfaces for campaign types
interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  budget: number;
  impressions: number;
  clicks: number;
  spend: number;
}

const BACKEND_URL = 'http://localhost:8080/api';

export const AdDashboard: FC = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED'>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Use custom useDebounce hook (350ms delay) to prevent processing searches on every keystroke
  const debouncedSearch = useDebounce<string>(search, 350);

  // 2. Load Campaigns from Backend Go API
  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${BACKEND_URL}/campaigns`);
      if (!res.ok) throw new Error('Failed to retrieve campaigns data.');
      const data = await res.json();
      setCampaigns(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unknown network error.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  // 3. Toggle Status Callback wrapped in useCallback to keep references stable
  const handleToggleStatus = useCallback(async (id: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/campaigns/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) throw new Error('Failed to adjust campaign status.');
      
      const updatedItem: Campaign = await res.json();

      // Update campaigns state array in-place
      setCampaigns(prev => prev.map(c => c.id === id ? updatedItem : c));
    } catch (err: any) {
      alert(err.message);
    }
  }, []);

  // 4. Computationally intensive aggregations and filters wrapped in useMemo
  const filteredCampaigns = useMemo(() => {
    console.log('Calculating filtered campaigns cache...');
    return campaigns.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, debouncedSearch, statusFilter]);

  // Aggregate stats totals computed in useMemo
  const aggregates = useMemo(() => {
    console.log('Calculating aggregate totals cache...');
    let totalSpend = 0;
    let totalClicks = 0;
    let totalImpressions = 0;

    filteredCampaigns.forEach(c => {
      totalSpend += c.spend;
      totalClicks += c.clicks;
      totalImpressions += c.impressions;
    });

    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return { totalSpend, totalClicks, totalImpressions, averageCtr };
  }, [filteredCampaigns]);

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  return (
    <div style={{ padding: '24px', fontFamily: 'sans-serif', maxWidth: '1100px', margin: '0 auto' }}>
      <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: '#1e293b' }}>Ad Platform Dashboard</h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b' }}>Technical Practical Assessment Sandbox</p>
        </div>
        <button 
          onClick={fetchCampaigns} 
          style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Refresh Data
        </button>
      </header>

      {/* Aggregates Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Total Impressions</span>
          <h2 style={{ margin: '8px 0 0 0', color: '#0f172a' }}>{aggregates.totalImpressions.toLocaleString()}</h2>
        </div>
        <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Total Clicks</span>
          <h2 style={{ margin: '8px 0 0 0', color: '#0f172a' }}>{aggregates.totalClicks.toLocaleString()}</h2>
        </div>
        <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Total Spend</span>
          <h2 style={{ margin: '8px 0 0 0', color: '#10b981' }}>${aggregates.totalSpend.toFixed(2)}</h2>
        </div>
        <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
          <span style={{ fontSize: '14px', color: '#64748b' }}>Average CTR</span>
          <h2 style={{ margin: '8px 0 0 0', color: '#f59e0b' }}>{aggregates.averageCtr.toFixed(2)}%</h2>
        </div>
      </div>

      {/* Filter and Query bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <input 
          type="text" 
          placeholder="Search campaigns..." 
          value={search}
          onChange={handleSearchChange}
          style={{ padding: '8px 12px', flex: 1, border: '1px solid #cbd5e1', borderRadius: '4px' }}
        />
        <select 
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value as any)}
          style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: '4px' }}
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
        </select>
      </div>

      {/* Error / Loading Indicators */}
      {error && <div style={{ padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '4px', marginBottom: '16px' }}>{error}</div>}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Querying campaign databases...</div>
      ) : (
        /* Data grid table */
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e2e8f0', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9' }}>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Campaign Name</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Status</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Budget ($/Day)</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Impressions</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Clicks</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>CTR (%)</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Spend</th>
              <th style={{ padding: '12px', borderBottom: '1px solid #e2e8f0' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCampaigns.map(c => {
              const ctr = c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0;
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.name}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: c.status === 'ACTIVE' ? '#047857' : '#b91c1c',
                      backgroundColor: c.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2'
                    }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>${c.budget.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>{c.impressions.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{c.clicks.toLocaleString()}</td>
                  <td style={{ padding: '12px' }}>{ctr.toFixed(2)}%</td>
                  <td style={{ padding: '12px' }}>${c.spend.toFixed(2)}</td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => handleToggleStatus(c.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: c.status === 'ACTIVE' ? '#ef4444' : '#10b981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer'
                      }}
                    >
                      {c.status === 'ACTIVE' ? 'Pause' : 'Activate'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {filteredCampaigns.length === 0 && (
              <tr>
                <td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#64748b' }}>No matching campaigns found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

---

## 5. Practical Execution & Self-Assessment Drills

To demonstrate senior-level technical competency during your interviews, set up this sandbox and attempt the following three modification drills:

### Drill 1: Add Campaign Creation Form
*   **The Goal:** Add a form at the top of your React dashboard to create new campaigns (taking Name and Budget inputs) and submit them via a `POST /api/campaigns/add` route to your Golang backend.
*   **Study Point:** Test how React appends new elements to state arrays using immutable patterns `setCampaigns(prev => [...prev, newCampaign])` and how your Go handler parses multi-field request bodies.

### Drill 2: Implement Client-Side Rendering (CSR) Profiling
*   **The Goal:** Boot the app, open **React DevTools Profiler**, and record. Change the `statusFilter` back and forth. Open the console and observe the log traces: `Calculating filtered campaigns cache...`.
*   **Study Point:** Verify that typing in search input *only* logs cache recalculations after the `350ms` debouncer triggers, proving that the `useDebounce` hook successfully saves CPU processing overhead.

### Drill 3: Add Mock JWT Protection Check
*   **The Goal:** Modify the Go `getCampaignsHandler` to inspect the incoming request headers. If `Authorization` is missing or is not equal to `Bearer simulated-jwt-token-xyz-987654321`, reject with `401 Unauthorized`. On the React frontend, simulate logging in using the `/api/login` endpoint to retrieve the token and add it to all fetching headers.
*   **Study Point:** Practice writing authentication headers and securing APIs on the backend using stateful structures.

---

## 🗂️ Interactive Flashcard Deck
*Test your knowledge interactively. Click on each card to reveal the hidden answer.*

<details>
<summary><b>Card 1: Why is sync.Mutex necessary in the Go backend lab map?</b></summary>
<p><b>Answer:</b></p>
<p>Go maps are **not thread-safe**. If multiple concurrent HTTP handlers or background workers attempt to read or write to a map concurrently, Go triggers a fatal runtime panic. Protecting maps using <code>sync.Mutex</code> locks ensures that only one goroutine can write/read to memory at any single moment.</p>
</details>

<details>
<summary><b>Card 2: Why do we wrap the React fetch campaign toggle operation with useCallback?</b></summary>
<p><b>Answer:</b></p>
<p>The <code>handleToggleStatus</code> executes an async fetch call. If not memoized, a brand-new function instance is generated on every single render. If we pass this handler down as a prop to child rows, it forces those rows to re-render. Wrapping in <code>useCallback</code> guarantees a stable reference, enabling performance optimizations.</p>
</details>

<details>
<summary><b>Card 3: In Go net/http router, what is standard CORS middleware preflight validation?</b></summary>
<p><b>Answer:</b></p>
<p>Browsers automatically send an HTTP <code>OPTIONS</code> request (Preflight) before cross-origin POST/PUT requests to verify if target APIs authorize the transaction headers and origins. If Go does not intercept <code>OPTIONS</code> requests and return <code>200 OK</code> immediately with valid headers, browsers reject the secondary transaction.</p>
</details>

<details>
<summary><b>Card 4: Why does our React state modification use 'prev => prev.map(...)' inside toggle?</b></summary>
<p><b>Answer:</b></p>
<p>To enforce **State Immutability**. We must never mutate state arrays directly (e.g., <code>campaigns[idx] = updated</code>). Using <code>map()</code> creates a brand-new array reference in memory containing the modified item, enabling React's reconciler to trigger clean visual updates.</p>
</details>

<details>
<summary><b>Card 5: Why is JSON.newEncoder(w).Encode(data) used in Go instead of json.Marshal?</b></summary>
<p><b>Answer:</b></p>
<p><code>json.NewEncoder</code> writes serialized JSON bytes directly into the HTTP response stream buffer line-by-line as it parses structures. This minimizes memory overhead, whereas <code>json.Marshal</code> allocates a full temporary byte array slice in server RAM before returning.</p>
</details>
