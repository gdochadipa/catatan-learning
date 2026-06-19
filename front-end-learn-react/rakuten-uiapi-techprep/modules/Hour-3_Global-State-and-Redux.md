# 📦 Hour 5 & 6: Global State & Redux Toolkit (Masterclass)

---

## 1. Unidirectional Data Flow & CQRS

Redux is built on the **Flux Architecture** (created by Facebook). It is a highly structured implementation of **CQRS (Command Query Responsibility Segregation)** at the client tier.

```
┌────────────────────────────────────────────────────────┐
│                      REDUX STORE                       │
│                                                        │
│  ┌───────────┐       ┌───────────┐       ┌──────────┐  │
│  │State Tree │ ───>  │    UI     │ ───>  │  Actions │  │
│  │ (Data)    │       │(Selectors)│       │(Dispatch)│  │
│  └───────────┘       └───────────┘       └────┬─────┘  │
│        ▲                                      │        │
│        │          ┌─────────────┐             │        │
│        └──────────┤   Reducers  │ <───────────┘        │
│                   │(Pure/Sync)  │                      │
│                   └─────────────┘                      │
└────────────────────────────────────────────────────────┘
```

### Why pick Redux for high-scale apps?
1. **Predictability:** State can only transition through dispatched actions.
2. **Traceability:** Time-travel debugging allows developers to record, pause, and replay every state transition.
3. **Decoupling:** Business logic is entirely separated from the React rendering layer.

---

## 2. Redux Pure Functions & Immutability

The fundamental rule of Redux: **Reducers must be pure functions.**

A pure function:
* Given the same inputs, always returns the same output.
* Has absolutely no side-effects (no API calls, no database writes, no mutating outer scope).

### The Immutability Bug
If a reducer mutates the state tree directly, React will **silently fail to re-render**.
React and Redux optimize performance using **shallow reference checking**:
```javascript
// Shallow check: is prevStoreState === nextStoreState?
```
If you mutate an array directly:
```typescript
// ❌ CRITICAL REDUX BUG
state.campaigns.push(action.payload); // Mutates original array reference
return state; // Redux sees state === state, and SKIPS re-rendering!
```
To fix this in vanilla Redux, you must write immutable updates, creating copies of references:
```typescript
return {
  ...state,
  campaigns: [...state.campaigns, action.payload] // Fresh array reference
};
```

### 🗣️ The Feynman Analogy: "The Bank Account Ledger"
* **Direct State Mutation (The Chaos Bank):** In a bad system, customers can walk behind the counter, open the safe, and erase their balance with a pencil to write a new one. This causes chaos—the bank loses track of who changed what, and there is no audit log.
* **Redux (The Strict Bank):** In Redux, you can never touch the money yourself. 
  1. **The Action:** You write your request on a slip of paper: `type: "WITHDRAW"`, `payload: 50`.
  2. **The Dispatch:** You hand the slip to the bank teller.
  3. **The Reducer:** The teller reads the slip, opens the master ledger book, and performs the math in a **new line** of the book. They never erase history.
  4. **The Store:** The master balance is updated, and the digital display on the screen updates for the customer.

---

## 3. Redux Toolkit (RTK) with Immer

To solve boilerplate and mutation safety, Redux built **Redux Toolkit (RTK)**.

RTK embeds **Immer.js**. When you write mutative-looking code inside an RTK slice, Immer automatically converts your mutations into clean, copy-on-write immutable outputs under the hood using ES6 Proxies.

```typescript
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export interface Campaign {
  id: string;
  name: string;
  status: 'active' | 'paused';
}

// 1. Defining Asynchronous Action Creator (Thunk)
export const fetchCampaigns = createAsyncThunk('campaigns/fetchAll', async () => {
  const response = await fetch('http://localhost:8080/api/campaigns');
  if (!response.ok) throw new Error('API delivery failed');
  return (await response.json()) as Campaign[];
});

// 2. Defining the State Slice
const campaignsSlice = createSlice({
  name: 'campaigns',
  initialState: {
    list: [] as Campaign[],
    loading: false,
    error: null as string | null
  },
  reducers: {
    // Immer intercept makes this mutative code 100% IMMUTABLE!
    toggleCampaign(state, action: PayloadAction<string>) {
      const camp = state.list.find(c => c.id === action.payload);
      if (camp) {
        camp.status = camp.status === 'active' ? 'paused' : 'active';
      }
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaigns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaigns.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchCampaigns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Unknown network error';
      });
  }
});

export const { toggleCampaign } = campaignsSlice.actions;
export default campaignsSlice.reducer;
```

---

## 4. Why Reducers Must Be Pure: Feynman Analogy

### Analogy: "The Blueprint Maker"
Imagine a Reducer is a machine that prints architectural blueprints.
* **Pure Reducer:** If you feed it the blueprint of House A and the instruction "add a chimney," it consistently spits out a new blueprint of House A with a chimney. It never changes the original House A blueprint.
* **Impure Reducer (Network calls/Randomness):** If you feed it a blueprint, and inside the machine it runs a wire to the outside world to check the weather, or generates a random house layout, the blueprints become unpredictable. You can never reliably reproduce the blueprint history or debug issues.

---

## 📝 Hours 5 & 6: Mini-Quiz

### Q1: What happens if you run an asynchronous operation (e.g., `await fetch(...)`) directly inside a reducer in Redux Toolkit? Does RTK throw an error or does it run silently but corrupt state?

### Q2: In an enterprise dashboard with hundreds of state updates, how can we use Redux selectors (`useSelector`) efficiently to prevent a component from re-rendering unless the exact specific field it displays changes?
