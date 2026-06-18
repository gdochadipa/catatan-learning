# Rakuten SDE (UI/API) - GATD Interview Preparation Q&A (Simplified English)

This document contains simple and clear STAR-structured questions and answers for **Gede Ocha Dipa Ananda**'s interview with **Rakuten Inc., Japan** for the **Software Development Engineer (UI/API) - GATD** role.

The language used here is straightforward, easy to speak, and natural for non-native English speakers.

---

## 🎯 Question 1: Learning React and Bridging the Gap
* **Goal:** Show that you can learn React quickly using your strong Vue and TypeScript skills.

### Question:
*"I see you have an impressive backend background in Go, Node.js, and TypeScript, and you've worked extensively with Vue.js in your frontend roles. Since this position centers on React and TypeScript for UI/API integration, how do you plan to transition into a React-dominated ecosystem, and how do your existing skills translate?"*

### Simple Answer (STAR):
* **Situation:** At my previous job, I built frontend websites using Vue.js for a marketplace that had over 50 active users daily. However, I know that Rakuten uses React and TypeScript for this role.
* **Task:** I needed to make sure I could learn React quickly and start writing production-ready code without slowing down the team.
* **Action:** I compared both frameworks. Vue 3 (Composition API) is very similar to React Hooks. They both use reactive states, side effects (like `useEffect`), and reusable functions. To get hands-on experience, I built a few React applications. For example, I created a minigame with tic tactoe  In this project, I practiced React state management, hooks, and basic performance optimizations.
* **Result:** Since both Vue and React use TypeScript—which I use every day—it was easy for me to write clean and type-safe code. This practice helped me reduce frontend integration bugs by 35%. I am very confident that my strong frontend foundation and recent React practice will help me start working on Rakuten's tasks from my very first day.

---

## 🔒 Question 2: Stripe Billing and Idempotency (Preventing Double Payments)
* **Goal:** Explain your backend and API skills clearly. Explain how you made sure payments are safe and never processed twice.

### Question:
*"At Igloo Company, you engineered the core billing infrastructure via Stripe using AWS EventBridge and SQS for 4,000+ global users. Webhooks can fail, retry, or deliver out of order. How did you design this system to handle events reliably and guarantee absolute idempotency?"*

### Simple Answer (STAR):
* **Situation:** At Igloo Company, we handled smart lock payments. If a payment webhook failed, the user could be locked out of their house. If we processed a payment twice, we would double-charge the customer, which is very bad.
* **Task:** I had to design a payment system that is 100% reliable and makes sure no payment is ever processed twice (this is called idempotency).
* **Action:** I built a simple and reliable event system:
  1. **Quick Response:** Stripe sent webhooks to our AWS API Gateway. We immediately saved the event to AWS SQS (a message queue) and returned a fast success response (under 50 milliseconds) to Stripe so it wouldn't timeout.
  2. **First Check:** We used SQS FIFO queues to keep the messages in order and block immediate duplicates within 5 minutes.
  3. **Second Check (Database Layer):** Sometimes, Stripe retries failed webhooks after a few hours or days. To handle this, I created a table in our PostgreSQL database called `idempotency_keys` with a unique rule on the Stripe Event ID. Before we processed any payment, the system tried to write this ID to the table. If the database rejected the write because the ID already existed, the system knew it was a duplicate. It safely skipped the payment and returned the saved success message.
* **Result:** This dual-layer system worked perfectly. We successfully processed over 4,000 global payments with zero double-billing errors and reduced webhook failures to 0%.

---

## ⚡ Question 3: Database Optimization (Making Slow Queries Fast)
* **Goal:** Show how you find and fix slow queries, and show the exact results.

### Question:
*"You mention optimizing loan account report queries, reducing response times by 20% at Djoin.id, and utilizing Laravel Batch Jobs. Walk me through how you isolated the bottlenecks and the impact of your optimizations."*

### Simple Answer (STAR):
* **Situation:** At Djoin.id, our platform served more than 40 banks and cooperatives. When users tried to download loan reports, the system ran huge, slow database queries. During busy hours, this caused database timeouts and made the entire platform slow for everyone.
* **Task:** I needed to find out why the queries were slow, make them faster, and ensure reports generated reliably.
* **Action:** I used a tool called `EXPLAIN ANALYZE` on MySQL to find the bottleneck. I found two main issues: missing indexes and bad query loops (the N+1 query problem).
  1. **Database Speedup:** I added a compound index on the most-searched columns `(loan_id, status, created_at)` and refactored the SQL code to join tables more efficiently. This made the queries 20% faster (saving 4 seconds per query).
  2. **Background Jobs:** To keep the platform fast, I moved the report generation to the background. Instead of making the user wait on the screen, I used Laravel Batch Jobs to process the queries in small chunks in the background. Once the report was ready, we uploaded it to AWS S3 and sent a message to the user.
* **Result:** These changes lowered the database CPU usage from 90% to 40% during busy hours. It completely stopped timeout errors and reduced customer complaints by 85%.

---

## 📋 Question 4: Turning Business Requirements into Code
* **Goal:** Show that you can understand business ideas and turn them into clear technical designs.

### Question:
*"Can you share an example of a time you translated a high-level, ambiguous business requirement into a robust, scalable technical design?"*

### Simple Answer (STAR):
* **Situation:** At Igloo Company, the product team wanted to automate smart lock access for rental platforms like Airbnb. They wanted a system that automatically creates PIN codes for guests when they book a room, so hosts do not have to do it manually.
* **Task:** My job was to design the system to safely and automatically generate these PIN codes based on the guest's check-in and check-out times.
* **Action:** I designed a simple three-step system:
  1. **Data Sync:** I built a background service using AWS Lambda to fetch booking data from the Airbnb API and save it in our MongoDB database.
  2. **Time Rules:** I set up clear database indexes on check-in and check-out times so the system could easily find which bookings were active.
  3. **PIN Creation:** I integrated this with our smart lock system. When a new booking was saved, the system generated a secure, time-bound PIN code using a secure offline algorithm (like an OTP) and sent it to the guest's email automatically.
* **Result:** We finished this feature two weeks early. It automated key access for over 1,000 hosts and handled 4,000+ guest check-ins with 100% uptime and zero security issues.

---

## 🚀 Question 5: Improving Team Workflows (CI/CD Automation)
* **Goal:** Show your passion for making things better, faster, and more automated.

### Question:
*"Can you share a time you noticed an inefficiency in your team's workflow or system architecture and proactively took ownership to improve it? What was the outcome?"*

### Simple Answer (STAR):
* **Situation:** At Djoin.id, our deployment process was manual. Every time we had a bug fix, we had to SSH into the server, manually pull code, run database migrations, and restart the server. This took 30 minutes, caused human errors, and sometimes caused short downtimes during busy hours.
* **Task:** I wanted to automate this entire process to make it fast, safe, and reduce manual mistakes.
* **Action:** I took ownership of this problem. First, I containerized our services using Docker. Then, I set up an automated CI/CD pipeline using GitHub Actions. Now, when we push code to the repository:
  1. The pipeline automatically runs tests and checks the code quality.
  2. If tests pass, it automatically builds a Docker image and deploys it to AWS ECS.
  3. It does a "rolling update," meaning it starts new containers and stops old ones only after the new ones are healthy. This means zero downtime for our users.
* **Result:** We completely eliminated manual deployments. The deployment time went down from 30 minutes to under 5 minutes (an 83% speedup) with absolutely zero downtime. It made our team much faster and more confident in shipping updates.
