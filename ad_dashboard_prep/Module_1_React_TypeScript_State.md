# Module 1: React, TypeScript, and Advanced State Workflows

Welcome to Module 1 of your Ad Dashboard Full-Stack Preparation series. In this module, we will bridge your fundamental understanding of React and TypeScript to high-performance, enterprise-ready dashboard engineering. We will cover state synchronization, advanced Hooks, Redux Toolkit architectures, and strict typing conventions.

---

## 1. Advanced React Hooks Deep-Dive

Ad platforms have real-time dashboards containing rapidly updating data grids, filter bars, and modal forms. Managing these views requires a pristine mental model of React's render loop and Hook closures.

### `useState` & Batching
*   **The Render Lifecycle:** When state is updated, React schedules a re-render of the component. 
*   **State Batching:** React batches state updates inside event handlers, promises, and timeouts. Multiple calls to `setState` within the same event loop tick trigger only **one** re-render.
*   **Functional Updates:** To update state based on the previous state, always use the functional updater form to avoid stale closures.
    ```tsx
    // ❌ Potentially stale if executed sequentially in the same tick
    setCount(count + 1); 
    
    //  Always safe and up-to-date
    setCount(prevCount => prevCount + 1);
    ```

### `useEffect` and Lifecycle Control
The `useEffect` Hook synchronizes React state with external systems (such as REST APIs, WebSockets, or third-party pixels).
*   **Dependency Array:** React performs a shallow equality check (`Object.is`) on items in the dependency array to determine if the effect should re-run.
*   **Clean-up Functions:** Crucial for stopping continuous events, clearing timers, and canceling HTTP calls. A memory leak or double-subscription in a dashboard is often caused by a missing clean-up function.
    ```tsx
    useEffect(() => {
      const handleResize = () => console.log(window.innerWidth);
      window.addEventListener('resize', handleResize);
      
      // Clean-up function executed on unmount or before running the effect again
      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }, []); // Empty array: run only on mount and clean up on unmount
    ```

### Memoization: `useMemo` & `useCallback`
*   `useMemo` caches the **result** of a calculation across renders. Use it to avoid heavy re-calculations (e.g., sorting, filtering, or calculating aggregates of 5,000 ad campaigns).
*   `useCallback` caches the **function definition** itself. Use it to pass stable function references down to child components that are optimized with `React.memo` (preventing child components from re-rendering unless props change).
    ```tsx
    // Cached array value
    const filteredCampaigns = useMemo(() => {
      return campaigns.filter(c => c.status === filterStatus);
    }, [campaigns, filterStatus]);

    // Cached function reference
    const handleCampaignSelect = useCallback((id: string) => {
      setSelectedId(id);
    }, []); // Empty dependencies mean handleCampaignSelect never changes
    ```

### DOM Manipulation & Persistent Values: `useRef`
*   `useRef` returns a mutable object whose `.current` property persists across renders.
*   Modifying `.current` **does not** trigger a re-render.
*   Commonly used to hold references to DOM nodes (e.g., focusing an input field, charting elements) or storing previous state values/timers.

---

## 2. Global State Management: Redux Toolkit (RTK) vs. Flux

An ad dashboard is highly interactive. Selecting a date range or campaign status in a filter bar should instantly update campaign lists, chart displays, and export utilities. Passing state down through 5 layers of components ("Prop Drilling") is an anti-pattern. Instead, we use a centralized store.

### The Flux Pattern
*   **Unidirectional Data Flow:** Action $\rightarrow$ Dispatcher $\rightarrow$ Store $\rightarrow$ View $\rightarrow$ (Back to Action)
*   **Redux Implementation:** Redux simplifies Flux by replacing the Dispatcher with pure functions called **Reducers** and maintaining a single immutable state tree.

### Redux Toolkit (RTK)
RTK is the official, opinionated, battery-included toolset for efficient Redux development. It eliminates boilerplates (like action types and action creators) and allows you to write "mutable" update logic safely using **Immer** under the hood.

#### Creating an Ad Campaign Slice
```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Define the shape of our campaign state
interface Campaign {
  id: string;
  name: string;
  status: 'ACTIVE' | 'PAUSED' | 'ENDED';
  budget: number;
}

interface CampaignState {
  items: Campaign[];
  selectedId: string | null;
  filterStatus: 'ALL' | 'ACTIVE' | 'PAUSED';
}

const initialState: CampaignState = {
  items: [],
  selectedId: null,
  filterStatus: 'ALL',
};

export const campaignSlice = createSlice({
  name: 'campaigns',
  initialState,
  reducers: {
    // Immer allows us to write standard mutation code safely
    setCampaigns: (state, action: PayloadAction<Campaign[]>) => {
      state.items = action.payload;
    },
    toggleStatus: (state, action: PayloadAction<{ id: string }>) => {
      const campaign = state.items.find(c => c.id === action.payload.id);
      if (campaign) {
        campaign.status = campaign.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE';
      }
    },
    setFilterStatus: (state, action: PayloadAction<'ALL' | 'ACTIVE' | 'PAUSED'>) => {
      state.filterStatus = action.payload;
    }
  },
});

// Export actions for dispatching
export const { setCampaigns, toggleStatus, setFilterStatus } = campaignSlice.actions;

// Export reducer for store configuration
export default campaignSlice.reducer;
```

---

## 3. Strict TypeScript Integration with React

Strong typing prevents runtime crashes and makes the codebase self-documenting.

### Typing Components, Props, and Events
Always explicitly type component properties and callback handlers.

