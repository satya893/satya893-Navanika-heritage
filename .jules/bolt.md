## 2024-06-03 - O(N*M) Wishlist Lookups in React Loops
**Learning:** Checking arrays sequentially via `.some()` inside `.map()` loops over products (e.g., in `ProductGrid.tsx`) causes severe CPU bottlenecking ($O(N \times M)$). In this specific codebase, both `p.id` and `p.productId` are used interchangeably to identify products in the wishlist, which must be handled when migrating from `.some()` checks to Sets.
**Action:** When performing membership lookups inside mapping functions, proactively convert arrays to `Set` structures using `useMemo` for $O(1)$ constant time lookups.
