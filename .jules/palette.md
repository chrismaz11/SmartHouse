## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2024-05-24 - Button Loading States
**Learning:** Primary buttons with dark/saturated backgrounds require explicit contrast overrides for spinners (e.g., white borders) as default dark spinners are invisible.
**Action:** Use inline styles or specific classes to force white/light colors for spinners inside primary action buttons.
