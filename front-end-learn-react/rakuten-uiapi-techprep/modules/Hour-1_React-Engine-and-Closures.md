# 🧠 Hour 1 & 2: The React Engine, Fiber Nodes & Closures (Masterclass)

---

## 1. Structural Comparison: React vs. Vue 3

### Vue 3 Composition API (Fine-Grained Reactive)
In Vue 3, the `<script setup>` block runs **once** during component initialization. 
* Vue wraps your reactive variables in **ES6 Proxies** (`ref()`, `reactive()`).
* Under the hood, Vue's compiler automatically compiles the template into a render function that tracks which specific DOM nodes rely on which reactive proxies.
* When a reactive value updates, only the micro-targeted section of the DOM is updated. **The setup script never executes a second time.**

### React Hooks (Coarse-Grained Functional)
In React, a component is a plain JavaScript function. **It executes entirely from top-to-bottom on every single render frame.**
* Changing state schedules a render for the component.
* Every local variable inside the component function is re-declared.
* Every inline nested function is recreated in memory with a brand new reference.
* The return block executes to output a fresh Virtual DOM representation.

| Feature | Vue 3 Composition API | React Hooks |
| :--- | :--- | :--- |
| **Component Nature** | Executed once (Setup closure) | Executed continuously (Top-to-bottom re-runs) |
| **State Reactivity** | ES6 Proxies track dependencies automatically | Explicit reference modification via setters |
| **Variable Lifetime** | Persists naturally in the setup closure | Ephemeral; destroyed and recreated unless hooked |

---

## 2. Under the Hood: The Fiber Node Linked List

Since React component functions execute repeatedly, local variables cannot persist state. State survives because React stores it in the **React Fiber tree** on the JavaScript heap.

For every component on the screen, React maintains a `FiberNode` object. This node holds the state and hook registrations in a strict **singly linked list** structure inside its `memoizedState` property.

```
FiberNode (Heap Memory)
  └── memoizedState
        │
        ├── [Hook Node 1: useState] (value: 0)
        │     └── next ──┐
        │                ▼
        ├── [Hook Node 2: useEffect] (dependencies: [userId])
        │     └── next ──┐
        │                ▼
        └── [Hook Node 3: useState] (value: "active")
              └── next ──> null
```

### Why the "Rules of Hooks" Exist
1. **Never call hooks inside conditionals or loops.**
2. **Never call hooks after a conditional return.**

Because React matches your hook calls to the corresponding state node in the Fiber tree **purely by call sequence order**, changing the sequence (by skipping a hook call) shifts the indexes. 

#### Code Example of a Corrupt Render:
```javascript
// Render 1: All hooks run
const [name, setName] = useState('');     // Match -> Hook 1
if (isAdmin) {
  useEffect(() => {}, []);                // Match -> Hook 2
}
const [role, setRole] = useState('user'); // Match -> Hook 3

// Render 2: isAdmin is now false!
const [name, setName] = useState('');     // Match -> Hook 1
// useEffect is skipped!
const [role, setRole] = useState('user'); // Match -> Hook 2 (CORRUPTED! It reads Hook 2's Effect state as its string value!)
```

### 🗣️ The Feynman Analogy: The Movie Projector & The Filing Clerk
Imagine your React component is a **Movie Projector Slide** (the function component). Every time a frame changes (state updates), the projector wipes the screen and runs the **entire slide's instructions from scratch**. Because the slide runs from scratch, it has short-term memory loss. It can't remember anything by itself.

To solve this, React assigns a **Filing Clerk** (the Fiber Tree) to stand next to the projector. The clerk has a filing cabinet with folders arranged in a strict sequence (Hook 1, Hook 2, Hook 3). The Clerk is simple-minded. He doesn't know the names of the folders. He only knows their order: **"First folder goes to the count request, second folder goes to the sync effect."**

If your slide has an `if` statement and skips asking for the first folder, the Clerk will blindly hand the first folder (the count data) to your second request (the sync effect). **The memory sequence is now corrupted.**

---

## 3. The Stale Closure Pitfall

Because React components execute on every render, functions defined inside the component form a closure that captures the state of **that specific render cycle**. 

If a function executes asynchronously (e.g., in a `setTimeout`, `setInterval`, or `Promise` chain) and references state, it will read the value from the closure of the render cycle **when it was created**, not the current state.

### Code Example of the Bug:
```typescript
function DelayedLogger() {
  const [count, setCount] = useState(0);

  const handleAlert = () => {
    setTimeout(() => {
      // If the user clicks 5 times before 3 seconds, this still alerts "0"!
      alert("Current Count: " + count); 
    }, 3000);
  };

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={handleAlert}>Alert in 3s</button>
    </div>
  );
}
```

### 🗣️ The Feynman Analogy: The Photocopy Letter
A **closure** is like taking a photocopy of a letter on a desk.
1. Render 1 happens. The count is `0`.
2. A function inside the component runs a `setTimeout`. This function takes a **photocopy** of the count variable (`0`) and seals it in an envelope to read 3 seconds later.
3. During those 3 seconds, the user clicks "increment" 5 times. The count is now `5`.
4. The timer goes off. The function opens its sealed envelope. It reads the photocopy: **It still says "0"**.

### Code Solutions:
#### Solution 1: State Setter Callback (Functional Update)
If you only need to update state based on the previous state value, use the functional updater. It reads directly from the Fiber Node, bypassing closure scope:
```typescript
setCount(prevCount => prevCount + 1); 
```

#### Solution 2: Using the `useRef` Hook
`useRef` returns a mutable object with a stable reference across renders. Updating `.current` does not trigger re-renders, but always yields the fresh value immediately:
```typescript
const countRef = useRef(count);
countRef.current = count; // Keep ref updated in the render block

const handleAlert = () => {
  setTimeout(() => {
    alert("Current Count: " + countRef.current); // Always reads latest reference value
  }, 3000);
};
```

---

## 4. Custom Hooks & Logic Extraction

Custom hooks let you extract component logic into reusable functions. However, they are not shared state. **Each component that calls a custom hook receives an entirely isolated slice of state.**

### Real Code: A Custom Debounce Hook (`useDebounce.ts`)
```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: triggered before every re-run of the effect or upon unmounting
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## 📝 Hours 1 & 2: Mini-Quiz

### Q1: Analyze the code below. How many times does the `useEffect` trigger, and what is printed in the console during the lifecycle of the component?
```typescript
import React, { useState, useEffect } from 'react';

export function DoubleTrigger() {
  const [value, setValue] = useState(0);

  useEffect(() => {
    console.log("Effect Run: ", value);
    setValue(prev => prev + 1);
  }, []);

  return <div>Value: {value}</div>;
}
```

### Q2: What is "State Batching" in React 18? If you run `setValue(1)`, `setValue(2)`, and `setValue(3)` consecutively inside a single button `onClick` click handler, how many times does React re-render the component?
