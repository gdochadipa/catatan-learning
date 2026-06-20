# Module 3: Golang APIs, JWT Authentication, and Database Schema Design

Welcome to Module 3. This module covers the backend layer, focusing on building high-performance APIs in Go, securing them with JWTs, and architecting database schemas optimized for ad reporting and analytics.

---

## 1. Web APIs in Golang

The JD lists **Familiarity with Golang** and **Experience in developing Web APIs**. Go is widely selected in Ad Tech because of its fast startup times, high throughput concurrency (goroutines), and lightweight runtime.

### HTTP Routing, Handlers, and Middlewares
Go's standard library `net/http` provides all structural components needed to write scalable REST services.

#### Golang API Boilerplate
Let's review a complete, production-ready Go HTTP server boilerplate using raw standard library handlers.

```go
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

// Campaign represents an ad campaign
type Campaign struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Budget    float64   `json:"budget"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"created_at"`
}

// Global logger middleware
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		// Execute downstream handler
		next.ServeHTTP(w, r)
		// Log method, path, and duration
		log.Printf("[%s] %s took %s", r.Method, r.URL.Path, time.Since(start))
	})
}

// HTTP Handler function
func getCampaignsHandler(w http.ResponseWriter, r *http.Request) {
	// Set JSON response headers
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	// Mock data representing database rows
	campaigns := []Campaign{
		{ID: "1", Name: "Summer Sale Display", Budget: 500.00, Status: "ACTIVE", CreatedAt: time.Now()},
		{ID: "2", Name: "Google Shopping Feed", Budget: 1200.50, Status: "ACTIVE", CreatedAt: time.Now()},
	}

	// Encode struct slice directly into the response stream
	if err := json.NewEncoder(w).Encode(campaigns); err != nil {
		http.Error(w, "Failed to encode campaigns data", http.StatusInternalServerError)
	}
}

func main() {
	mux := http.NewServeMux()

	// Register route handlers
	mux.HandleFunc("/api/campaigns", getCampaignsHandler)

	// Wrap our ServeMux with standard logging middleware
	loggedMux := LoggingMiddleware(mux)

	fmt.Println("Server executing on http://localhost:8080 ...")
	if err := http.ListenAndServe(":8080", loggedMux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
```

---

## 2. JWT Authentication & Authorization

To protect dashboards containing billing details, we require authentication middleware. **JSON Web Tokens (JWT)** provide an industry-standard, stateless authorization mechanism.

### Anatomy of a JWT
A JWT is a string split into three parts by dots (`.`): `Header.Payload.Signature`
1.  **Header:** Identifies the signing algorithm (e.g., `HS256`).
2.  **Payload:** Contains claims—statements about the user (e.g., `userID`, `role`, `exp` expiration timestamp).
3.  **Signature:** Verifies that the sender is who they say they are and guarantees the message wasn't altered. It is created by hashing the encoded Header and Payload using a secret key.

### Golang Authentication Middleware Implementation
This JWT validation middleware interceptor extracts and verifies Bearer tokens from incoming HTTP headers.

```go
package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5" // Common Go community JWT library
)

type contextKey string

const UserContextKey contextKey = "userData"

// Secret key used to sign tokens (keep this secure in env variables!)
var jwtSecretKey = []byte("super_secret_ad_dashboard_key_12345")

// Claims represents JWT Payload
type CustomClaims struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// JWT Authentication Middleware function
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// 1. Extract Authorization header: "Bearer <token>"
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header missing", http.StatusUnauthorized)
			return
		}

		parts := strings.Split(authHeader, " ")
		if len(parts) != 2 || strings.ToLower(parts[0]) != "bearer" {
			http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
			return
		}

		tokenString := parts[1]

		// 2. Parse and validate claims
		token, err := jwt.ParseWithClaims(tokenString, &CustomClaims{}, func(token *jwt.Token) (interface{}, error) {
			// Validate signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return jwtSecretKey, nil
		})

		if err != nil || !token.Valid {
			http.Error(w, "Invalid or expired JWT token", http.StatusUnauthorized)
			return
		}

		claims, ok := token.Claims.(*CustomClaims)
		if !ok {
			http.Error(w, "Invalid token claims structure", http.StatusUnauthorized)
			return
		}

		// 3. Store user metadata in Request Context, allowing route handlers to use it
		ctx := context.WithValue(r.Context(), UserContextKey, claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
```

