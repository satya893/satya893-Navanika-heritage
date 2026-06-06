## 2025-06-05 - Global Context Memoization
**Learning:** React context calculations like `cart.reduce()` were being needlessly recalculated on every render across multiple components (Navbar, Cart, GlobalLayout). Extracting and memoizing these derived states within the main context provider significantly reduces unnecessary CPU overhead.
**Action:** When working with derived global state (like total counts or prices from an array), always memoize the calculation centrally in the Context Provider and expose the memoized value, rather than forcing consumers to recalculate it.
