## 2024-05-19 - [ProductGrid Re-render Optimization]
**Learning:** When rendering a large list of products where each product needs to check if it is wishlisted using an array of wishlisted products, an O(n^2) operation is triggered on every re-render.
**Action:** Pre-calculate a Set of wishlisted product IDs using useMemo and use Set.has for O(1) lookups inside the map loop.
