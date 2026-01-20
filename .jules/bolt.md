## 2024-05-23 - [Electron IPC and Rendering Loop]
**Learning:** In Electron apps, unnecessary IPC calls and rendering loops are common performance sinks. A fixed-interval rendering loop (e.g., 5 seconds) that redraws canvas content even when data hasn't changed consumes CPU/GPU unnecessarily. Tying the redraw to the data update cycle (or user interaction) is a cleaner and more efficient pattern.
**Action:** When working with canvas or heavy DOM updates in Electron, always verify if the update trigger is linked to actual data changes. Remove polling loops if event-driven updates are possible.

## 2024-05-24 - [Parallelizing IPC Calls]
**Learning:** Sequential `await` calls for independent IPC operations in Electron introduce unnecessary latency, accumulating the round-trip time of each call. Parallelizing these with `Promise.all` can significantly reduce total wait time (measured ~50% improvement for two equal-duration calls).
**Action:** Identify independent `ipcRenderer.invoke` calls in hot paths (like refresh loops) and wrap them in `Promise.all`.
