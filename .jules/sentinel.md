# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-05-21 - Secure Logging of Settings
**Vulnerability:** Sensitive configuration data (API keys, passwords, tokens) was being logged to stdout/stderr via `console.log` during `save-settings` and `load-settings` IPC operations.
**Learning:** Standard debugging logs can inadvertently become a vector for credential leakage, especially in apps that handle external service credentials.
**Prevention:** Implement a dedicated sanitization utility (like `sanitizeSettingsForLog`) that creates a shallow copy of data and redacts sensitive keys before logging. Apply this wrapper to all log statements involving configuration objects.
