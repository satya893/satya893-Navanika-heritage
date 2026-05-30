## 2024-05-30 - Missing ARIA Labels on Core E-commerce Components
**Learning:** Found a recurring accessibility issue where key icon-only buttons (Close, Add/Remove Quantity, Delete Item) in global slide-out components like `Cart.tsx` and `Wishlist.tsx` lack `aria-label` attributes, rendering them invisible or confusing to screen readers.
**Action:** Always verify `aria-label` existence when reviewing or adding new interactive icons to Next.js components in this repository, especially within frequent user flows like checkout and wishlist management.
