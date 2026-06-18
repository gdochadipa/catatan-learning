# 🧠 Hour 1: The React Engine & Stale Closures

## 1. Vue vs. React Rendering Paradigms

For a senior engineer transitioning from Vue 3 to React, the single most critical shift is understanding **when code executes**.

```
Vue 3 (<script setup>): Runs ONCE on creation. Mutating ref.value triggers fine-grained micro-updates.
React (Function Body): Runs completely from top-to-bottom on EVERY render frame.
```

### Vue 3: The Setup Closure
In Vue 3, your reactive references (`ref()`, `reactive()`) are initialized once. Vue tracks dependencies at the property level using ES6 Proxies. When a dependency changes, Vue's compiler-optimized runtime knows exactly which DOM node to update. The actual component setup block **never runs a second time**.

### React: The Pure Function
In React, a component is a plain JavaScript function. When a state variable changes (via its setter), React schedules a re-render. This triggers the **entire function to execute again**.
* Every local variable inside the component is re-declared.
* Every nested function is re-created with a new memory address.
* The return block generates a fresh Virtual DOM element object.

---

## 2. Under the Hood: The Fiber Node Linked List

Since React component functions execute repeatedly, local variables are ephemeral. State survives renders because it is stored in the **React Fiber tree** on the heap.

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

#### Example of a Corrupt Render:
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

---

## 3. The Stale Closure Pitfall

Because React components execute on every render, functions defined inside the component form a closure that captures the state of **that specific render cycle**. 

If a function executes asynchronously (e.g., in a `setTimeout`, `setInterval`, or `Promise` chain) and references state, it will read the value from the closure of the render cycle **when it was created**, not the current state.

### The Bug:
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

### The Solutions:
1. **Using state setter callbacks:** If you only need to update state based on the previous state value, use the functional updater:
   ```typescript
   setCount(prevCount => prevCount + 1); // Bypasses scope closure, reading from the Fiber directly
   ```
2. **Using the `useRef` hook:** `useRef` returns a mutable object with a stable reference across renders. Updating `.current` does not trigger re-renders, but always yields the fresh value immediately:
   ```typescript
   const countRef = useRef(count);
   countRef.current = count; // Keep ref updated

   // Inside setTimeout:
   alert(countRef.current); // Always reads latest value
   ```

---

## 📝 Hour 1: Mini-Quiz

### Q1: Look at the following code. How many times does the `useEffect` trigger, and what is printed in the console during the lifecycle of the component?
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

### Q2: How does React batch state updates? If you call `setValue(1)` then `setValue(2)` back-to-back in an event handler, how many times does the component re-render?
