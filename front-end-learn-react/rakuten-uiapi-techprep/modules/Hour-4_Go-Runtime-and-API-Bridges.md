# 🐹 Hour 4: Go Runtime & High-Performance API Bridges

## 1. Concurrency Models: Go vs. JavaScript

When interviewing for a hybrid UI/API role, you must demonstrate mastery of both runtime environments.

| Feature | JavaScript (V8 Engine) | Go (Golang Runtime) |
| :--- | :--- | :--- |
| **Concurrency Model** | **Single-threaded Event Loop** | **Multi-threaded CSP (Communicating Sequential Processes)** |
| **Execution Blockers** | Long synchronous CPU computations block rendering and input. | Goroutines block concurrently on tasks without halting other tasks. |
| **Resource Footprint** | Low thread footprint, but cannot utilize multi-core natively (requires Workers). | Extremely lightweight. Goroutine stack starts at **2KB** (OS threads take 1-2MB). |

---

## 2. Go Runtime Scheduler: The GMP Model

Go bypasses the OS thread scheduling overhead by managing its own logical context scheduler in user-space, known as the **GMP Model**:

* **G (Goroutine):** Represents the execution of a function. Contains stack details and program counters.
* **M (Machine):** Represents a physical OS thread managed by the kernel.
* **P (Processor):** Represents a logical processor or context required to run Go code (by default, matches logical CPU cores).

```
   [ Local Run Queue ]
   ┌────────────────┐
   │ G2 ──> G3 ──>  │
   └───────┬────────┘
           ▼
        ┌─────┐
        │  P  │ (Processor Context)
        └─────┘
           │
        ┌─────┐
        │  M  │ (OS Thread)
        └─────┘
           │
        ┌─────┐
        │  G1 │ (Active Goroutine running)
        └─────┘
```

### Work-Stealing Scheduling
If an active goroutine `G1` makes a blocking system call (such as a database query or network read), the scheduler unbinds processor `P` from OS thread `M1` (which blocks), and associates it with a new thread `M2` to continue executing other goroutines in the run queue. This is why Go handles millions of concurrent requests with sub-millisecond latencies.

---

## 3. Channels & Safe Communication

Go implements the Hoare's CSP paradigm. Instead of using shared locks (`sync.Mutex`) to modify shared memory variables, Goroutines safely pass ownership of variables across **channels**.

### Buffered vs. Unbuffered Channels
* **Unbuffered Channel (`make(chan T)`):** Writing to the channel blocks the sender until a receiver is ready to read. This operates as a synchronous handshake.
* **Buffered Channel (`make(chan T, cap`)):** Writing does not block until the buffer capacity is completely filled. It acts as an asynchronous queue.

```go
package main

import (
	"context"
	"fmt"
	"time"
)

// ProcessAdMetrics runs a high-throughput mock query with timeout cancellation
func ProcessAdMetrics(ctx context.Context, adID string) (int, error) {
	resultChan := make(chan int, 1) // Buffered channel to prevent leak if timeout occurs

	go func() {
		// Simulate network database query latency
		time.Sleep(200 * time.Millisecond)
		resultChan <- 45000 // Send simulated impressions count
	}()

	select {
	case res := <-resultChan:
		return res, nil
	case <-ctx.Done():
		return 0, fmt.Errorf("database timeout: %w", ctx.Err())
	}
}
```

---

## 📝 Hour 4: Mini-Quiz

### Q1: Why is leaking goroutines a critical memory leak vulnerability in Go, and how does using a Buffered Channel of capacity 1 inside a select-timeout block (like in `ProcessAdMetrics` above) protect against it?

### Q2: What is the Go compiler's Escape Analysis, and why does keeping objects on the Stack rather than the Heap improve performance in Go microservices?
