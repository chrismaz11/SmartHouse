# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-02-18 - Sensitive Data Exposure in Logs
**Vulnerability:** Application logs entire configuration objects (containing API keys/passwords) to console.
**Learning:** Developers frequently log full objects for debugging convenience without realizing they contain secrets. Standard JSON.stringify doesn't redact sensitive fields.
**Prevention:** Implement a recursive sanitization utility that scrubs keys matching sensitive patterns (password, key, token, etc.) before any object is logged.
