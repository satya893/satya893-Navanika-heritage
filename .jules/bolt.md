## 2024-05-26 - Prevent Network Bottleneck in Bulk Updates with writeBatch
**Learning:** Sequential `updateDoc` calls wrapped in `Promise.all` can create severe N+1 network request bottlenecks when bulk-updating inventory for a high volume of products in this architecture.
**Action:** Always prefer Firestore's `writeBatch` (up to 500 operations per batch) over sequential loops/Promises when dealing with multiple related document writes to ensure performance, atomicity, and to prevent client-side network congestion.
