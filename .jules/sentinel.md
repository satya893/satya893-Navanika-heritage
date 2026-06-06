## 2024-06-06 - Prevent HTML Injection in Email Templates
**Vulnerability:** User-controlled URLs (e.g., `cartLink` in an abandoned cart notification payload) were directly interpolated into HTML `<a>` tags without validation, leading to potential HTML injection and XSS via `javascript:` payloads or Open Redirects.
**Learning:** Always validate externally provided URLs before injecting them into HTML context, especially emails where scripts may execute or users may be phished.
**Prevention:** Use the `URL` constructor to parse the URL and strictly validate the `protocol` (e.g., `http:` or `https:`) and the `hostname` against the expected domain (e.g., `NEXT_PUBLIC_BASE_URL`). Fallback to a safe relative or absolute URL if validation fails.
