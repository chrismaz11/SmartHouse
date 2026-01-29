## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2024-05-24 - Button Loading State Layout Shift
**Learning:** Replacing button text with a spinner causes the button width to collapse, creating a jarring layout shift.
**Action:** When implementing loading states, constrain the button width or overlay the spinner to maintain visual stability.
