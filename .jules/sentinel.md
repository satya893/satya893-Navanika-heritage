
## 2024-06-12 - [Missing admin endpoint authorization]
**Vulnerability:** The `/api/admin/notify` endpoint lacked an authorization check to verify that the requester is actually an administrator, relying only on basic authentication presence.
**Learning:** `middleware.ts` only authenticates if a user is logged in (Authentication) but does not verify administrative roles (Authorization). This leaves admin endpoints vulnerable to privilege escalation from any authenticated user.
**Prevention:** Always verify both authentication (token valid) AND authorization (role/permissions) explicitly inside API route handlers for sensitive operations. Ensure the user's email or ID exists in the application's admin list or role definitions before proceeding.
