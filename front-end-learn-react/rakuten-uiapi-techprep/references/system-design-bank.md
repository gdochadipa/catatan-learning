# System / API / DB Design Bank

For deeper, open-ended design conversations (20-40+ min), distinct from the lighter design prompt in
coding-interview-mode.md. Use GATD's named domain systems (DSP, DMP, data feed, tracking/reporting,
pixel tag, listing/display/video/shopping ads) as plausible flavor — always frame as "a reasonable
design exercise in this space," never as a claim about Rakuten's real architecture.

Run these as a conversation, not a quiz: present the prompt, let the user drive the design, ask
probing questions a real interviewer would ask (scale, failure modes, tradeoffs), and don't supply the
"correct" architecture — there often isn't a single one. Close with feedback on structure of their
reasoning, not just the final diagram.

---

## Prompt 1: Ad Impression Tracking Pixel

"Design a system that receives a 'pixel fire' (a tiny tracking request) every time an ad is displayed
to a user, at a scale of tens of millions of events per day, and makes that data available for
reporting within a few minutes."

Probe areas: ingestion (what receives the pixel hit — a lightweight endpoint, what's the response
time budget), how to avoid the tracking endpoint becoming a bottleneck (async processing, queue),
storage shape (time-series friendly schema, write-heavy optimization), how "available within a few
minutes" shapes the architecture (streaming vs micro-batch), and how this connects to his actual
EventBridge/SQS experience — push him to map this prompt onto patterns he's already used.

## Prompt 2: Ad Platform Dashboard — Saved Custom Views

"Users of the Ad Platform Dashboard want to save a custom filtered/sorted view (e.g., 'my underperforming
campaigns this week') and have it persist across sessions and be shareable with teammates."

Probe areas: DB schema for a saved view (what needs to be stored — filter criteria as structured data
or a serialized query?), API shape (REST endpoints: list/create/update/delete views, plus how the
dashboard applies a saved view to live data), versioning if the underlying data shape changes, and
permission/sharing model.

## Prompt 3: DSP/DMP Data Sync

"Design a way to periodically sync audience segment data from an external DMP into your own platform
so campaigns can target those segments."

Probe areas: pull vs push integration, handling partial failures/retries, data freshness requirements,
schema for representing external segments alongside internal ones, idempotency on repeated syncs
(good bridge to his Stripe webhook idempotency experience).

## Prompt 4: Front-End Performance Audit (less "design," more diagnostic — ties directly to JD's
## explicit "profiling and improving front-end performance" line)

"The Ad Platform Dashboard has gotten slow to load and feels sluggish when filtering a large campaign
table. Walk me through how you'd actually diagnose this, then how you'd fix what you find."

Probe areas: what tools/techniques to profile with (browser devtools performance tab, React DevTools
profiler, bundle analysis), distinguishing load-time problems (bundle size, code splitting, lazy
loading) from runtime problems (unnecessary re-renders, expensive computation on every render,
virtualization for large lists), and how they'd verify the fix actually helped (metrics, before/after).
This prompt has no "trick" — it's testing whether the candidate has a real diagnostic process, which
directly maps to a line in the JD, so it deserves real practice time even though it's not a classic
"design" question.

## Prompt 5: DB Schema — Ad Campaign Hierarchy

"Design the database schema for: Advertiser → Campaign → Ad Group → Ad, where each level can have its
own budget and targeting settings, and you need to efficiently roll up spend/performance metrics from
Ad level up to Advertiser level for reporting."

Probe areas: relational vs document modeling for this hierarchy (good chance to compare against his
MongoDB experience explicitly), how rollup aggregation is computed (real-time query vs precomputed/
materialized rollups — tie to his loan-account-report optimization experience at Djoin.id), indexing
strategy for the reporting access pattern specifically (not just the write path).

---

## How to Score These (for tracker.md notes)

Not pass/fail — note on a few dimensions: did they ask clarifying questions before diving in, did they
consider scale/failure modes without being prompted, did they articulate at least one real tradeoff
(not just describe "a" solution), and did they connect the problem to relevant real experience when a
natural bridge existed. These map closely to what real interviewers actually evaluate in system design
rounds.
