## 2024-06-01 - Missing ARIA Labels on Icon-only Buttons
**Learning:** Icon-only buttons across multiple components (like Cart, Navbar, NotificationBell) frequently lack `aria-label` attributes, making them inaccessible to screen readers.
**Action:** Always verify and add descriptive `aria-label` attributes when working with icon-only buttons like `<X />`, `<Trash2 />`, `<Plus />`, etc. in this codebase.
