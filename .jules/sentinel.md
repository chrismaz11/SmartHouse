# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-02-18 - Sensitive Data Logging
**Vulnerability:** Application was logging the entire settings object, which contains API keys and passwords, to the console in `save-settings` and `load-settings` handlers.
**Learning:** Logging entire state objects is convenient but dangerous. Developers often forget that these objects contain secrets.
**Prevention:** Implement a redaction utility that masks sensitive keys (like 'password', 'key', 'token') and use it in all logging statements involving configuration data.
