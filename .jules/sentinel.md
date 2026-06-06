## 2023-10-27 - Unauthenticated API Route Bypass via Next.js Middleware

**Vulnerability:** The `/api/notify-user` endpoint was implicitly protected by a global `middleware.ts` which allowed ANY authenticated user (with a valid token) to send arbitrary emails. Furthermore, the global middleware blocked necessary internal server-to-server calls that lacked a token.
**Learning:** Global middleware checks (`apiPaths.some()`) are insufficient for fine-grained API authorization and can inadvertently break internal service calls.
**Prevention:** Always perform strict authentication/authorization checks *inside* the route handler itself. Implement a dual-auth mechanism (e.g., Firebase Auth token for clients + internal secret header for server-to-server calls) to secure sensitive endpoints.
