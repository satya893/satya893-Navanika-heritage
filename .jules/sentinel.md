## 2025-05-26 - [CRITICAL] Fix authorization bypass in admin API
**Vulnerability:** The `/api/admin/notify` endpoint was authenticated but not authorized. Any logged-in user could call this endpoint to send broadcast notifications to all users, which is meant strictly for admins.
**Learning:** In Next.js with Firebase Admin, middleware usually handles authentication correctly by verifying the token, but determining authorization/role checks requires passing decoded token info or doing an explicit verification within the route handler.
**Prevention:** Always verify `role === 'admin'` or similar criteria inside the API route handler when protecting privileged actions, rather than just relying on generic auth middleware that only guarantees "user is logged in".
