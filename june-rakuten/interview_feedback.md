# Rakuten Mock Interview Feedback Report

- **Candidate:** Gede Ocha Dipa Ananda
- **Target Role:** Software Development Engineer (UI/API) - GATD, Rakuten Inc., Japan
- **Interviewer:** Aiko Tanaka (Senior Technical Recruiter)
- **Date of Interview:** Sunday, June 14, 2026
- **Time of Interview:** 2:30 PM
- **Interview Session Count:** #1
- **Total Questions Addressed:** 4

---

## 📊 Scorecard & Counts

| Dimension | Score (1-5) | Recruiter Assessment |
| :--- | :---: | :--- |
| **Communication Clarity** | `3.5 / 5.0` | Good structure overall. Some casual phrasing; could benefit from more formal, STAR-aligned phrasing. |
| **Technical Depth** | `3.8 / 5.0` | Solid backend foundation. Demonstrates awareness of caching, indexing, message queues, and architectural trade-offs. |
| **Ownership Signals** | `4.0 / 5.0` | Strong use of "I" when describing responsibilities and implementations (e.g., Stripe integration, query tuning). |
| **STAR Completeness** | `3.5 / 5.0` | Outlined Situation, Task, and Action very well. Tended to skip or under-report the business/operational **Result**. |
| **Rakuten Culture Fit** | `3.5 / 5.0` | Strong alignment with "Always Improve, Always Advance" through proactive optimization of existing slow systems. |
| **Growth Mindset** | `4.0 / 5.0` | Very forward-thinking when designing the reporting system from scratch. Openly weighs modern technologies (Go/Rust/Serverless). |
| **OVERALL COUNT / AVERAGE** | **`3.71 / 5.0`** | **Verdict: Strong Maybe / Bordering on Hire (Proceed to next round with technical focus)** |

---

## 📝 Detailed Session Breakdown & Metrics

### 1. Questions Asked & Answered Count
- **Question 1 (Opening/Background):** *"Walk me through your background and what brought you to consider Rakuten?"*
  - *Candidate Focus:* Mentioned Fintech/IoT backgrounds, Vue/React frontend skills, and excitement about working at Rakuten.
- **Question 2 (Architecture/Stripe Integration):** *"How did you handle Stripe webhook notifications reliably using EventBridge/SQS, and guarantee idempotency?"*
  - *Candidate Focus:* Explained the microservice breakdown, using SQS FIFO for ordering/deduplication, and database uuidv4 indexing.
- **Question 3 (Database Optimization):** *"How did you optimize loan account report queries, reducing response times by 20%?"*
  - *Candidate Focus:* Explained adding indexing to MySQL, refactoring queries with too many joins, and moving tasks to background Laravel batch jobs.
- **Question 4 (Scaling & Re-architecting):** *"If you were to rebuild this reporting system from scratch today, how would you do it?"*
  - *Candidate Focus:* Suggested period-based database partitioning, maximizing indexing, combining serverless + background queues, and using high-performance languages like Go or Rust.

---

## ✅ What Worked Well

1. **Clear System Decomposition:** Breakdowns (like listing the 4 main functions of the billing microservice) were structured, clean, and professional.
2. **Trade-off Recognition:** Recognizing that adding indexes speeds up read queries but incurs a write-performance trade-off shows maturity.
3. **High-Performance Architecture Mindset:** Designing for decoupled, async background processing and mentioning language performance upgrades (Go/Rust) fits Rakuten's GATD standards.

---

## ⚠️ What Needs Sharpening

1. **Detailed Application-Layer Idempotency:**
   - *Issue:* SQS FIFO only has a 5-minute deduplication window, but Stripe retries over days.
   - *Fix:* Explain storing Stripe Event IDs in an `idempotency_keys` table with a unique constraint. If a duplicate arrives, the database reject prevents a double-charge.
2. **Quantifying Outcomes (Result):**
   - *Issue:* Ending answers with general technical success instead of hard numbers.
   - *Fix:* Quantify the 20% database reduction. Frame it as: *"This optimization lowered CPU usage from 90% to 40%, and reduced timeout-related customer support tickets by 85%."*
3. **Addressing the React Gap Proactively:**
   - *Issue:* The JD requires React, but your primary professional experience is in Vue JS.
   - *Fix:* Highlight the theoretical similarities (components, states, hooks vs composition API) and discuss recent React personal project work to eliminate recruiter concern.

---

## 🇯🇵 Rakuten Culture Fit & Shugi Connection

* **Maximize Customer Satisfaction:** Frame optimizations in terms of how it saved clients' time and improved their core workflow.
* **Speed!! Speed!! Speed!!:** Highlight how moving slow processes to asynchronous background jobs ensured the UI remained fast and responsive for users.

---

## 🎯 Recruiter Note
> *"Gede is a highly competent backend/API developer with rich event-driven and transactional database experience. He shows strong engineering instincts. To secure the SDE role in GATD, he needs to refine his STAR execution by clearly measuring and stating business results, and proactively frame his Vue experience as an asset that allows him to pick up React rapidly."*
