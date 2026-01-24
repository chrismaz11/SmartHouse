# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-02-18 - Sensitive Data Leak in Logs
**Vulnerability:** Plaintext logging of configuration objects containing API keys and passwords in Electron main process.
**Learning:** Developers often log the entire `settings` object for debugging purposes (e.g., `console.log('Settings saved:', settings)`), forgetting that it contains secrets like `geminiApiKey` and `homebridgePassword`.
**Prevention:** Implement a dedicated `sanitizeSettingsForLog` utility that redacts known sensitive keys (password, key, token, secret) and strictly enforce its use in all logging statements involving configuration data.
