# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-02-18 - Sensitive Data Logging
**Vulnerability:** Settings objects containing API keys were logged directly to the console.
**Learning:** `console.log(settings)` dumps secrets (like `geminiApiKey`) to stdout, which can be captured by attackers or log aggregators.
**Prevention:** Use `sanitizeSettingsForLog` (in `src/utils/security.js`) to recursively mask keys containing "password", "key", "token", etc.
