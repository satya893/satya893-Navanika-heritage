## 2024-06-09 - Memoize Context Reductions
**Learning:** O(N) recalculations on every render using `.reduce()` across multiple nested consumers can degrade UI performance, especially in frequently-rendered layouts.
**Action:** Centralize and memoize shared array derivations (like `cartCount`, `cartTotal`) using `useMemo` in Context Providers.
