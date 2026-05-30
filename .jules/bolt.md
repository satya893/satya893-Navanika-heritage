## 2024-05-18 - [O(N*M) Wishlist Lookups]
**Learning:** Found an O(N*M) lookup pattern in the `ProductGrid.tsx` render function, where iterating over N products triggered an `Array.some` iteration over M wishlist items. This causes cascading slowdowns as users add items to their wishlist or load large category pages.
**Action:** Always verify `Array.some` / `Array.find` loops within `.map()` rendering functions and replace them with pre-computed `Set` data structures (which change the complexity from O(N*M) to O(N+M)).
