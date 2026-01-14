## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2026-01-14 - Async Button Feedback
**Learning:** Async operations like network scanning lacked immediate visual feedback on triggers, causing uncertainty.
**Action:** Standardized `setButtonLoading(btnId, state)` pattern implemented to manage disabled state, spinner injection, and text preservation for all async buttons.
