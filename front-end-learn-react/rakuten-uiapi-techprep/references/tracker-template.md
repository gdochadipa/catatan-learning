# Tracker Template & Progress Check Format

This file defines the schema for `progress/tracker.md`, the living file that persists across
sessions. On first use of this skill, create `progress/tracker.md` using the structure below. On every
subsequent session, read it first, and update it at the end of any substantive session.

---

## `progress/tracker.md` Schema

```markdown
# Rakuten UI/API Prep — Progress Tracker

Last updated: <date>

## Confidence by Topic (1-5 scale, 1=just started, 5=interview-ready)

### P0 — React Fundamentals
- JSX / component model: <score> — <one-line note>
- useState / closures: <score>
- useEffect / dependency arrays: <score>
- useMemo / useCallback: <score>
- Custom hooks: <score>
- State management (Redux/Context/etc.): <score>
- Reconciliation / virtual DOM: <score>
- List rendering / keys: <score>

### P1 — Build Pipelines
- Bundler fundamentals: <score>
- Webpack-specific (loaders/plugins/code splitting): <score>

### P1 — DB Schema Design
- Normalization tradeoffs: <score>
- Indexing: <score>
- Access-pattern-driven design: <score>

### P1 — Frontend 2yr Narrative
- (flag: coordinate with rakuten-hr-interview skill — note status only, don't drill here)

### P2 — JWT/Auth
- JWT structure/verification: <score>

### P2 — Modern ECMAScript
- <score>

### Strengths (track briefly, mainly to confirm they stay sharp, not to re-teach)
- TypeScript: <score>
- Web API development (Go/Node/Lambda): <score>
- Vue / multi-framework adaptability: <score>
- Go: <score>

## Coding Interview Log

| Date | Problem | Mode (Coach/Strict) | Outcome | Notes |
|------|---------|---------------------|---------|-------|
| | | | | |

## System Design Session Log

| Date | Prompt | Notes (clarifying Qs asked? tradeoffs articulated? bridged to real exp?) |
|------|--------|---------------------------------------------------------------------------|
| | | |

## Open Weak Areas (running list, most recent first)

-

## Next Recommended Actions (max 3, refreshed each progress check)

1.
2.
3.
```

---

## Updating the Tracker

After a concept-learning session: update the relevant topic score (modest +0.5 to +1 bump if they
engaged well and answered check-yourself questions correctly; don't bump if they just read passively).

After a drill session: update scores per question performance — a clean correct answer can justify a
+1, a shaky/partial answer stays flat or +0.5, an incorrect answer that reveals a real gap should
actually *lower* the score if it was previously rated higher than the demonstrated reality, and gets
added to "Open Weak Areas."

After a coding interview (Coach or Strict): log in the Coding Interview Log table, and adjust relevant
topic scores based on what the problem actually exercised.

After a system design session: log in the System Design Session Log table.

Always refresh "Next Recommended Actions" at the end of a session — keep it to 3 max, prioritized by
the P0 > P1 > P2 ordering from jd-gap-map.md, unless the user has explicitly said they want to focus
elsewhere.

---

## Progress Check Output Format

When the user asks "check my progress" / "what should I study next" / "am I ready":

1. Read tracker.md in full.
2. Give a brief, honest summary — not falsely encouraging, not discouraging. Structure:
   - One line overall framing (e.g., "React fundamentals are still the main risk area; everything
     else is in reasonable shape.")
   - P0 status (React) — called out specifically since it's the highest-priority gap
   - P1 status (build pipelines, DB schema, frontend narrative) — brief
   - Strengths reminder (1-2 lines) — don't skip this, confidence matters for interview performance
     and these are real, earned strengths
   - The 3 next recommended actions from the tracker
3. Keep this conversational and concise — this is a status check, not a report. No headers/bullets
   needed unless the information genuinely benefits from them; a few honest sentences plus the
   3 next actions is usually enough.
4. If readiness genuinely looks strong across P0/P1, say so plainly — don't manufacture gaps to seem
   thorough.
