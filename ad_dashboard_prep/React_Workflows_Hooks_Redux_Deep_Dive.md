# Masterclass Deep-Dive: React Workflows (Hooks, Flux, and Redux)

Welcome to your comprehensive training guide focusing on the core requirement: **"Experience with popular React workflows (such as Hooks, Flux or Redux)"**.

---

# 🚀 SECTION 0: Advanced Engineering Blueprint: React & Redux Internals

To pass a high-bar senior or principal engineer interview, you must be prepared to articulate the low-level data structures, algorithmic complexities, and memory management patterns executing under React and Redux workflows. This section details these core internals.

---

## 1. Deep Dive: The `FiberNode` Data Structure

React's Virtual DOM is represented as a tree of **Fiber Nodes**. A Fiber is a plain JavaScript object representing a unit of work. Below is the exact logical schema of a `FiberNode` struct:

```typescript
interface FiberNode {
  // 1. Identification and Work Tags
  tag: WorkTag;              // Type of component (FunctionComponent, ClassComponent, HostComponent/DOM node)
  key: null | string;        // Unique identifier for element reconciliation
  type: any;                 // The actual function or class reference (e.g. App, () => JSX)
  elementType: any;          // Resolved element type

  // 2. State and DOM Node References
  stateNode: any;            // Reference to the physical browser DOM element (or class instance)
  memoizedState: any;        // Singly linked list of hook states (useState, useMemo, etc.)
  updateQueue: any;          // Queue of pending state updates to be processed during render

  // 3. Singly Linked Tree Traversal Links
  child: FiberNode | null;   // Reference to the first child component
  sibling: FiberNode | null; // Reference to the immediate sibling component
  return: FiberNode | null;  // Reference to the parent component (return address)

  // 4. Concurrency and Priority Lanes (React 18)
  lanes: Lanes;              // 32-bit bitmask representing the update priority of this node
  childLanes: Lanes;         // Priority lanes of the children, used to skip tree traversals

  // 5. Double-Buffering Link
  alternate: FiberNode | null; // Pointer to the counterpart node in the opposing tree
}
```

### The Singly Linked Tree Traversal Pattern
Unlike a standard DOM tree where parent nodes maintain an array of children (`children[]`), the Fiber tree uses a **singly linked list representation** to optimize memory traversal:
*   `child` points exclusively to the first child.
*   The first child links to its next sibling via `sibling`.
*   All children point back to their parent via `return`.
This allows the React scheduler to pause and resume tree traversal at any node at any time without maintaining a heavy recursion stack on the JS main thread.

---

## 2. The Double-Buffering Strategy

To avoid visual flickering and half-rendered UI screens during heavy updates, React implements a graphics-derived **Double-Buffering Strategy**:

```
 [ Current Tree ] (Drawn on screen) <──────┐
       │ (alternate pointer)               │ (Synchronous pointer flip on commit)
       ▼                                   │
 [ WorkInProgress Tree ] (Assembled async) ─┘
```

1.  **The `current` Tree:** Represents the Fiber nodes currently mapped to visible nodes on the browser screen.
2.  **The `workInProgress` (WIP) Tree:** Created during an update. React clones the `current` tree nodes asynchronously in the background. All computations, hook updates, and diffs are applied to this WIP tree.
3.  **The Pointer Flip:** Once the Render phase completes and the WIP tree is fully assembled, React flips the top-level pointer synchronously during the **Commit Phase**. The WIP tree instantly becomes the `current` tree, and updates are committed to the DOM in a single flush.

---

## 3. Heuristic $O(n)$ Reconciliation Rules

Diffing two arbitrary trees has a theoretical complexity of $O(n^3)$ (which is far too slow for real-time browsers). React achieves a near-linear **$O(n)$ complexity** by enforcing two heuristic assumptions:

1.  **Different Element Types Produce Different Trees:** If an element's type changes (e.g., from `<div>` to `<span>`), React destroys the old Fiber node and all of its descendants completely, mounting the new element from scratch.
2.  **Keys Ensure Node Identity Cache Lookups:** When diffing arrays of children, React uses the `key` prop as a unique map lookup index. 
    *   *Without keys:* React diffs items position-by-position. If you insert an item at the beginning of an array, React will think *every single item* has changed, tearing down and re-rendering the entire list.
    *   *With keys:* React maps keys to previous Fiber nodes. It detects that existing elements simply changed positions, moving the DOM nodes without running expensive unmount-and-mount cycles.

---

## 4. The Lanes Priority System (React 18)

In React 18, rendering is prioritized using a 32-bit bitmask system called **Lanes**. This replaces the older expiration-time scheduler.

```
00000000000000000000000000000001 (SyncLane - User keystroke)
00000000000000000000000000000010 (InputContinuousLane - Hover/Scroll)
00000000000000000000000000001100 (DefaultLane - API Fetch / standard state)
00000000000000000000000110000000 (TransitionLane - useTransition, useDeferredValue)
```

*   **Priority Interruption:** If a low-priority render (e.g., generating a heavy campaign PDF chart inside `TransitionLane`) is running, and the user suddenly types into an input field (`SyncLane`), React pauses the active WIP tree render immediately, processes the keystroke update, flushes it to the screen, and then resumes the background chart calculation.

---

## 5. Coding a Redux Store from Scratch

To demonstrate absolute mastery of Flux state management, you must understand how a Redux store handles dispatching, state updates, and component subscriptions underneath.

### Pure JavaScript Redux Implementation
Below is a complete, fully-functional custom implementation of a Redux store including middleware chaining capability:

