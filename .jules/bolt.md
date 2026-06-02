## 2024-06-02 - Limit Clause Safety
**Learning:** In `/api/search/route.ts`, applying a Firestore `.limit()` restricts the documents *before* they are loaded into memory for text search and price range filtering. This causes valid results to be omitted if they weren't in the initial limited batch.
**Action:** Only apply database-level `.limit()` when no in-memory filters (text search or specific price ranges) are active. Otherwise, fetch the documents, apply filters in-memory, and *then* slice the results array to the requested limit.
