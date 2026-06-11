## 2024-05-19 - Use Promise.all to fetch independent datasets
**Learning:** Fetching independent datasets using `await getDocs(...)` sequentially causes an N+1 query network bottleneck, slowing down initial client-side rendering.
**Action:** When fetching multiple unrelated collections, wrap the `getDocs` calls in `await Promise.all(...)` to parallelize network requests and improve load performance.
