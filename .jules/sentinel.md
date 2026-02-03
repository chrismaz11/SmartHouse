# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-02-18 - CSP for Legacy Electron
**Vulnerability:** `nodeIntegration: true` allows XSS to become RCE.
**Learning:** Enabling CSP `script-src 'self'` effectively neutralizes inline script injection even in node-integrated environments, acting as a critical defense-in-depth layer when architectural changes (disabling nodeIntegration) are too costly.
**Prevention:** Always add strict CSP to Electron html files, even (or especially) in legacy apps.
