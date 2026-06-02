## 2024-06-02 - Timing Attack via String Comparison
**Vulnerability:** Comparing HMAC signatures using `===` allows attackers to guess valid signatures by measuring string comparison response times.
**Learning:** Node.js crypto provides `timingSafeEqual`, but it strictly requires Buffers of equal length, otherwise it throws a TypeError.
**Prevention:** Always convert signatures to Buffers (using `|| ''` fallback for nulls), check that their lengths match before comparison, and use `crypto.timingSafeEqual`.
