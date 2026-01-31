# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-05-21 - Secure Logging Pattern
**Vulnerability:** Settings containing API keys and passwords were being logged to the console in plain text during save/load operations in the main process.
**Learning:** In Electron apps (and Node.js in general), `console.log` of configuration objects is a common source of secret leakage.
**Prevention:** Use the `sanitizeSettingsForLog` utility from `src/utils/security.js` whenever logging objects that might contain sensitive data. This utility recursively redacts keys like 'password', 'key', 'token', etc.
