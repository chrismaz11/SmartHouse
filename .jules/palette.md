## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2024-05-23 - Async Loading States
**Learning:** Reusing the `.spinner` class inside buttons requires contrast adjustments (white borders) for primary buttons.
**Action:** Use `dataset.originalText` to preserve icon+text content during loading, and inject a spinner with inline styles for contrast if necessary.