---

## 3. Database Schema Design (Analytics & Reporting)

The JD lists **Design Database schema** and **Practical experience in database design** as core tasks. Ad reporting dashboards aggregate millions of historical rows (by clicks/impressions) per hour.

### Relational Schema Blueprint (PostgreSQL/MySQL)

To track advertisers, their campaigns, individual ad layouts (creatives), and temporal stats, we must design a highly structured relational schema.

```sql
-- 1. Advertisers table (Parent Entity)
CREATE TABLE advertisers (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Campaigns table (One-to-Many with Advertisers)
CREATE TABLE campaigns (
    id VARCHAR(36) PRIMARY KEY,
    advertiser_id VARCHAR(36) NOT NULL,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PAUSED', -- ACTIVE, PAUSED, ENDED
    budget DECIMAL(12, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    FOREIGN KEY (advertiser_id) REFERENCES advertisers(id) ON DELETE CASCADE
);

-- 3. Ad Creatives (One-to-Many with Campaigns)
CREATE TABLE ad_creatives (
    id VARCHAR(36) PRIMARY KEY,
    campaign_id VARCHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    format VARCHAR(50) NOT NULL, -- DISPLAY, VIDEO, NATIVE, GOOGLE_SHOPPING
    image_url TEXT,
    destination_url TEXT NOT NULL,
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- 4. Hourly Analytics (Reporting Time-Series Table)
-- We store analytics aggregated hourly to avoid querying raw impression events directly.
CREATE TABLE hourly_analytics (
    id BIGSERIAL PRIMARY KEY,
    creative_id VARCHAR(36) NOT NULL,
    date_hour TIMESTAMP NOT NULL, -- Format: YYYY-MM-DD HH:00:00
    impressions BIGINT DEFAULT 0,
    clicks BIGINT DEFAULT 0,
    spend DECIMAL(12, 4) DEFAULT 0.0000,
    conversions INT DEFAULT 0,
    FOREIGN KEY (creative_id) REFERENCES ad_creatives(id) ON DELETE CASCADE
);

-- Add composite index on reporting columns for optimal query performance
CREATE INDEX idx_analytics_creative_date ON hourly_analytics(creative_id, date_hour);
```

### High-Yield Analytic SQL Queries
For the interview, expect questions on writing SQL aggregates to compute Core Ad Tech Key Performance Indicators (KPIs):
*   **CTR (Click-Through Rate):** $\frac{\text{Clicks}}{\text{Impressions}} \times 100$
*   **eCPC (Effective Cost Per Click):** $\frac{\text{Spend}}{\text{Clicks}}$
*   **Conversion Rate (CVR):** $\frac{\text{Conversions}}{\text{Clicks}} \times 100$

#### Retrieve Daily Campaign Performance Report
```sql
SELECT 
    c.id AS campaign_id,
    c.name AS campaign_name,
    DATE(ha.date_hour) AS report_date,
    SUM(ha.impressions) AS total_impressions,
    SUM(ha.clicks) AS total_clicks,
    ROUND(SUM(ha.spend), 2) AS total_spend,
    -- Prevent division-by-zero using NULLIF
    ROUND((SUM(ha.clicks)::DECIMAL / NULLIF(SUM(ha.impressions), 0)) * 100, 4) AS ctr_percentage,
    ROUND(SUM(ha.spend) / NULLIF(SUM(ha.clicks), 0), 4) AS average_cpc
FROM campaigns c
JOIN ad_creatives ac ON c.id = ac.campaign_id
JOIN hourly_analytics ha ON ac.id = ha.creative_id
WHERE c.advertiser_id = 'adv-1234' 
  AND ha.date_hour >= '2026-06-01 00:00:00'
GROUP BY c.id, c.name, DATE(ha.date_hour)
ORDER BY report_date DESC, total_spend DESC;
```

---

---

## 🗂️ Interactive Flashcard Deck
*Test your knowledge interactively. Click on each card to reveal the hidden answer.*

