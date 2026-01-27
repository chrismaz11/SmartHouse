## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2024-05-24 - Async Feedback Contrast
**Learning:** Reusing generic loading spinners can fail contrast requirements when placed inside primary buttons (e.g. dark spinner on dark/primary background).
**Action:** Use inline styles or context-specific classes to force white/high-contrast colors for spinners inside primary action buttons.
