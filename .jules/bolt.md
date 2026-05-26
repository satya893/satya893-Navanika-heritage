## 2024-05-26 - [Firestore N+1 Broadcast Optimization]
**Learning:** Sending individual Firestore `add()` requests in a `Promise.all` mapping over user records introduces a massive N+1 network overhead. When mocking network requests with 5ms latency over 1000 users, it takes nearly 3 times longer.
**Action:** Use Firestore's `batch()` API and commit records in chunks of 500 when inserting or updating records in bulk, significantly reducing roundtrips and optimizing database interactions.
