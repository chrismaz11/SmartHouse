# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-10-26 - Sensitive Data Leaks in IPC Logs
**Vulnerability:** Full configuration objects (containing API keys and credentials) were being logged to stdout during IPC handlers (`save-settings`, `load-settings`).
**Learning:** In Electron apps, IPC handlers often receive sensitive data. Developers might add logging for debugging without realizing they are exposing secrets to the console (and potentially log files).
**Prevention:** Implement a dedicated sanitizer (like `sanitizeSettingsForLog`) that recursively redacts sensitive keys before logging any state or configuration objects.
