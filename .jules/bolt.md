## 2024-05-23 - [Electron IPC and Rendering Loop]
**Learning:** In Electron apps, unnecessary IPC calls and rendering loops are common performance sinks. A fixed-interval rendering loop (e.g., 5 seconds) that redraws canvas content even when data hasn't changed consumes CPU/GPU unnecessarily. Tying the redraw to the data update cycle (or user interaction) is a cleaner and more efficient pattern.
**Action:** When working with canvas or heavy DOM updates in Electron, always verify if the update trigger is linked to actual data changes. Remove polling loops if event-driven updates are possible.

## 2024-05-24 - [Parallelizing Renderer Initialization]
**Learning:** `loadInitialData` in `renderer.js` was performing sequential IPC calls (`scanNetworks`, `refreshDevices`, etc.), blocking the main thread from showing a "Ready" state. Parallelizing these using `Promise.all` reduced startup time from ~550ms to ~250ms (simulated).
**Action:** When initializing an Electron renderer, identify independent data fetching tasks and run them in parallel. Ensure that the methods are safe to run concurrently (e.g., they don't depend on shared state that changes mid-flight).
