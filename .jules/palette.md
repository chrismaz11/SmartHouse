## 2024-05-23 - Navigation Accessibility
**Learning:** Custom navigation implementations often miss `aria-current` state, leaving screen reader users unaware of their location.
**Action:** Always pair `class="active"` toggles with `aria-current="page"` updates in navigation components.

## 2024-05-24 - Async State Management
**Learning:** In vanilla JS apps, async operations triggered by both user actions and background timers require distinct UI handling to avoid flashing loading states during background refreshes.
**Action:** Implement loading state helpers that accept an optional trigger element, ensuring visual feedback only occurs for explicit user interactions.
