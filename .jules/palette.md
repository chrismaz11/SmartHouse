## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2024-05-24 - Loading State Contrast
**Learning:** Standard dark spinners get lost on primary (blue) buttons, requiring explicit contrast overrides.
**Action:** When injecting spinners into `.btn-primary` elements, force white border colors via inline styles or specific modifier classes.
