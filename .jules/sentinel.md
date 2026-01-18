# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-02-18 - Sensitive Data Leakage in Logs
**Vulnerability:** Exposed sensitive data (API keys, passwords) in application logs via IPC handlers.
**Learning:** `src/main.js` was logging the entire `settings` object upon save and load. Since this object contains credentials, they were being exposed to stdout, which is often captured in production logs.
**Prevention:** Use a sanitization helper (like `sanitizeSettingsForLog`) to redact sensitive keys before logging configuration objects.
