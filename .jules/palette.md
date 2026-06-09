## 2024-06-07 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Core navigation components (`Navbar`, `GlobalLayout`, `NotificationBell`) heavily rely on icon-only buttons (`lucide-react` icons) without `aria-label` attributes. This makes primary actions (cart, wishlist, dark mode, floating actions) completely inaccessible to screen readers.
**Action:** Always verify that every `<button>` element containing only an `<Icon />` has a descriptive `aria-label` attribute added during UI component creation or modification.

## 2024-06-09 - Accessible Product Actions
**Learning:** In this codebase, secondary product actions (like "Wishlist" and "Add to Cart") on product grids often lack ARIA labels, use non-semantic tags (e.g., `<div>` instead of `<button>` for clicking), and have poor visibility for keyboard users (e.g., visible only on mouse hover, but invisible on keyboard focus). This makes navigation extremely difficult for screen readers and keyboard-only users.
**Action:** When working on interactive grid items, always ensure actions use semantic `<button>` tags with descriptive `aria-label`s, include `focus-visible:ring-2` for visual focus feedback, and ensure `focus-within` triggers the same visibility as `group-hover` for hidden actions.
