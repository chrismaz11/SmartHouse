## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2024-05-24 - Async Loading States
**Learning:** Preventing layout shift during loading states is critical for perceived stability. Users notice when buttons "jump" or change size when a spinner is added.
**Action:** Fix the button width using `getBoundingClientRect().width` before modifying its content to show a spinner.
