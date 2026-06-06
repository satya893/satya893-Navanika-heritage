## 2025-02-14 - Timing attacks against webhook signature verification
**Vulnerability:** Comparing webhook HMAC signatures with standard string comparison (`!==`) exposes the application to timing attacks, as string comparisons exit early on the first mismatched character.
**Learning:** `crypto.timingSafeEqual` should always be used to compare HMAC signatures to ensure constant-time comparison. Additionally, the buffers compared must be of the exact same length.
**Prevention:** Always use `Buffer.from()` to parse signatures with string fallbacks, perform a length comparison first, and then evaluate the match with `crypto.timingSafeEqual()`.
