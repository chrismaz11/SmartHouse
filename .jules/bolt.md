## 2024-05-23 - [Electron IPC and Rendering Loop]
**Learning:** In Electron apps, unnecessary IPC calls and rendering loops are common performance sinks. A fixed-interval rendering loop (e.g., 5 seconds) that redraws canvas content even when data hasn't changed consumes CPU/GPU unnecessarily. Tying the redraw to the data update cycle (or user interaction) is a cleaner and more efficient pattern.
**Action:** When working with canvas or heavy DOM updates in Electron, always verify if the update trigger is linked to actual data changes. Remove polling loops if event-driven updates are possible.

## 2024-05-24 - [String Replacement Optimization]
**Learning:** Replacing chained `.replace()` calls with a single regex and a lookup map reduced execution time of `escapeHtml` by ~22% (1.4s -> 1.1s in benchmark). This confirms that minimizing string traversals and intermediate allocations is a valid optimization for hot paths in rendering loops.
**Action:** Look for chained string replacement patterns in hot paths and refactor them to use regex maps.
