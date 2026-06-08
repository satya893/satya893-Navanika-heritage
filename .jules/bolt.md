
## 2023-10-25 - AppContext Memoization for Global Cart State
**Learning:** In React contexts like `AppContext` that hold large global states (e.g., `cart` arrays), repeatedly calculating derived values (like `cartCount` and `cartTotal`) inside individual components using `.reduce()` causes unnecessary computation and re-renders across the app.
**Action:** Always memoize derived state at the context level using `useMemo` based on the primary state dependency. Provide these memoized values through the Provider to efficiently share them with all consumer components without recalculating.
