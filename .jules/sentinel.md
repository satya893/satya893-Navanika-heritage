## 2024-06-09 - [Timing Attack in Signature Verification]
**Vulnerability:** Comparing HMAC signatures using standard string equality `===` is vulnerable to timing attacks. Attackers can deduce the valid signature byte-by-byte by observing the time it takes for the comparison to fail.
**Learning:** Found in `src/app/api/verify-payment/route.ts` and `src/app/api/webhooks/razorpay/route.ts`. The Razorpay signature was compared using `expectedSignature === signature`.
**Prevention:** Always use `crypto.timingSafeEqual` with `Buffer.from` to compare cryptographic signatures, ensuring a constant-time comparison. Additionally, always check that the buffers have the same length before comparison to avoid runtime errors, and ensure lengths are > 0.
