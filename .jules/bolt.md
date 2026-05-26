## 2024-05-26 - [Checkout Confirm Stock Optimization]
**Learning:** Sequential calls to Firestore within a `for...of` loop can cause severe N+1 query performance degradation, significantly slowing down requests proportional to array size.
**Action:** Replace sequential queries with parallel execution using `Promise.all` when queries are independent, drastically reducing wait time to O(1) latency capped by the slowest query. Ensure all items are pre-validated before firing off requests.
