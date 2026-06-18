# 📦 Hour 3: Global State & Redux Toolkit (RTK)

## 1. Unidirectional Data Flow as an Architectural Paradigm

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

```typescript
// ❌ WRONG (Direct Mutation)
case 'ADD_CAMPAIGN':
  state.campaigns.push(action.payload); // Mutates array reference
  return state; // Shallow check sees state === state, skips UI render!
```

```typescript
//  CORRECT (Immutable copy)
case 'ADD_CAMPAIGN':
  return {
    ...state,
    campaigns: [...state.campaigns, action.payload] // Returns a brand new array reference
  };
```

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

## 📝 Hour 3: Mini-Quiz

### Q1: What happens if you run an asynchronous operation (e.g., `await fetch(...)`) directly inside a reducer in Redux Toolkit? Does RTK throw an error or does it run silently but corrupt state?

### Q2: In an enterprise dashboard with hundreds of state updates, how can we use Redux selectors (`useSelector`) efficiently to prevent a component from re-rendering unless the exact specific field it displays changes?
