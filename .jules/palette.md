## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2024-05-24 - Async Action Feedback
**Learning:** Buttons triggering async operations (like network scans) often lack visual feedback, leaving users uncertain if the action registered. Setting `aria-busy="true"` on the button while loading provides semantic meaning to screen readers.
**Action:** Implement a standard `setButtonLoading(btnId, isLoading)` helper that manages disabled state, width locking (to prevent layout shift), `aria-busy`, and a visual spinner.
