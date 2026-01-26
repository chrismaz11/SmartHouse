# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-05-23 - Sensitive Data Leak in Logs
**Vulnerability:** Plaintext logging of configuration objects containing API keys and passwords.
**Learning:** `JSON.stringify(settings)` used for debugging logs exposed credentials. Utility functions for logging should default to sanitization (deny-by-default) or use a dedicated sanitizer for known sensitive structures.
**Prevention:** Use `sanitizeSettingsForLog` wrapper for any configuration object logging.
