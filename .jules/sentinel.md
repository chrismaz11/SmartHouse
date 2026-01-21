# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-02-18 - Sensitive Data Leakage in Logs
**Vulnerability:** The application was logging the entire settings object, including API keys and passwords, to the console in the main process.
**Learning:** Even internal logs can expose secrets if they are captured or viewed by unauthorized users. Developers often overlook the content of objects passed to `console.log`.
**Prevention:** Implement a centralized sanitization utility (like `sanitizeSettingsForLog`) and enforce its use for any logging of configuration or user data objects.
