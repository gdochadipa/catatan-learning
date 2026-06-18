# Technical Drill Bank

Used for "quiz me", "drill me on X", "rapid fire" requests. Organized by priority tier from
jd-gap-map.md. Pull questions appropriate to stated focus; don't dump the whole bank at once — 4-6
questions per drill session is typical unless the user asks for more.

For each question: ask it, wait for the answer, give direct feedback (correct/partially
correct/incorrect + why), then move on. Don't pre-explain the answer. After the drill, summarize
which were solid vs shaky and update tracker.md accordingly.

---

## Tier P0 — React Fundamentals & Hooks

1. What's the difference between state and props in React, and why does that distinction matter for
   how a component re-renders?
2. You have `const [count, setCount] = useState(0)`. Inside a `setTimeout` callback you call
   `setCount(count + 1)` three times. What value does count end up as, and why? (Tests closure/stale
   state understanding)
3. Explain the dependency array in `useEffect`. What happens if you omit it entirely vs pass `[]` vs
   pass `[someValue]`?
4. Write (verbally or in a code snippet) a custom hook `useDebounce` that debounces a value. What's it
   for and why would you reach for a custom hook instead of duplicating logic?
5. What are the "Rules of Hooks" and why do they exist (what would break if you called a hook
   conditionally)?
6. When would you use `useMemo` vs `useCallback`? Give a concrete scenario where skipping both would
   cause a real performance problem, and one where adding them would be premature optimization.
7. What's prop drilling, and what are two different ways to solve it (one library-free, one with a
   state management tool)?
8. In Redux (or describe the general Flux pattern if more comfortable there): what's a reducer, why
   must it be a pure function, and what breaks if it isn't?
9. Explain reconciliation/the virtual DOM at a level you'd use in an interview — what problem is React
   actually solving by diffing instead of re-rendering the real DOM directly?
10. Why does a list rendered with `.map()` need a stable `key` prop, and what specifically goes wrong
    if you use the array index as the key when the list can reorder?
11. Compare: how would you express "run this code whenever `userId` changes" in React vs how you'd do
    the equivalent in Vue (since Ocha knows Vue well — use this as a calibration question to confirm
    real understanding, not Vue-flavored guessing).

## Tier P1 — Build Pipelines / Webpack

1. What does a bundler fundamentally do that a browser couldn't already do on its own with plain
   `<script>` tags?
2. What's the difference between a webpack "loader" and a "plugin"? Give one example of each.
3. What's tree-shaking, and what's required of your code (or config) for it to actually work?
4. Ocha has used Vite — ask: what's the core architectural difference between how Vite's dev server
   works versus webpack's dev server, and why does Vite tend to feel faster in dev?
5. What's code splitting, and why would you want it for a dashboard-style app (relevant to "Ad
   Platform Dashboard" from the JD) with multiple distinct views/routes?

## Tier P1 — DB Schema Design

1. You're designing a schema to track ad impressions and clicks at high volume. Would you normalize
   this data or denormalize it, and why? What are you trading off?
2. What makes a database index actually speed up a query, and what's the cost of having too many
   indexes on a write-heavy table (relevant given ad tracking is write-heavy)?
3. Ocha worked on loan account report queries at Djoin.id and optimized response time by 20% — ask
   him to reconstruct (without looking it up) what kinds of changes typically produce that kind of
   improvement (indexing, query restructuring, denormalization, caching) so he has a concrete,
   defensible technical story ready.
4. In a composite index on `(advertiser_id, campaign_id, date)`, what queries can use this index
   efficiently, and which ones can't (test understanding of leftmost-prefix rule)?
5. When would MongoDB's document model be a better fit than a relational schema for a given dataset,
   and when does it become a liability? Ask Ocha to ground this in his own MongoDB experience at
   Igloo Company.

## Tier P2 — JWT / Auth

1. What are the three parts of a JWT, and which parts (if any) are encrypted vs just encoded?
2. If a JWT is "stateless," how does a server actually invalidate one before its expiry? What are the
   common real-world workarounds?
3. Cognito issues JWTs under the hood — ask Ocha to explain, from his own Cognito work, what's actually
   happening when a client verifies a token's signature (JWKS, public/private key signing).

## Tier P2 — Modern ECMAScript

1. What does optional chaining (`?.`) actually do under the hood, and how is it different from a
   manual `&&` chain?
2. What's the difference between `??` (nullish coalescing) and `||`? Give an example where they
   produce different results.
3. What problem do `Promise.allSettled` and `Promise.all` each solve, and when would picking the wrong
   one cause a bug?

## Strengths — Confidence/Calibration Checks (use sparingly, mainly to build confidence before a hard
## session, or to confirm depth behind a CV bullet)

1. Walk through, in interview-answer form, how AWS EventBridge and SQS work together in an
   event-driven system, using the Igloo Company billing infra as the concrete example.
2. Explain how you'd design idempotency into a Stripe webhook handler — ground this in the actual
   billing integration on the CV.
3. What's the tradeoff between Lambda response streaming and a traditional request/response Lambda,
   and why would you reach for streaming?