<details>
<summary><b>Card 1: Why is Golang preferred over Node.js or Python for high-throughput ad tracking API services?</b></summary>
<p><b>Answer:</b></p>
<p>Go compiles directly to a native machine binary, bypassing virtual machines or interpreters. It utilizes highly-efficient parallel goroutines that map to OS threads dynamically, maintaining a tiny memory footprint (2KB starting stack) that processes hundreds of thousands of requests concurrently with sub-millisecond response latency.</p>
</details>

<details>
<summary><b>Card 2: How does standard middleware intercept incoming HTTP requests in a Go server?</b></summary>
<p><b>Answer:</b></p>
<p>In Go, HTTP handlers implement the <code>http.Handler</code> interface. Middleware is a wrapper function that receives an <code>http.Handler</code> and returns a new <code>http.Handler</code>. It intercepts incoming requests, executes checks (like JWT validation), writes errors if validations fail, or calls <code>next.ServeHTTP(w, r)</code> to pass execution down the stack.</p>
</details>

<details>
<summary><b>Card 3: In JWT authorization, what are "claims" and where are they located?</b></summary>
<p><b>Answer:</b></p>
<p>Claims are statements of metadata containing user context (e.g., user ID, roles, scopes, token expiration) stored inside the Base64URL-encoded **Payload** (the second segment) of the JSON Web Token. They are verified cryptographically via the token's signature segment.</p>
</details>

<details>
<summary><b>Card 4: Why are relational database schemas (like PostgreSQL) organized into 3NF for operational data?</b></summary>
<p><b>Answer:</b></p>
<p>Third Normal Form (3NF) eliminates data redundancies and transitive dependencies. This guarantees database write consistency—if an advertiser's billing address or campaign name changes, it is written to exactly one cell in a single table, preventing update anomalies.</p>
</details>

<details>
<summary><b>Card 5: Why is checking metrics CTR mathematically risky in SQL aggregates, and how do you prevent crashes?</b></summary>
<p><b>Answer:</b></p>
<p>If a campaign is newly launched, its total impressions is 0. Running the division formula <code>SUM(clicks) / SUM(impressions)</code> causes a fatal database **Division by Zero** crash. Prevent this by using SQL's <code>NULLIF(impressions, 0)</code>, which safely returns a <code>NULL</code> value instead of crashing.</p>
</details>

<details>
<summary><b>Card 2: How does standard middleware intercept incoming HTTP requests in a Go server?</b></summary>
<p><b>Answer:</b></p>
<p>In Go, HTTP handlers implement the <code>http.Handler</code> interface. Middleware is a wrapper function that receives an <code>http.Handler</code> and returns a new <code>http.Handler</code>. It intercepts incoming requests, executes checks (like JWT validation), writes errors if validations fail, or calls <code>next.ServeHTTP(w, r)</code> to pass execution down the stack.</p>
</details>

<details>
<summary><b>Card 3: In JWT authorization, what are "claims" and where are they located?</b></summary>
<p><b>Answer:</b></p>
<p>Claims are statements of metadata containing user context (e.g., user ID, roles, scopes, token expiration) stored inside the Base64URL-encoded **Payload** (the second segment) of the JSON Web Token. They are verified cryptographically via the token's signature segment.</p>
</details>

<details>
<summary><b>Card 4: Why are relational database schemas (like PostgreSQL) organized into 3NF for operational data?</b></summary>
<p><b>Answer:</b></p>
<p>Third Normal Form (3NF) eliminates data redundancies and transitive dependencies. This guarantees database write consistency—if an advertiser's billing address or campaign name changes, it is written to exactly one cell in a single table, preventing update anomalies.</p>
</details>

<details>
<summary><b>Card 5: Why is checking metrics CTR mathematically risky in SQL aggregates, and how do you prevent crashes?</b></summary>
<p><b>Answer:</b></p>
<p>If a campaign is newly launched, its total impressions is 0. Running the division formula <code>SUM(clicks) / SUM(impressions)</code> causes a fatal database **Division by Zero** crash. Prevent this by using SQL's <code>NULLIF(impressions, 0)</code>, which safely returns a <code>NULL</code> value instead of crashing.</p>
</details>