```javascript
// A custom createStore implementation matching Redux APIs
export function customCreateStore(reducer, preloadedState, enhancer) {
  // If an enhancer (like middleware) is provided, delegate store creation
  if (enhancer) {
    return enhancer(customCreateStore)(reducer, preloadedState);
  }

  let currentState = preloadedState;
  let currentListeners = [];
  let isDispatching = false;

  // 1. Read State
  function getState() {
    if (isDispatching) {
      throw new Error("Cannot query state while a reducer is executing.");
    }
    return currentState;
  }

  // 2. Subscribe Component Listeners
  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new Error("Expected listener to be a function.");
    }
    
    let isSubscribed = true;
    currentListeners.push(listener);

    // Return un-subscribe callback function
    return function unsubscribe() {
      if (!isSubscribed) return;
      isSubscribed = false;
      const index = currentListeners.indexOf(listener);
      currentListeners.splice(index, 1);
    };
  }

  // 3. Dispatch Actions
  function dispatch(action) {
    if (typeof action.type === "undefined") {
      throw new Error("Actions must contain a defined 'type' attribute.");
    }
    if (isDispatching) {
      throw new Error("Reducers may not dispatch actions.");
    }

    try {
      isDispatching = true;
      // Reducer computes new state based on action
      currentState = reducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    // Notify all active subscribers
    const listeners = currentListeners;
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }

    return action;
  }

  // Initialize store state
  dispatch({ type: "@@redux/INIT" });

  return {
    getState,
    subscribe,
    dispatch
  };
}

// 4. Custom Middleware Enhancer Chainer
export const customApplyMiddleware = (...middlewares) => {
  return (createStore) => (reducer, preloadedState) => {
    const store = createStore(reducer, preloadedState);
    let dispatch = () => {
      throw new Error("Dispatching while constructing middleware is forbidden.");
    };

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args)
    };

    // Chain middlewares sequentially
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    
    // Curried composition: compose(f, g)(dispatch) => f(g(dispatch))
    dispatch = chain.reduce((a, b) => (...args) => a(b(...args)))(store.dispatch);

    return {
      ...store,
      dispatch
    };
  };
};
```

---

## 6. Immer.js Mechanics: Copy-on-Write Proxies

Redux Toolkit uses **Immer** to let you write "mutable" code safely. But how does Immer prevent state mutations under the hood?

### The ES6 Proxy Wrapper
When you write code inside an RTK slice:
```typescript
state.items.push(newItem);
```
Immer does **not** push directly to your state. It wraps your state inside a native JavaScript **`Proxy`** object.
1.  **The Draft Object:** Immer generates a lightweight temporary tree called `draft`.
2.  **Trap Getters & Setters:** When you access properties, the Proxy intercepts your actions.
3.  **Copy-On-Write (COW):** If you only *read* a property, Immer returns the original node directly. The moment you *write* or modify a property, the Proxy detects the mutation, clones that specific object node (shallow copy), and applies your mutation to the newly created copy.
4.  **Finalization:** Once the reducer terminates, Immer walks the Proxy draft tree, joins the newly cloned copies with the untouched branches of the original state, and outputs a pristine, fully immutable new state tree.

```
Original State ──► Proxy Interceptor (Draft) ──► Mutate Node B ──► Creates Copy of Node B ──► Output New State
 [ A, B, C ]                                                        [ A, B_copy, C ]
```

---

# 📅 DAY 1: React Fiber Lifecycle, Closures, and the Big 5 Hooks

---

## 1. Under the Hood: The React Fiber Reconciler

---

## 1. Under the Hood: The React Fiber Reconciler

To debug and optimize complex dashboard screens, you must look past the syntax of Hooks and understand how React executes them in its compilation tree.

### The Render Phase vs. The Commit Phase
React updates the UI in two distinct phases:
1.  **Render Phase:**
    *   **What happens:** React traverses the component tree, calls your component functions, and generates the Virtual DOM representation.
    *   **Reconciliation (Fiber):** React compares the new Virtual DOM tree with the old one using a diffing algorithm. It schedules updates on individual nodes called "Fibers."
    *   **Peculiarity:** This phase is completely **asynchronous** and **non-blocking**. React can pause, discard, or resume rendering Fiber nodes if more urgent tasks (like user input) occupy the main thread. Therefore, component functions must be **pure**—free of side effects (no API fetching, no timers inside the function body itself).
2.  **Commit Phase:**
    *   **What happens:** React takes the list of updates computed in the Render phase and applies them directly to the real browser DOM (using functions like `appendChild` or `setAttribute`).
    *   **Peculiarity:** This phase is **synchronous** and **blocking**. Once it starts, React must finish rendering all DOM mutations to ensure visual consistency.

### How React Tracks Hooks
How does React know which state belongs to which `useState` hook when you don't pass an ID?
*   **The Linked List:** Under the hood, each Fiber node has a property called `memoizedState`. This is a singly linked list containing all hook states used by that component.
*   **Sequential Traversal:** On every render, React reads this linked list from top to bottom. It assumes that hooks will be called in the **exact same order** on every render.

```
Fiber Node (memoizedState)
     │
     ▼
[ Hook 1: useState ] ──(next)──► [ Hook 2: useEffect ] ──(next)──► [ Hook 3: useMemo ]
  State: 10                       Deps: [id]                         Cache: filteredArr
```

