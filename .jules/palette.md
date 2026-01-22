## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2026-01-22 - Async Button Feedback
**Learning:** Suppressing button loading states during background operations (like periodic scans) prevents UI flickering, but explicit user actions MUST show immediate feedback.
**Action:** Implement a `setButtonLoading` helper that optionally accepts a button element, ensuring feedback is shown only for user-initiated actions while keeping background updates silent.
