## 2025-05-29 - O(N*M) Wishlist Lookups in Render Cycle
**Learning:** `ProductGrid` was executing `wishlist.some(...)` inside `products.map(...)` directly during the render loop. As product lists grow, this causes an $O(N \times M)$ CPU bottleneck. Furthermore, the wishlist logic checks both `id` and `productId`.
**Action:** Replace nested array lookups in lists with a single `Set` lookup using `React.useMemo` (e.g. `const wishlistedIds = new Set(wishlist.map(...))`). Always ensure `id` and `productId` are both added to the set to maintain logic parity.
