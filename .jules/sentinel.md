## 2026-05-31 - Timing Attack Vulnerability in Signature Verification
**Vulnerability:** Simple string comparison (`signature !== expectedSignature`) was used to verify HMAC signatures for Razorpay webhooks and payment verification, which is vulnerable to timing attacks.
**Learning:** Even securely generated HMACs can be bypassed if the comparison function returns early on the first mismatched character.
**Prevention:** Always convert signatures to buffers and use `crypto.timingSafeEqual()` combined with a length check when comparing sensitive hashes or signatures.
