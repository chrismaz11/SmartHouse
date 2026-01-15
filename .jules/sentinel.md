# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-02-18 - Sensitive Data Exposure in Logs
**Vulnerability:** Settings object containing API keys and passwords was being logged to console in plain text during save/load operations.
**Learning:** `console.log` is often used for debugging but can persist in production logs, leaking credentials. Developers often log entire objects for convenience without considering sensitive fields.
**Prevention:** Implement a sanitization helper that creates a shallow copy and redacts known sensitive keys (password, key, token, etc.) before logging any object that might contain user configuration.
