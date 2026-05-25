## 2024-05-25 - [Optimize wishlist loop]
**Learning:** Array `some` checks inside `map` iterates O(n^2) causing massive overhead for list operations, which slows down re-renders significantly in `ProductGrid`.
**Action:** Create a Set inside `useMemo` for O(1) hash map lookup, dropping time complexity from O(n²) to O(n) rendering.
