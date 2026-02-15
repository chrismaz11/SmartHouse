## 2024-05-23 - [Electron IPC and Rendering Loop]
**Learning:** In Electron apps, unnecessary IPC calls and rendering loops are common performance sinks. A fixed-interval rendering loop (e.g., 5 seconds) that redraws canvas content even when data hasn't changed consumes CPU/GPU unnecessarily. Tying the redraw to the data update cycle (or user interaction) is a cleaner and more efficient pattern.
**Action:** When working with canvas or heavy DOM updates in Electron, always verify if the update trigger is linked to actual data changes. Remove polling loops if event-driven updates are possible.

## 2026-01-31 - [Parallelizing Async Initialization with Dependent UI]
**Learning:** Sequential async initialization calls (e.g., in `loadInitialData`) significantly delay Time to Interactive. Parallelizing them using `Promise.all` works well but introduces race conditions for UI updates if those updates depend on multiple async sources (e.g., drawing a floor plan requiring both devices and APs).
**Action:** When parallelizing initialization, always add an explicit "final render" step after `Promise.all` resolves to ensure the UI reflects the complete state, handling any partial updates that occurred during the parallel execution.
