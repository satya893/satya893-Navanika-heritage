## 2024-06-13 - [Missing Authorization in API Route]
**Vulnerability:** The `/api/admin/notify` endpoint lacked authorization checks, allowing any authenticated user to send notifications, resulting in a privilege escalation vulnerability.
**Learning:** Next.js `middleware.ts` only verifies authentication (valid token), not authorization (role). Authorization must be explicitly checked within API routes.
**Prevention:** Always verify authorization (e.g., matching the decoded token email with an admin list like `NEXT_PUBLIC_ADMIN_EMAILS`) inside sensitive API route handlers.