#### Why You Cannot Put Hooks Inside Conditionals or Loops
If a hook is wrapped inside an `if` statement:
```tsx
// ❌ CRITICAL ANTI-PATTERN
if (condition) {
  useState(0);
}
```
If the condition changes to `false` during a render, React skips that hook call. This shifts the index of every subsequent hook in the linked list, mapping states to the wrong hooks and causing silent bugs or full component crashes.

---

## 2. JavaScript Closures and the Stale Closure Trap

The single biggest source of bugs for developers transitioning into mid-to-senior React roles is the **Stale Closure**.

### What is a Closure?
In JavaScript, a closure is created when a nested function retains access to variables declared in its outer lexical scope, even after the outer function has finished executing.

### The Stale Closure in React
React functional components are JavaScript functions that re-run on every state change. Every render has its own variables, props, and hooks enclosed in its scope.

If a callback function (such as a timeout or a click listener) is created during render $N$, it closes over the state values of render $N$. If that callback executes at a later time (e.g., inside a timeout) without being re-declared, it will read the outdated values from render $N$, completely oblivious to any state changes that occurred in renders $N+1$, $N+2$, etc.

#### Spotting the Stale Closure Bug
Analyze this broken campaign counter:
```tsx
import React, { useState, useEffect } from 'react';

export const BrokenCounter = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      // ❌ Stale Closure Alert!
      // This interval is created on mount (render 0).
      // It closes over the value of count = 0.
      // Every 1 second, it evaluates: setCount(0 + 1) -> setCount(1).
      // Count will stay at 1 forever.
      console.log(`Current closure count: ${count}`);
      setCount(count + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []); // Empty dependencies mean this effect never re-runs

  return <div>Count: {count}</div>;
};
```

#### Solving the Stale Closure
There are three primary methods to solve a stale closure trap in React:

**Method A: Functional State Updates**
If you only need to update state based on its previous value, pass an updater callback function:
```tsx
setCount(prevCount => prevCount + 1); // Reads up-to-date state from React internals
```

**Method B: Declare Dependencies**
Declare the changing variable in the hook's dependency array. This forces React to clean up the old closure and create a fresh one with the new scope on every change:
```tsx
useEffect(() => {
  const timer = setInterval(() => {
    setCount(count + 1);
  }, 1000);
  return () => clearInterval(timer);
}, [count]); // Re-creates interval whenever count changes
```

**Method C: The `useRef` Escape Hatch**
`useRef` returns a mutable object with a persistent reference. Reading from `.current` always reads the most recent value, regardless of the closure scope.
```tsx
const countRef = useRef(count);

// Keep ref in sync on every render
useEffect(() => {
  countRef.current = count;
});

useEffect(() => {
  const timer = setInterval(() => {
    setCount(countRef.current + 1); // Always reads latest count
  }, 1000);
  return () => clearInterval(timer);
}, []); // Safe empty dependency array
```

---

## 3. The Big Five Hooks Deep-Dive

To write production-grade dashboards, you must master the mechanics, use cases, and performance costs of the core hooks.

### Hook 1: `useState` (State Management)
*   **Lazy State Initialization:** If your initial state requires expensive computation (such as parsing a huge string from localStorage), do not pass the value directly. Use a function wrapper.
    ```tsx
    // ❌ Bad: JSON.parse runs on EVERY render
    const [campaigns, setCampaigns] = useState(JSON.parse(localStorage.getItem('campaigns') || '[]'));

    //  Good: Function runs ONLY once on mount
    const [campaigns, setCampaigns] = useState(() => {
      return JSON.parse(localStorage.getItem('campaigns') || '[]');
    });
    ```
*   **State Batching (React 18 Automatic Batching):** React groups state updates inside event handlers, promises, fetches, and native timeouts to trigger only one render, preventing performance degradation.

