## 2026-05-26 - Optimize Order Cancellation with Firestore Batch
**Learning:** Sequential Firestore updateDoc calls within a loop (e.g., updating stock for multiple items in an order) create an N+1 query bottleneck, significantly increasing execution time due to multiple network roundtrips.
**Action:** Use Firestore writeBatch for multiple related updates (like iterating over order items) to ensure atomicity and reduce the operation to a single network request.
