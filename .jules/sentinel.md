## 2024-05-27 - Fix timing attack on cryptographic signatures
**Vulnerability:** Cryptographic signature comparison via `===` is vulnerable to timing attacks.
**Learning:** When comparing HMAC signatures from webhooks or clients, standard equality operators leak timing information, allowing attackers to guess signatures byte by byte.
**Prevention:** Use `crypto.timingSafeEqual()` to compare buffers for all cryptographic comparisons.