### Hook 2: `useEffect` (Side-Effect Management)
*   **Clean-up Phase execution:** The clean-up function executes **before** the effect runs again (to clean up the previous run's resources) and on component **unmount**.
*   **Race Conditions in APIs:** If an advertiser clicks "Campaign A" then quickly clicks "Campaign B", two fetch promises execute. If the fetch for "Campaign A" takes longer to resolve, it could overwrite the dashboard with data from Campaign A, even though Campaign B is selected.
    ```tsx
    useEffect(() => {
      let isCurrent = true;

      async function loadData() {
        const res = await fetch(`/api/campaigns/${campaignId}`);
        const data = await res.json();
        if (isCurrent) {
          setCampaignData(data);
        }
      }

      loadData();

      // Clean-up sets isCurrent to false if campaignId changes before promise resolves
      return () => {
        isCurrent = false;
      };
    }, [campaignId]);
    ```

### Hook 3: `useRef` (Persistent References)
*   **Mutations do not trigger renders:** Updating `myRef.current = newValue` bypasses the reconciler completely. Use it for values that must persist across renders but don't affect visual rendering directly.
*   **DOM Nodes:** Essential for integrating third-party rendering libraries (like D3 or Chart.js) or managing manual keyboard focuses.

### Hook 4: `useMemo` (Value Memoization)
*   **Purpose:** Caches the output value of a calculation.
*   **Performance cost:** `useMemo` is not free. It allocates memory to store cache keys and compares dependencies on every render.
    *   *Rule of thumb:* Only use it for expensive algorithms (processing collections of items, nested grouping, matrix conversions) or to maintain stable object references being passed to optimized child components.

### Hook 5: `useCallback` (Function Memoization)
*   **Purpose:** Caches the function definition itself across renders.
*   **Pairing with `React.memo`:** Passing an inline function `() => handleSelect()` down to a child component causes the child to re-render, even if wrapped in `React.memo`, because a new function reference is generated on every render. Wrapping the function in `useCallback` keeps the reference identical, enabling `React.memo` to skip child renders.

---

## 🛠️ Day 1 Practical Lab

### Task: Build a robust, race-condition-free, custom fetch hook with automatic request debouncing and AbortController cancellation.

This hook will be used to search ad campaign metrics asynchronously without causing memory leaks, stale closures, or network race conditions.

#### File: `useApiSearch.ts`
```typescript
import { useState, useEffect } from 'react';

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApiSearch<T>(query: string, delay: number, url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    // 1. Prevent execution on blank searches
    if (!query) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    // 2. Set up request debouncing to limit API server load
    const debounceTimer = setTimeout(() => {
      // Create an AbortController instance to cancel pending HTTP calls
      const abortController = new AbortController();
      const signal = abortController.signal;

      const fetchData = async () => {
        setState(prev => ({ ...prev, loading: true, error: null }));
        
        try {
          const response = await fetch(`${url}?q=${encodeURIComponent(query)}`, { signal });
          if (!response.ok) {
            throw new Error(`API returned server error code: ${response.status}`);
          }
          const result = await response.json();
          setState({ data: result, loading: false, error: null });
        } catch (err: any) {
          // Ignore errors triggered by abort cancellations
          if (err.name !== 'AbortError') {
            setState({ data: null, loading: false, error: err.message || 'API connection failed.' });
          }
        }
      };

      fetchData();

      // Clean up aborts the fetch if the search query changes during execution
      return () => {
        abortController.abort();
      };
    }, delay);

    // Clean up timer on next typing key stroke
    return () => {
      clearTimeout(debounceTimer);
    };
  }, [query, delay, url]);

  return state;
}
```

---

# 📅 DAY 2: Global State Architectures—Context, Flux, and Redux Core

---

## 1. State Lifetime and Colocation

Before designing global state structures, you must decide where state belongs.
1.  **Local Component State:** State used by only one component (e.g., is a dropdown open?).
2.  **Lifted State:** Shared state lifted to the closest common ancestor of 2-3 components.
3.  **Global App State:** State shared across entire pages, navigation paths, or the entire application lifecycle (e.g., logged-in user info, campaign configurations, or filter states).

---

## 2. The Context API: Mechanics and Optimization

Many developers assume the Context API is a state management system like Redux. **This is false.**
*   **The Reality:** Context is a **dependency injection mechanism**. It is a transportation channel to pass values directly from a Provider down to nested Consumer components without prop-drilling. It does not manage state; you must manage the state yourself using hooks like `useState` or `useReducer`.

### The Context Rendering Performance Trap
Whenever the `value` prop in `<MyContext.Provider value={contextValue}>` changes, **every single component that consumes that context (via `useContext(MyContext)`) is forced to re-render**. 

```
           [ App Provider ] (State changes)
                  │
         ┌────────┴────────┐
         ▼                 ▼
  [ Navigation ]    [ Reports Table ] (useContext)
  (Does not care                        RE-RENDERS!
   about reports)
```

If your context manages both campaigns and authorization, updating a campaign status will force your top-navigation menu to re-render, degrading UI performance.

### Optimization Pattern: Split State and Dispatch Providers
To minimize rendering overhead, split your state values and state-updating functions into separate contexts:

```tsx
import React, { createContext, useContext, useReducer, FC, ReactNode } from 'react';

// State Types
interface CampaignState {
  campaigns: any[];
  selectedId: string | null;
}

type Action = 
  | { type: 'SET_CAMPAIGNS'; payload: any[] }
  | { type: 'SELECT_CAMPAIGN'; payload: string };

const initialState: CampaignState = { campaigns: [], selectedId: null };

// Split Contexts
const StateContext = createContext<CampaignState | undefined>(undefined);
const DispatchContext = createContext<React.Dispatch<Action> | undefined>(undefined);

// Reducer Function
function campaignReducer(state: CampaignState, action: Action): CampaignState {
  switch (action.type) {
    case 'SET_CAMPAIGNS':
      return { ...state, campaigns: action.payload };
    case 'SELECT_CAMPAIGN':
      return { ...state, selectedId: action.payload };
    default:
      return state;
  }
}

// Unified Provider
export const CampaignProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(campaignReducer, initialState);

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};

// Custom hooks to consume contexts cleanly
export const useCampaignState = () => {
  const context = useContext(StateContext);
  if (!context) throw new Error('useCampaignState must be wrapped in a CampaignProvider');
  return context;
};

export const useCampaignDispatch = () => {
  const context = useContext(DispatchContext);
  if (!context) throw new Error('useCampaignDispatch must be wrapped in a CampaignProvider');
  return context;
};
```

---

## 3. The Flux Architecture & Core Redux Principles

Redux is built on Facebook's **Flux Architecture**, which was created to resolve scaling bugs in complex Model-View-Controller (MVC) apps.

### The MVC Bug vs. The Flux Solution
In classic MVC, controllers write data to multiple models, and models can trigger updates back to controllers or other views. This bidirectional flow creates unpredictable cascading update loops, making state impossible to trace.

```
[ Controller ] ──► [ Model A ] ◄──► [ Model B ]
      │               │                 │
      ▼               ▼                 ▼
  [ View 1 ] ◄───► [ View 2 ] ──────► [ View 3 ]
```

**Flux replaces this with a strict Unidirectional Data Flow:**

```
[ Action ] ──► [ Dispatcher ] ──► [ Store (State) ] ──► [ View (UI) ]
    ▲                                                      │
    └───────────────── (Triggers User Action) ─────────────┘
```

### The Three Pillars of Redux
Redux enforces Flux using three core principles:
1.  **Single Source of Truth:** The global state of your application is stored in an object tree inside a single centralized **Store**.
2.  **State is Read-Only:** The only way to modify state is by dispatching an **Action**—a plain JavaScript object describing *what* happened (e.g., `{ type: 'TOGGLE_STATUS', payload: { id: 'camp-101' } }`).
3.  **Changes are Made with Pure Functions (Reducers):** Reducers are pure functions that accept the current state and an action, and return a **new** state object:
    $$\text{Reducer}(S_{\text{current}}, A) \rightarrow S_{\text{new}}$$
    They must never mutate the existing state directly.

---

## 🛠️ Day 2 Practical Lab

### Task: Build a robust, scalable multi-level state structure using Context + `useReducer` to manage an Ad Campaign Allocation Cart (simulation of adding campaigns to checkout/billing groups).

This setup splits state and dispatch providers to prevent unnecessary renders, showing how to scale state management cleanly using raw React features.

#### File: `CampaignCartContext.tsx`
```tsx
import React, { createContext, useContext, useReducer, ReactNode, FC, useMemo } from 'react';

export interface CartItem {
  campaignId: string;
  name: string;
  allocatedBudget: number;
}

interface CartState {
  items: CartItem[];
  paymentCurrency: string;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { campaignId: string } }
  | { type: 'SET_BUDGET'; payload: { campaignId: string; budget: number } }
  | { type: 'CLEAR_CART' };

const initialCartState: CartState = {
  items: [],
  paymentCurrency: 'USD',
};

// 1. Separate Context Definitions
const CartStateContext = createContext<CartState | undefined>(undefined);
const CartDispatchContext = createContext<React.Dispatch<CartAction> | undefined>(undefined);

// 2. Reducer implementation adhering to pure state principles
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      // Ensure we don't add duplicates
      const exists = state.items.some(i => i.campaignId === action.payload.campaignId);
      if (exists) return state;
      return { ...state, items: [...state.items, action.payload] };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(i => i.campaignId !== action.payload.campaignId),
      };
    case 'SET_BUDGET':
      return {
        ...state,
        items: state.items.map(item =>
          item.campaignId === action.payload.campaignId
            ? { ...item, allocatedBudget: action.payload.budget }
            : item
        ),
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
}

// 3. Provider setup
export const CartProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialCartState);

  // Memoize state references to ensure downstream consumer rerenders are accurate
  const stateValue = useMemo(() => state, [state]);

  return (
    <CartStateContext.Provider value={stateValue}>
      <CartDispatchContext.Provider value={dispatch}>
        {children}
      </CartDispatchContext.Provider>
    </CartStateContext.Provider>
  );
};

// 4. Highly optimized hooks
export const useCartState = () => {
  const context = useContext(CartStateContext);
  if (!context) throw new Error('useCartState must be used within a CartProvider');
  return context;
};

export const useCartDispatch = () => {
  const context = useContext(CartDispatchContext);
  if (!context) throw new Error('useCartDispatch must be used within a CartProvider');
  return context;
};
```

---

# 📅 DAY 3: Modern Redux Toolkit (RTK) & RTK Query

---

## 1. Why Redux Toolkit (RTK) is the Modern Industry Standard

Classic Redux was plagued by excessive boilerplate. To implement a single feature, developers had to create Action Types, Action Creators, Reducers, Thunks, and Store mappings across multiple folders.

**Redux Toolkit (RTK)** was introduced to resolve these pain points.
*   **Immer Integration:** Reducers inside RTK's `createSlice` allow you to write update logic that looks like direct mutations, but is executed safely using **Immer** under the hood.
    ```typescript
    // ❌ Classic Redux: Deep destructuring to maintain immutability
    case TOGGLE_STATUS:
      return {
        ...state,
        campaigns: state.campaigns.map(c => 
          c.id === action.payload.id ? { ...c, status: 'ACTIVE' } : c
        )
      };

    //  RTK with Immer: Simple, safe assignment
    toggleStatus: (state, action) => {
      const campaign = state.campaigns.find(c => c.id === action.payload.id);
      if (campaign) {
        campaign.status = 'ACTIVE';
      }
    }
    ```
*   **ConfigureStore:** Automatically registers the Redux DevTools extension, sets up standard middlewares (including serializability verification checks), and builds a single unified dispatcher store.

---

## 2. Redux Thunks and Asynchronous Actions

Because Reducers must remain pure, side effects (such as network requests) must be handled outside the store flow. **Thunks** are middlewares that allow you to write action creators that return a function instead of an action object, giving you direct access to the `dispatch` and `getState` methods.

### Thunk State Machine Flows
An async thunk created with `createAsyncThunk` automatically dispatches three actions to represent a network operation's lifecycle:
1.  `pending`: Dispatched when the request begins, allowing you to show a loading spinner.
2.  `fulfilled`: Dispatched when the network returns a successful response.
3.  `rejected`: Dispatched if the promise fails, allowing you to render an error state.

---

## 🛠️ Day 3 Capstone Lab

### Build a fully typed, comprehensive Redux-driven Ad Campaign Builder and Analytics Dashboard Application.

This application includes a Redux Toolkit store, an asynchronous thunk slice (`createAsyncThunk`), and highly optimized selectors (`createSelector`).

#### Step 1: Create the Slice (`campaignSlice.ts`)
```typescript
import { createSlice, createAsyncThunk, PayloadAction, createSelector } from '@reduxjs/toolkit';

export interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  budget: number;
  impressions: number;
  clicks: number;
  spend: number;
}

interface CampaignState {
  items: Campaign[];
  loading: boolean;
  error: string | null;
  filterStatus: 'ALL' | 'ACTIVE' | 'PAUSED';
}

const initialState: CampaignState = {
  items: [],
  loading: false,
  error: null,
  filterStatus: 'ALL',
};

// 1. Asynchronous Thunk to fetch data from Go API
export const fetchCampaignsThunk = createAsyncThunk(
  'campaigns/fetchCampaigns',
  async (url: string, { rejectWithValue }) => {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Server returned error code: ${response.status}`);
      }
      return (await response.json()) as Campaign[];
    } catch (err: any) {
      return rejectWithValue(err.message || 'Network fetch failure.');
    }
  }
);

