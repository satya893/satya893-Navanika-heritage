## 2026-06-06 - Insecure Image Remote Patterns Configuration
**Vulnerability:** The Next.js image optimization configuration in `next.config.ts` used an overly permissive wildcard (`**`) for `remotePatterns.hostname`, allowing the Next.js server to act as a proxy for malicious or unintended external images.
**Learning:** Always adhere to the principle of least privilege when configuring image proxies. Do not assume the usage of external domains unless explicitly discovered in the codebase or mentioned in the issue description.
**Prevention:** Explicitly define the specific trusted hostnames required by the application (e.g., `firebasestorage.googleapis.com`, `api.dicebear.com`, `picsum.photos`) instead of using wildcards.
