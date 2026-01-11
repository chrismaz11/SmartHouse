## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2024-05-23 - Accessible Custom Notifications
**Learning:** Custom toast notifications are often invisible to screen readers without ARIA roles.
**Action:** Use `role="status"`/`alert` and `aria-live="polite"`/`assertive` on notification containers to ensure they are announced.
