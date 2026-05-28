
## 2024-05-18 - IDOR Vulnerability in Place Order Route
**Vulnerability:** The API route for placing an order relied entirely on the `userId` provided in the request body, allowing an authenticated user to place orders on behalf of another user (IDOR) by modifying the request.
**Learning:** `middleware.ts` only validates the presence and validity of the authentication token but does not enforce user identity matching. The application failed to securely verify the requested `userId` against the authenticated token's `uid`.
**Prevention:** Always verify that the `userId` in the request body matches the authenticated user ID (`uid`) decoded from the auth token. Extract the `uid` in `middleware.ts` and pass it via a secure header (like `x-user-id`) to the downstream routes for explicit authorization checks.
