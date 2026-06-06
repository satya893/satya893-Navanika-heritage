## 2024-06-06 - Concurrent Data Fetching in Admin Dashboard
**Learning:** Sequential calls to `getDocs` when fetching independent collections (like orders, products, users) creates an unnecessary performance waterfall and bottlenecks the admin dashboard.
**Action:** Always group independent Firebase document fetches inside a `Promise.all()` to ensure they execute concurrently, reducing load times to the longest individual query instead of the sum of all queries.
