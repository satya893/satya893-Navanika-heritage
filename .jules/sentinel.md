## 2024-05-24 - [Title]
**Vulnerability:** Timing attack vulnerability in webhook signature verification
**Learning:** String comparison `!==` for HMAC signatures is susceptible to timing attacks, as it compares character by character and returns early on the first mismatch.
**Prevention:** Always use `crypto.timingSafeEqual` with a length check after converting both the provided and expected signatures to Buffers.
