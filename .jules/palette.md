## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2024-05-24 - Async Button States
**Learning:** Using `innerText` to save/restore button state destroys icons and HTML content within buttons.
**Action:** Use `innerHTML` when toggling button states to preserve icons, and ensure loading spinners have adequate contrast on primary buttons.
