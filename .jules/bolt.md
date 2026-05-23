## 2024-06-25 - O(N*M) Array Iterations Inside Render Loops

**Learning:** Unnecessary array iterations, like `wishlist.some(...)`, nested inside map calls in React functional components, recalculate entirely on every re-render. This O(N*M) behavior blocks the main thread and can degrade performance considerably as array sizes grow.
**Action:** Use `useMemo` to transform array payloads into `Set`s or Maps (O(1) lookups) before the nested iterations when checking conditions like 'is-favorited' or 'is-selected' inside large list renders. Ensure to process both `id` and `productId` for wishlists, as per the established fallback logic in the codebase.
