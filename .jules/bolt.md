## 2024-05-22 - [DOM Diffing for Polling UIs]
**Learning:** Frequent `innerHTML` updates in polling loops (even with small lists) are surprisingly expensive due to layout thrashing. Simple string comparison checks before DOM updates are a highly effective, low-complexity optimization.
**Action:** Always implement dirty checks for data received from polling mechanisms before touching the DOM.

## 2024-05-22 - [Playwright Electron Verification]
**Learning:** Verifying frontend logic in Electron apps using standard Playwright (without the Electron fixture) requires careful mocking of `window.electron` and `window.require` *before* script load (via `add_init_script`), as `renderer.js` often uses `require` or `ipcRenderer` at the top level.
**Action:** When testing Electron renderers in headless browsers, always inject a full mock of the IPC bridge and module system.