// 2. Slice configuration wrapping Reducers and ExtraReducers (Thunk hooks)
export const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    addCampaign: (state, action: PayloadAction<Omit<Campaign, 'impressions' | 'clicks' | 'spend'>>) => {
      const newCamp: Campaign = {
        ...action.payload,
        impressions: 0,
        clicks: 0,
        spend: 0,
      };
      state.items.push(newCamp);
    },
    toggleCampaignStatus: (state, action: PayloadAction<string>) => {
      const camp = state.items.find(item => item.id === action.payload);
      if (camp) {
        camp.status = camp.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      }
    },
    setFilterStatus: (state, action: PayloadAction<'ALL' | 'ACTIVE' | 'PAUSED'>) => {
      state.filterStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCampaignsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCampaignsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCampaignsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addCampaign, toggleCampaignStatus, setFilterStatus } = campaignSlice.actions;

// 3. Selection Selectors & Memoization
// Base Selectors
const selectCampaignItems = (state: { campaigns: CampaignState }) => state.campaigns.items;
const selectFilterStatus = (state: { campaigns: CampaignState }) => state.campaigns.filterStatus;

// createSelector caches outputs to prevent downstream component rerenders
export const selectFilteredCampaigns = createSelector(
  [selectCampaignItems, selectFilterStatus],
  (items, filterStatus) => {
    console.log('RTK selectFilteredCampaigns executing memoized selector...');
    if (filterStatus === 'ALL') return items;
    return items.filter(c => c.status === filterStatus);
  }
);