```tsx
import React, { FC, useState, ChangeEvent, FormEvent } from 'react';

// 1. Interface for Component Props
interface CampaignFormProps {
  initialBudget: number;
  onSubmit: (budget: number) => void;
}

// 2. FC (Functional Component) generic type ensures children and props are strictly verified
export const CampaignForm: FC<CampaignFormProps> = ({ initialBudget, onSubmit }) => {
  const [budget, setBudget] = useState<number>(initialBudget);

  // 3. Typing event parameters
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(event.target.value);
    setBudget(isNaN(value) ? 0 : value);
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(budget);
  };

  return (
    <form onSubmit={handleFormSubmit} className="p-4 border rounded">
      <label htmlFor="budget" className="block font-semibold mb-2">Update Budget ($):</label>
      <input
        id="budget"
        type="number"
        value={budget}
        onChange={handleInputChange}
        className="px-3 py-2 border rounded w-full"
      />
      <button type="submit" className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
        Apply Budget
      </button>
    </form>
  );
};
```

---

## 💡 Practical Hands-On Exercise
### Create a Custom Typed Hook: `useDebounce`
*Dashboards often require input-driven filtering (e.g., searching campaign names). Triggering API queries on every keystroke causes heavy load. We must debounce the input.*

Write a custom hook `useDebounce` that accepts a value and a delay time, returning the debounced value.

```tsx
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timer to update the state after the delay
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clean-up function clears timer if value or delay changes (on keystroke)
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 📝 Module 1 Mini-Quiz

Test your comprehension. Draft your answers mentally before checking the key.

1.  **Q1:** Why does executing `setCount(count + 1)` three times sequentially in a single click handler only increment the state by 1 instead of 3? How do you fix it?
2.  **Q2:** When rendering a list of campaigns, why is using array index (e.g., `key={index}`) as a React `key` prop discouraged, especially if elements can be re-ordered or deleted?
3.  **Q3:** Explain the performance risk of omitting the dependency array in a `useMemo` hook vs. providing an empty array `[]`.
4.  **Q4:** In Redux Toolkit, does mutation-like code (e.g., `state.items.push(newItem)`) actually mutate the state directly? What library enables this behavior?
5.  **Q5:** What TypeScript utility type would you use to make all properties of a interface optional (e.g., creating a `PartialCampaign` input interface for patching fields)?

---

### 🔑 Mini-Quiz Answers
1.  **A1:** React batches state updates within event handlers. Since all three calls close over the *current* render's `count` value (e.g., `0`), they all compute `0 + 1`. To fix, use the functional update pattern: `setCount(prev => prev + 1)`.
2.  **A2:** React uses the `key` to reconcile DOM nodes when a list changes. If elements are deleted, re-ordered, or sorted, indices change. React will mistake elements for one another, leading to incorrect state mapping, input fields maintaining wrong values, and poor performance.
3.  **A3:** Omitting the dependency array causes the `useMemo` expression to compute on **every single render**, rendering the memoization useless. Passing an empty array `[]` triggers execution only once on mount, returning the cached value forever.
4.  **A4:** No, it does not. Under the hood, RTK wraps reducers with **Immer**, which tracks your changes and produces a brand-new immutable copy of the state tree.
5.  **A5:** Use the built-in `Partial<Type>` utility. (e.g., `Partial<Campaign>`).

---

## 🗂️ Interactive Flashcard Deck
*Test your knowledge interactively. Click on each card to reveal the hidden answer.*

<details>
<summary><b>Card 1: How does React schedule and optimize multiple sequential state changes?</b></summary>
<p><b>Answer:</b></p>
<p>React uses **State Batching**. It groups multiple <code>setState</code> calls triggered inside event handlers, timeouts, or promises into a single execution tick, triggering only one re-render to avoid performance degradation.</p>
</details>

<details>
<summary><b>Card 2: Why must React Hooks never be called conditionally or inside loops?</b></summary>
<p><b>Answer:</b></p>
<p>React stores hook states in a singly linked list (<code>memoizedState</code>) on the component's Fiber node. It maps states strictly by execution sequence. Calling a hook conditionally shifts subsequent hook indices, linking state values to the wrong hooks and crashing the UI.</p>
</details>

<details>
<summary><b>Card 3: When does React perform shallow comparisons on hook dependencies, and how do you safeguard reference types?</b></summary>
<p><b>Answer:</b></p>
<p>React checks dependency arrays using <code>Object.is</code> (shallow equality). For objects or arrays, a new memory address reference is created on every render, triggering hooks continuously. Safeguard by caching arrays inside <code>useMemo</code> or wrapping functions inside <code>useCallback</code>.</p>
</details>

<details>
<summary><b>Card 4: What is the benefit of Redux Toolkit's createSlice reducer mutations?</b></summary>
<p><b>Answer:</b></p>
<p>Redux Toolkit integrates **Immer.js**. It lets you write readable "mutations" (e.g., <code>state.items.push(item)</code>). Under the hood, Immer intercepts these actions and creates a brand-new immutable copy of the state tree automatically.</p>
</details>

<details>
<summary><b>Card 5: Why is 'Partial&lt;Campaign&gt;' helpful in TypeScript?</b></summary>
<p><b>Answer:</b></p>
<p>It is a built-in utility type that wraps an interface, making all of its properties optional. Excellent for typing campaign edit payloads (e.g., <code>PATCH</code> request bodies) where only a subset of campaign fields is being modified.</p>
</details>
