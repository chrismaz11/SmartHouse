## 2024-05-23 - [Electron IPC and Rendering Loop]
**Learning:** In Electron apps, unnecessary IPC calls and rendering loops are common performance sinks. A fixed-interval rendering loop (e.g., 5 seconds) that redraws canvas content even when data hasn't changed consumes CPU/GPU unnecessarily. Tying the redraw to the data update cycle (or user interaction) is a cleaner and more efficient pattern.
**Action:** When working with canvas or heavy DOM updates in Electron, always verify if the update trigger is linked to actual data changes. Remove polling loops if event-driven updates are possible.

## 2024-05-23 - [Vanilla JS DOM Thrashing in Polling Loops]
**Learning:** In applications using vanilla JS and `innerHTML` for updates, polling loops (like `setInterval`) can cause unnecessary DOM thrashing if they blindly overwrite the container even when data hasn't changed. This not only wastes CPU but also destroys input state (focus, cursor position, unsaved values) in form elements.
**Action:** Implement a "dirty checking" mechanism (e.g., `updateContainerIfChanged`) that compares the new HTML string with the cached previous version before writing to `innerHTML`. This optimizes rendering and preserves transient UI state.
