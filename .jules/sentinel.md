## 2024-06-04 - Next.js Middleware Missing x-user-id Population
**Vulnerability:** IDOR (Insecure Direct Object Reference)
**Learning:** Next.js API routes were incorrectly trusting the user-supplied `userId` payload within requests rather than verifying the ID from the decoded Firebase Auth token, enabling users to perform actions on behalf of other accounts.
**Prevention:** In Next.js middleware, always attach the verified identity (e.g. `decoded.uid`) to a custom header (e.g. `x-user-id`) via `NextResponse.next({ request: { headers } })` and strictly assert this value downstream against any user ID payload.
