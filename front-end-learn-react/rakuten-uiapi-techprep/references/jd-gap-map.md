# JD ↔ CV Gap Map

Source JD: Software Development Engineer (UI/API), Advertisement Delivery Platform — Global Ad
Technology Supervisory Department (GATD), Rakuten, Tokyo.

This is the spine of the whole skill. Every drill, quiz, and design prompt should trace back to a row
here. Priority = how much study time it deserves relative to current evidence in the CV.

---

## Role Shape (read once, keep in mind)

This is **not** a generic full-stack role. It's a frontend-leaning UI engineer role embedded in an
ad-tech platform team: "developing and implementing UI components of the Ad Platform Dashboard,"
"profiling and improving front-end performance," "documenting the front-end codebase," plus "API
development to connect backend systems." The center of gravity is React + TypeScript + API
integration, with DB schema design and Go as supporting/bonus skills. Ocha's CV is the mirror image:
strong backend/API/Go/AWS, light/absent on React specifically, no explicit frontend-performance or
build-pipeline story despite having genuine frontend history (Vue, vanilla JS/CSS).

---

## Mandatory Qualifications

| JD Requirement | CV Evidence | Gap Severity | Priority | Notes |
|---|---|---|---|---|
| Bachelor's in CS/IT or similar | BSc Information Technology, Udayana University, GPA 3.82/4.00 | None | — | Fully covered, no prep needed |
| Practical React experience | None found — CV shows Vue.js (Marketplace site), React only in a small personal Tic-Tac-Toe/minimax project (2024) | **High** | **P0** | The single biggest gap. Tic-Tac-Toe project is real but small — needs to become a credible talking point AND needs genuine fundamentals depth to survive technical probing |
| Practical TypeScript experience | Strong — Igloo Company core service, listed as primary skill | None | — | Genuine strength, use as a bridge ("TS is the constant, framework is the variable") |
| 2+ years as Frontend Engineer | ~1y10m frontend-titled (Solusi Anak Sakti, Aug 2020–Jun 2022) + frontend-adjacent work since (Vue marketplace, recent Vue/Astro projects per work history) | **Medium** | P1 | Technically close to 2 years in title, but frontend specifically (not full-stack) needs a clean narrative; don't let this read as "mostly backend now" |
| UI and Backend API integration | Strong — Doku payment gateway REST integration from Vue frontend, AWS Lambda/API Gateway work, Cognito auth flows | Low | P2 | Good evidence exists; mainly needs framing for interview, not new learning |
| Familiarity with build pipelines/tools (webpack) | Not explicit in CV; recent frontend projects use Astro/Vite, not webpack specifically | **Medium** | **P1** | Vite knowledge transfers conceptually but webpack-specific config/loaders/plugins terminology should be reviewed directly since it's named explicitly in the JD |
| Translate business requirements → technical requirements | Implicit throughout (banking system, billing infra) but not explicitly demonstrated as a discrete skill | Low | P2 | More of a behavioral/STAR topic — flag for the rakuten-hr-interview skill rather than drilling here |
| Strong problem-solving, attention to detail | Implicit | None | — | Demonstrate via coding interview performance, not separate study |
| Experience developing Web APIs | Strong — Lambda, API Gateway, SAM, event-driven services (EventBridge/SQS), Go + TS backends | None | — | Genuine strength; use as anchor/confidence point in interviews |
| Design Database schema | MongoDB, MySQL, PostgreSQL listed; banking system + billing infra strongly imply schema work, but no explicit "I designed this schema" narrative on CV | **Medium** | **P1** | Needs an explicit schema-design story extracted from existing project experience (loan account reports, billing infra) — likely already did this work, just hasn't framed it as such |

---

## Desired Qualifications

| JD Requirement | CV Evidence | Gap Severity | Priority | Notes |
|---|---|---|---|---|
| React workflows (Hooks, Flux, Redux) | Minimal — Tic-Tac-Toe project likely uses basic hooks at most | **High** | **P0** | Same bucket as core React gap; Hooks specifically (useState/useEffect/useMemo/useCallback/custom hooks) plus state management concepts (Redux or modern alternatives like Zustand/Context) |
| JWT / modern authorization | AWS Cognito experience (auth flows, OTP, session mgmt) is adjacent but not JWT-specific by name | **Low-Medium** | P2 | Cognito under the hood issues JWTs — this is mostly a reframing exercise (Cognito tokens ARE JWTs) plus a light review of JWT structure/claims/verification for precision in technical answers |
| Other frontend frameworks (Vue, Angular) | Strong — Vue.js explicitly, multiple projects | None | — | This is a genuine advantage, not a gap; use it as a transferable-skills story, not a crutch |
| Familiarity with Golang | Strong — Go is core stack at Igloo Company | None | — | Strength; differentiator versus typical frontend-only candidates |
| Modern ECMAScript specs | Implicit via TS/JS work, not explicit | Low | P2 | Quick review of newer syntax (optional chaining, nullish coalescing, top-level await, etc.) — low risk area |
| Basic web design skills | GD/image pipeline work (photo booth feature) and HTML5/CSS3 from early Vue project shows some visual/design-adjacent work | Low | P2 | Not a major interview focus area typically; light touch only |
| Practical experience in DB design | Same as schema design above | Medium | P1 | Same prep as schema design row above |
| Japanese language skill | Not in CV | Unknown/Out of scope | — | Outside this skill's scope (not a coding/technical-concept gap) — do not drill language here |

---

## Priority Summary (use this to decide what to cover absent other signal)

1. **P0 — React fundamentals + Hooks + state management.** The load-bearing gap. Drill this most,
   most often. Don't let comfort with Vue/Go/AWS crowd this out.
2. **P1 — Three supporting gaps, roughly equal weight:**
   - Build pipelines/webpack terminology and concepts
   - DB schema design — extracting and articulating real schema decisions from past projects
   - Frontend-specific 2-year narrative (more behavioral-flavored; coordinate with rakuten-hr-interview)
3. **P2 — Light-touch items:** JWT/Cognito reframing, modern ECMAScript, business-requirements
   translation (mostly behavioral), basic web design.
4. **Strengths to actively leverage, not just "no gap":** TypeScript, Web API development (Go/Node/
   Lambda), Vue/multi-framework adaptability, Go, UI-backend integration experience. These should
   show up as confident anchor points the user pivots to when a question allows it.

## Domain Flavor (for system/API design prompts — not real Rakuten internals)

JD mentions these systems explicitly — use as believable context for design exercises:
DSP (Demand-Side Platform), DMP (Data Management Platform), Data feed, Tracking and reporting, Pixel
tag, Listing ads, Display ads, Video ads, Google Shopping ads. Treat these as the "flavor" of plausible
take-home-style design questions, never as confirmed facts about Rakuten's actual implementation.