export const selectAggregates = createSelector(
  [selectFilteredCampaigns],
  (filteredList) => {
    console.log('RTK selectAggregates executing memoized selector...');
    let totalSpend = 0;
    let totalClicks = 0;
    let totalImpressions = 0;

    filteredList.forEach(c => {
      totalSpend += c.spend;
      totalClicks += c.clicks;
      totalImpressions += c.impressions;
    });

    const averageCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;

    return { totalSpend, totalClicks, totalImpressions, averageCtr };
  }
);

export default campaignSlice.reducer;
```

#### Step 2: Configure the Global Store (`store.ts`)
```typescript
import { configureStore } from '@reduxjs/toolkit';
import campaignReducer from './campaignSlice';

export const store = configureStore({
  reducer: {
    campaigns: campaignReducer,
  },
  // Default middleware includes checking for state mutations and non-serializable values
  middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
});

// Infer strict store types for clean TS development
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### Step 3: Typed Store Hooks Helper (`hooks.ts`)
Avoid calling un-typed Redux select hooks across components. Declare typed equivalents to prevent TypeScript compilation errors.
```typescript
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './store';

// Use throughout your app instead of plain useDispatch and useSelector
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

---

---

## 🗂️ Interactive Flashcard Deck
*Test your knowledge interactively. Click on each card to reveal the hidden answer.*

<details>
<summary><b>Card 1: What happens to the Fiber tree if you break the Rule of Hooks by calling a hook inside an 'if' block?</b></summary>
<p><b>Answer:</b></p>
<p>React relies on the execution order of hooks to match state indices inside the Fiber's singly linked list (<code>memoizedState</code>). Calling a hook conditionally shifts subsequent hook execution indices, mapping outdated states to the wrong hooks and causing unpredictable UI states or fatal crashes.</p>
</details>

<details>
<summary><b>Card 2: Explain how React's automatic state batching behaves when updating state across multiple microtasks (like async Promises or Timeouts).</b></summary>
<p><b>Answer:</b></p>
<p>In React 18+, automatic batching is enabled for all updates. This means state changes triggered inside Promises, Fetch calls, timeouts, and native browser events are batched together. This results in only one re-render once the microtask queue finishes processing, rather than triggering independent re-renders for each state call.</p>
</details>

<details>
<summary><b>Card 3: If context values are split into State and Dispatch Providers, does a component that only calls useCampaignDispatch() re-render when state values change? Why or why not?</b></summary>
<p><b>Answer:</b></p>
<p>No, it does not. The dispatch context value (the <code>dispatch</code> function reference returned from <code>useReducer</code> or <code>useStore</code>) is stable and never changes. Because the dispatch provider's value never changes, components consuming only the Dispatch Context will bypass re-renders entirely when state values change, maximizing performance.</p>
</details>

<details>
<summary><b>Card 4: What makes an Action creator "asynchronous" in Redux Toolkit, and what library executes underneath to enable this behavior?</b></summary>
<p><b>Answer:</b></p>
<p>Redux Toolkit uses **Thunk Middleware** under the hood. It allows action creators to return a callback function receiving <code>(dispatch, getState)</code> instead of a plain action object. This lets you execute side effects (like async API calls) and dispatch actions reflecting the request's progress (e.g., <code>pending</code>, <code>fulfilled</code>, or <code>rejected</code>).</p>
</details>

<details>
<summary><b>Card 5: Why do we use createSelector to compute values like totalSpend from our store, instead of calculating them directly inside our components?</b></summary>

**Answer:**

Calculating values directly inside a component runs the calculation on **every single render**, which can cause performance bottlenecks with large datasets. `createSelector` is a memoized selector utility. It remembers input state references and only recalculates outputs if those inputs actually change. This saves valuable CPU processing time, keeping your dashboard fast and responsive.

</details>

---

# 🚀 Advanced Scenario-Based Interview Challenges & Solutions

To ensure you clear senior-level technical loops, study these four production-grade architectural challenges based on real-world ad dashboard scenarios.

---

## Challenge A: Designing a Non-Blocking Ad-Pixel Redux Middleware

### The Interview Question
> *"In our ad dashboard, we want to track user behaviors (e.g., clicking 'pause' on a campaign, updating budgets). However, we do not want to litter our React components or async thunks with analytics tracking calls. How would you design a custom Redux Middleware that intercepts specific state actions, extracts metadata, and dispatches background analytical pings to our pixel-tracking endpoint completely non-blockingly?"*

### Core Architectural Concepts
*   **Redux Middleware Chain:** Middleware wraps the Redux `dispatch` function. It executes in a pipeline between an action being dispatched and the moment it reaches the reducer:
    $$\text{Action} \rightarrow \text{Middleware 1} \rightarrow \text{Middleware 2} \rightarrow \text{Reducers}$$
*   **The Signature:** A Redux middleware utilizes a curried function signature:
    ```typescript
    const middleware = store => next => action => { ... }
    ```
*   **Non-blocking Execution:** The middleware must immediately call `next(action)` to let the state update occur on the UI instantly. The async network tracking call should run inside a decoupled background promise context to avoid lagging the user interface.

### Complete Coding Solution

```typescript
import { Middleware } from '@reduxjs/toolkit';

