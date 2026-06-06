## 2024-06-06 - Missing ARIA Labels on Icon-Only Buttons
**Learning:** Icon-only buttons across primary interaction surfaces (Navbar, Cart, Product Details) consistently lack `aria-label` attributes in this application, negatively impacting screen reader accessibility. Dynamic aria labels based on component state (e.g., dark/light mode toggle, removing a specific item from a cart) are especially effective and should be encouraged.
**Action:** Always verify the presence of descriptive `aria-label` attributes whenever adding or modifying icon-only buttons in this UI.
