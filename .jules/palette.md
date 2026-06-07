## 2024-06-07 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Core navigation components (`Navbar`, `GlobalLayout`, `NotificationBell`) heavily rely on icon-only buttons (`lucide-react` icons) without `aria-label` attributes. This makes primary actions (cart, wishlist, dark mode, floating actions) completely inaccessible to screen readers.
**Action:** Always verify that every `<button>` element containing only an `<Icon />` has a descriptive `aria-label` attribute added during UI component creation or modification.