// Define tracking endpoint
const TRACKING_PIXEL_URL = 'https://analytics.adplatform.com/v1/track';

export const adPixelTrackingMiddleware: Middleware = (store) => (next) => (action: any) => {
  // 1. Immediately pass the action down the middleware chain to update UI state instantly
  const result = next(action);

  // 2. Intercept targeted actions asynchronously and non-blockingly
  if (action.type === 'campaigns/toggleCampaignStatus') {
    const campaignId = action.payload; // Extract campaign target ID
    
    // Read the current store state safely post-action execution
    const state = store.getState();
    const campaign = state.campaigns.items.find((c: any) => c.id === campaignId);

    if (campaign) {
      // 3. Fire-and-forget logging execution in background promise context
      navigator.sendBeacon(TRACKING_PIXEL_URL, JSON.stringify({
        event: 'CAMPAIGN_STATUS_TOGGLE',
        timestamp: Date.now(),
        payload: {
          campaignId,
          newStatus: campaign.status,
          currentBudget: campaign.budget
        }
      }));
      
      console.log(`[AdPixel Middleware] Logged background status-toggle ping for campaign: ${campaignId}`);
    }
  }

  return result;
};
```

---

## Challenge B: High-Frequency WebSocket Inflow State Buffering (Dashboard Freezing)

### The Interview Question
> *"Our ad delivery nodes broadcast impression and click counts live via WebSockets. If we bind our React dashboard state directly to this WebSocket connection, the browser locks up and freezes due to receiving 300+ events per second. How would you design a high-performance React hook that buffers incoming events and batches state updates to once every 1,000ms?"*

### Core Architectural Concepts
*   **React Batching Limits:** Forcing React to render 300 updates/sec blocks the main thread, degrading interactions.
*   **The Buffer Solution:** Store incoming socket events in a mutable `useRef` array (bypassing render cycles).
*   **The Throttle Loop:** Configure a periodic timer (e.g., `setInterval`) to extract items from the buffer, compute aggregates, and execute a single batch update to state at a relaxed interval (e.g., 1,000ms).

### Complete Coding Solution

```typescript
import { useState, useEffect, useRef } from 'react';

interface MetricEvent {
  campaignId: string;
  impressions: number;
  clicks: number;
}

