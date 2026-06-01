## 2024-06-01 - Prevent Timing Attacks in HMAC Verification
**Vulnerability:** Comparing HMAC signatures using standard equality operators (`===` or `!==`) opens endpoints up to timing attacks, as string comparisons fail on the first differing character, revealing the correct signature length and prefix over time.
**Learning:** Next.js API routes handling webhooks or payment verification natively process cryptographic signatures that must be evaluated securely.
**Prevention:** Always parse expected and provided signatures into Buffers with fallback safeguards (`Buffer.from(signature || '', 'hex')`) and use `crypto.timingSafeEqual` preceded by a `.length` check.
