## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2024-05-24 - Async Loading States
**Learning:** Shared async methods (called by both user action and background timers) must conditionally trigger UI loading states. Indiscriminate loading indicators cause distracting UI flickering during auto-refresh cycles.
**Action:** Implement `setButtonLoading` with an optional `btn` parameter, ensuring only explicit user interactions trigger visual feedback.
