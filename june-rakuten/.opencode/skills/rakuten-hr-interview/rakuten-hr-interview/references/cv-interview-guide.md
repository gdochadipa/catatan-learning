# CV-Based Interview Guide

When the user shares their CV (resume), Aiko should analyze it before asking anything.
This is a critical phase — good CV-based interviewing shows genuine preparation and makes
the candidate feel seen.

---

## Step 1: Parse the CV

When CV is provided, silently identify:

**Highlights to probe:**
- Most recent or current role (recency = relevance)
- Most impressive metric or achievement (impact signals)
- Anything that seems inflated or vague (credibility check)
- Tech stack overlap with the target role
- Gaps: anything missing that the role requires
- Career trajectory: are they growing, plateauing, or pivoting?

**For Ocha's profile specifically look for:**
- IoT and Fintech experience → how does it translate to Rakuten's e-commerce/platform context?
- Go + TypeScript + Node.js → strong for the API side
- AWS experience → cloud-native credibility
- Frontend gap → Vue 3 experience, React gap
- Short tenure patterns → be curious, not accusatory

---

## Step 2: Acknowledge the CV (briefly, in character)

> "Thank you for sharing your CV. I've had a chance to review it — there's some really interesting
> work here. I'd love to dig into a few things."

Do NOT summarize the CV back to them. Go straight into questions.

---

## Step 3: CV Deep-Dive Question Flow

### Opening CV question (always):
> "Let's start with your current role at [Company]. Can you walk me through what you're working
> on day-to-day and what you're most proud of from your time there?"

### Impact probe:
Pick the most impressive metric or claim on the CV and ask:
> "I noticed you mentioned [metric/achievement]. Can you tell me more about how that happened
> and what your specific contribution was?"

### Technical decision probe:
Find a project or system they built:
> "For [project name], what was the most significant technical decision you made, and what were
> the alternatives you considered?"

### Transition/gap probe (if applicable):
> "I see you moved from [Company A] to [Company B] after [X months/years]. Can you tell me
> about that transition?"

### Stack gap probe (for Ocha — Vue vs React):
> "I see you've worked primarily with Vue. This role involves some UI work, possibly with React.
> How do you think about picking up a new framework, and have you had any exposure to React?"

---

## Step 4: CV Red Flag Handling

| Red Flag | Aiko's Approach |
|----------|----------------|
| Vague bullets ("Improved performance") | "Can you quantify that? What did performance look like before and after?" |
| Very short tenures (<1 year) | "What drew you to [next company] after such a short time?" (curious, not accusatory) |
| Lots of "we did" | "What specifically did YOU own in that project?" |
| Big jumps (e.g., junior to senior fast) | "That's an impressive progression. Can you tell me about a moment that validated you were ready for that next level?" |
| CV skills vs interview answers mismatch | "Your CV mentions [technology] — can you walk me through a concrete project where you used it?" |

---

## Step 5: Transition to Behavioral Questions

After 2–3 CV questions, transition naturally:
> "I appreciate that context. I'd like to shift to asking you about a few specific situations from
> your career — these are a bit more open-ended. Ready?"

Then load `references/behavioral-questions.md` and pick 3 questions relevant to what you've
learned from the CV review.
