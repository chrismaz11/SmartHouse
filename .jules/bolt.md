## 2024-05-23 - [Electron IPC and Rendering Loop]
**Learning:** In Electron apps, unnecessary IPC calls and rendering loops are common performance sinks. A fixed-interval rendering loop (e.g., 5 seconds) that redraws canvas content even when data hasn't changed consumes CPU/GPU unnecessarily. Tying the redraw to the data update cycle (or user interaction) is a cleaner and more efficient pattern.
**Action:** When working with canvas or heavy DOM updates in Electron, always verify if the update trigger is linked to actual data changes. Remove polling loops if event-driven updates are possible.

## 2024-05-24 - [Concurrent UI Updates Race Condition]
**Learning:** Independent periodic tasks (like `refreshDevices` and `scanNetworks`) that both trigger a full dashboard update can cause redundant DOM operations and race conditions when their intervals align. In `src/renderer/renderer.js`, this results in double-rendering the dashboard every 30 seconds.
**Action:** When designing periodic refresh logic, batch independent data fetching operations (e.g., using `Promise.all`) and perform a single UI update after all data is ready, or ensure specific updates only touch their relevant DOM sections.
