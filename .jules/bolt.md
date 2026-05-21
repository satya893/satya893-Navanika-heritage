
## 2024-05-21 - [O(1) Set Lookup Optimization in Render Loops]
**Learning:** Checking for item existence (like `wishlist.some()`) inside a map rendering loop causes an `O(n*m)` operation where `n` is items rendered and `m` is the lookup array size. This can significantly slow down rendering for grids and lists as data grows.
**Action:** Use `React.useMemo` to pre-calculate a `Set` of IDs (an `O(m)` operation) outside the map loop, then use `.has()` inside the map loop for `O(1)` lookups, bringing the overall complexity down to `O(n+m)`.