export function useBufferedMetrics(socketUrl: string, flushInterval = 1000) {
  const [metrics, setMetrics] = useState<Record<string, { impressions: number; clicks: number }>>({});
  
  // 1. Mutable buffer ref persists across renders and never triggers updates when modified
  const eventBuffer = useRef<MetricEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // Connect to WebSocket Server
    const ws = new WebSocket(socketUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const data: MetricEvent = JSON.parse(event.data);
        // 2. Accumulate incoming events rapidly in memory buffer (instant, O(1) complexity)
        eventBuffer.current.push(data);
      } catch (err) {
        console.error('Failed to parse socket message:', err);
      }
    };

    // 3. Configure periodic flush timer
    const flushTimer = setInterval(() => {
      if (eventBuffer.current.length === 0) return;

      // Extract accumulated records and clear current buffer array instantly
      const batch = [...eventBuffer.current];
      eventBuffer.current = [];

      console.log(`[useBufferedMetrics] Flushing batch of ${batch.length} socket events...`);

      // 4. Compute combined aggregates in-memory
      setMetrics((prevMetrics) => {
        const updated = { ...prevMetrics };
        
        for (const event of batch) {
          if (!updated[event.campaignId]) {
            updated[event.campaignId] = { impressions: 0, clicks: 0 };
          }
          updated[event.campaignId].impressions += event.impressions;
          updated[event.campaignId].clicks += event.clicks;
        }

        return updated; // Triggers exactly ONE unified render cycle
      });
    }, flushInterval);

    // 5. Clean up connections and timers on unmount to prevent severe memory leaks
    return () => {
      clearInterval(flushTimer);
      ws.close();
    };
  }, [socketUrl, flushInterval]);

  return metrics;
}
```

---

## Challenge C: Complex Dependent Cache Invalidation with RTK Query

### The Interview Question
> *"In our dashboard, we display an Advertiser's aggregate monthly budget alongside their individual campaign grids. If we toggle a campaign's state (ACTIVE ↔ PAUSED), how do we configure RTK Query to automatically invalidate and refresh both the campaign table cache and the advertiser's monthly spending limit caches concurrently, without forcing a full page reload?"*

### Core Architectural Concepts
*   **Declarative Caching:** RTK Query uses a **Tag System** (`providesTags` and `invalidatesTags`) to maintain and invalidate cache segments.
*   **Tag Relationships:** Endpoints that read data declare what tags they *provide*. Endpoints that mutate data declare what tags they *invalidate*.
*   **Composite Tags:** Use structured object tags (such as `{ type: 'Campaign', id: 'LIST' }` and `{ type: 'Advertiser', id: advertiserId }`) to run targeted cache invalidations.

### Complete Coding Solution

```typescript
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED';
  budget: number;
}

interface AdvertiserAccount {
  id: string;
  name: string;
  currency: string;
  currentSpendLimit: number;
}

export const adPlatformApi = createSlice({
  reducerPath: 'adPlatformApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:8080/api' }),
  // Declare tags used to manage caches
  tagTypes: ['Campaigns', 'AdvertiserAccount'],
  endpoints: (builder) => ({
    // 1. Fetch campaigns (Provides tags)
    getCampaigns: builder.query<Campaign[], string>({
      query: (advertiserId) => `/campaigns?advertiser_id=${advertiserId}`,
      providesTags: (result) => 
        result 
          ? [
              ...result.map(({ id }) => ({ type: 'Campaigns' as const, id })),
              { type: 'Campaigns', id: 'LIST' }
            ]
          : [{ type: 'Campaigns', id: 'LIST' }]
    }),

    // 2. Fetch Advertiser account limits (Provides tag)
    getAdvertiserProfile: builder.query<AdvertiserAccount, string>({
      query: (advertiserId) => `/advertisers/${advertiserId}`,
      providesTags: (result, error, arg) => [{ type: 'AdvertiserAccount', id: arg }]
    }),

    // 3. Campaign status toggle Mutation (Invalidates dependent caches)
    toggleCampaign: builder.mutation<Campaign, { id: string; advertiserId: string }>({
      query: ({ id }) => ({
        url: `/campaigns/toggle`,
        method: 'POST',
        body: { id }
      }),
      // Invalidate BOTH the campaign state and the overall advertiser spending profile caches
      invalidatesTags: (result, error, arg) => [
        { type: 'Campaigns', id: arg.id },
        { type: 'Campaigns', id: 'LIST' },
        { type: 'AdvertiserAccount', id: arg.advertiserId } // Refreshes advertiser budget overview automatically!
      ]
    })
  })
});

export const { useGetCampaignsQuery, useGetAdvertiserProfileQuery, useToggleCampaignMutation } = adPlatformApi;
```

---

## Challenge D: Double-Mounting and WebSocket Connection Leaks

### The Interview Question
> *"In React 18 development mode, our components mount twice (Strict Mode). We noticed that our WebSocket campaign logging dashboards are opening duplicate parallel connections, crashing our Go WebSocket server channels. Why does this happen, and how do you implement a completely bulletproof cleanup mechanism?"*

### Core Architectural Concepts
*   **Strict Mode Purpose:** React 18 mounts, unmounts, and re-mounts components in development to help developers catch missing side-effect cleanup routines.
*   **Unmount Order:** When a component unmounts, the cleanup function returned from `useEffect` is executed. If you don't close sockets, disconnect event-listeners, or abort fetch controllers during this cleanup, they survive in the background, creating silent memory leaks.

### Complete Coding Solution

```typescript
import { useEffect, useRef } from 'react';

export function useSecureSocketSubscription(campaignId: string, onUpdate: (data: any) => void) {
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    // 1. Guard against blank references
    if (!campaignId) return;

    const url = `wss://adserver.com/ws/live-metrics?id=${campaignId}`;
    console.log(`[Socket Hook] Attempting connection for campaign: ${campaignId}`);

    const ws = new WebSocket(url);
    socketRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        onUpdate(payload);
      } catch (err) {
        console.error('Failed to decode socket event data:', err);
      }
    };

    ws.onclose = () => {
      console.log(`[Socket Hook] Connection closed safely for: ${campaignId}`);
    };

    // 2. The Bulletproof Cleanup Return Function
    return () => {
      console.log(`[Socket Hook] Cleanup executing. Disconnecting: ${campaignId}`);
      if (socketRef.current) {
        // Disconnect standard handlers before closing to prevent throwing on aborted sockets
        socketRef.current.onmessage = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [campaignId, onUpdate]); // Hook re-evaluates safely if campaignId changes
}
```

