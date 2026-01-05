# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2024-05-22 - Sensitive Data Exposure in Logs
**Vulnerability:** The `save-settings` and `load-settings` IPC handlers in `src/main.js` were logging the entire configuration object to the console, including plaintext passwords and API keys.
**Learning:** Even if `console.log` is intended for debugging, it can leak sensitive data into production logs or be visible to anyone running the application from a terminal. Always assume logs are insecure.
**Prevention:** Implement a sanitization function for any object that might contain secrets before logging it. Filter out keys containing words like "password", "key", "token", "secret", etc.
