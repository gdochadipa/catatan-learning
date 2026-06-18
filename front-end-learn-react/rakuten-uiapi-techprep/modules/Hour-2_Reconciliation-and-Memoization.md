# ⚡ Hour 2: Reconciliation & Performance Optimization

## 1. The Virtual DOM & $O(N)$ Reconciliation Heuristics

In a technical interview, describing Virtual DOM as "just a fast cache" is a junior-level answer. For GATD, you must explain **reconciliation heuristics**.

Creating the minimum edit distance between two trees is natively an $O(N^3)$ operation. If our UI tree has 1,000 nodes, it would require 1,000,000,000 operations per frame. To make UI rendering real-time, React uses a **heuristic algorithm with $O(N)$ complexity** based on two strict assumptions:

### Assumption 1: Different Element Types
If two elements are of different types, they will produce different trees.
* If a parent node changes from a `<div>` to a `<section>`, React immediately **tears down** the entire sub-tree.
* It unmounts all children, destroying their state and running cleanup hooks, then builds the new DOM tree.

### Assumption 2: Stable Keys in Lists
When rendering dynamic child elements (lists), React uses the `key` attribute to match children in the previous tree with children in the next tree.

#### The Array Index Key Pitfall
If you render lists using array indexes as keys:
```tsx
{campaigns.map((camp, index) => (
  <CampaignCard key={index} data={camp} />
))}
```
When you insert a new campaign at the **beginning** of the list:
1. The new campaign becomes index `0`.
2. The old index `0` becomes index `1`.
3. React compares keys: It matches the old key `0` with the new key `0`. It sees the props changed, and runs a re-render/DOM rewrite on the card.
4. It does this for every single item down the array.
5. **The Fix:** Always use a stable, unique item ID (e.g., `key={camp.id}`).

---

## 2. Memoization: Cache Computation vs. Cache References

### `useMemo`
Used to avoid executing an expensive synchronous computation on every single render. (Direct equivalent to Vue's `computed()`).

```typescript
// Only runs the sorting algorithm if `campaigns` array reference changes
const sortedCampaigns = useMemo(() => {
  return [...campaigns].sort((a, b) => b.impressions - a.impressions);
}, [campaigns]);
```

### `useCallback`
Used to cache a **function reference** itself. 

```typescript
// handlePause keeps the exact same memory address across renders
const handlePause = useCallback((id: string) => {
  dispatch(pauseCampaign(id));
}, [dispatch]);
```

---

## 3. The Premature Optimization Trap

**Do not wrap every function in `useCallback`!** It is a common antipattern. 

### Why?
`useCallback` has a cost:
* It executes on every render.
* It allocates a dependency array.
* It performs shallow checks on every dependency.

### When does `useCallback` actually matter?
There are only two scenarios where caching a function reference is beneficial:

1. **Child Component is Memoized:** The callback is passed as a prop to a child component wrapped in `React.memo()`.
   ```typescript
   const MemoizedChild = React.memo(ChildComponent);
   ```
   If you don't wrap the parent handler in `useCallback`, a fresh handler is created on every parent render. `React.memo` performs a shallow prop check, sees the function reference changed, and **re-renders the child anyway**, nullifying the optimization.

2. **The Callback is a Dependency:** The function is passed as a dependency to another React hook (like `useEffect` or another `useMemo`).
   ```typescript
   useEffect(() => {
     fetchData();
   }, [fetchData]); // Must be memoized with useCallback or it triggers an infinite loop!
   ```

---

## 📝 Hour 2: Mini-Quiz

### Q1: What is the issue with this component? Identify the bug and write the optimized version.
```tsx
function CampaignMetrics({ id, filterType }) {
  const [data, setData] = useState([]);

  const formatData = (items) => {
    return items.filter(item => item.type === filterType);
  };

  useEffect(() => {
    fetch(`/api/metrics/${id}`)
      .then(res => res.json())
      .then(data => setData(data));
  }, [id]);

  const processed = formatData(data);

  return <MetricsTable items={processed} />;
}
```

### Q2: Under what circumstance would modifying the value of a dependency inside a `useMemo` dependency array NOT trigger a recalculation?
