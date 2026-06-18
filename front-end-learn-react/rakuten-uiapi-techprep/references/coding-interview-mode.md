# Coding Interview Mode

This skill always asks, per session, whether the user wants **Coach** or **Strict** mode for any
coding-interview practice — never assume, since preference varies session to session. If unstated,
ask directly: "Coach or Strict for this one?"

Problems should be calibrated to a **frontend/UI-API role**, not generic LeetCode-style backend DSA
(Ocha already has a separate 100-question LeetCode + 9-module DSA track in progress for general
interview prep — this skill's coding section should be more specific to what THIS role actually
tests: component logic, state/data transformation in a UI context, API integration code, and
occasional light algorithmic problems with a frontend flavor). Cross-reference but don't duplicate his
general DSA grind.

---

## Coach Mode Protocol

Goal: build real understanding, not just get to a working answer.

1. Present the problem clearly, with constraints, but do NOT give away the approach.
2. Ask the user to think out loud or propose an approach first.
3. If they're stuck or off-track: ask a leading question rather than stating the fix
   ("what happens to your component if this prop changes but your effect's dependency array doesn't
   include it?" rather than "you're missing a dependency").
4. Allow up to 2 Socratic nudges before offering to "just explain" — if the user explicitly says
   "just tell me" or "give me a hint," honor that immediately, no need to force more struggle than
   they want.
5. Once they land on or are given the approach, have them write the actual code (or pseudocode if
   verbal). Review it together — point out edge cases, not just syntax.
6. Close with the underlying principle generalized — what category of problem is this, where else
   would this pattern show up.

## Strict Mode Protocol

Goal: simulate real interview pressure and get an honest signal on current readiness.

1. State the time box upfront (suggest 20-25 min for a UI/component problem, 30-40 min for a small
   system/API design problem) and stick to it — call time when it's up.
2. Present the problem once, answer clarifying questions only if asked (real interviewers do answer
   clarifying questions — don't be artificially withholding about requirements, just don't help with
   the solution).
3. No proactive hints. If the user asks for a hint, give a minimal one and note internally that a
   hint was used (factor into end-of-session feedback — this isn't a penalty system with point
   deductions, just be honest in the summary that hints were needed).
4. Don't validate or comment on partial code while they're working unless they explicitly pause and
   ask "is this on the right track" — then give a real but brief answer and let them continue.
5. At time-up or completion, switch out of strict persona and give direct, structured feedback:
   - Correctness (did it work, what edge cases were missed)
   - Communication (did they narrate their thinking — this matters a lot in real interviews)
   - Code quality/idioms (especially React-specific idioms if applicable)
   - Time management
   - One concrete thing to do differently next time
6. Log the result in tracker.md (problem, mode, outcome, date).

---

## Problem Set

### UI/Component Logic (React-flavored — core focus given the gap)

1. **Controlled search input with debounce**: Build a search box that calls an API only after the
   user stops typing for 300ms. (Tests: useState, useEffect, debounce, cleanup function correctness)
2. **Paginated/infinite-scroll list**: Given a mock API that returns pages of ad campaign data (tie to
   GATD's domain), implement a component that loads more on scroll. (Tests: state management,
   useEffect for side effects, avoiding duplicate fetches, loading states)
3. **Sortable, filterable table**: Given a flat array of objects (e.g., ad campaigns with
   impressions/clicks/ctr), build a table that can sort by column and filter by a text query. (Tests:
   derived state vs stored state, useMemo for expensive computation, controlled inputs)
4. **Form with validation**: Build a form (e.g., campaign creation) with at least 3 fields and
   validation that shows inline errors, disabling submit until valid. (Tests: controlled form state,
   validation patterns, UX-aware error handling)
5. **Custom hook extraction**: Given a component with duplicated data-fetching logic across 2+
   components, extract a reusable `useFetch` or `useApi` hook. (Tests: custom hook design, handling
   loading/error/data states cleanly)
6. **Optimizing a re-render problem**: Given a (described or sketched) component tree where a parent
   state change is causing an expensive child to re-render unnecessarily, diagnose and fix it.
   (Tests: React.memo, useCallback, understanding what actually triggers re-renders)

### API Integration / Data Transformation

7. **Normalize a nested API response**: Given a nested JSON response (e.g., campaigns → ad groups →
   ads, mirroring a real ad-platform hierarchy), write a function to flatten/normalize it into a
   shape convenient for table rendering or for a normalized store (Redux-style entities table).
8. **Build a typed API client function**: Given an endpoint shape, write a TypeScript function with
   proper typing for the request/response, including error handling for non-2xx responses.
9. **Retry logic with backoff**: Write a fetch wrapper that retries on failure with exponential
   backoff, capped at N attempts. (Tests: async/await control flow, real-world API resilience
   thinking — relevant given his Lambda/event-driven background, a good strength bridge)

### Light Algorithmic (frontend-flavored, not deep DSA — that's covered elsewhere)

10. **Group/aggregate data for a chart**: Given a flat array of daily ad spend records, write a
    function to aggregate into weekly or monthly totals for charting on the dashboard.
11. **Diff two lists for an update**: Given an old and new list of campaign IDs, compute which were
    added, removed, and which stayed (a simplified version of what reconciliation does conceptually —
    nice bridge back to the virtual DOM concept).

### Small System/API Design (lighter-weight than full system-design-bank.md prompts — use these for
### shorter coding-interview-style sessions; use system-design-bank.md for deeper design discussions)

12. Design the API endpoint(s) and basic schema for a feature that lets a user save a custom filtered
    view of the Ad Platform Dashboard (ties directly to the JD's actual product surface).
