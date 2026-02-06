# Sentinel Journal

## 2025-02-18 - Electron XSS Mitigation
**Vulnerability:** Cross-Site Scripting (XSS) in Electron Renderer leading to RCE
**Learning:** This app uses `nodeIntegration: true` and `contextIsolation: false`. This means any XSS vulnerability (e.g. from a malicious WiFi SSID) can be escalated to Remote Code Execution (RCE) because the renderer process has access to Node.js primitives like `require('child_process')`.
**Prevention:** Always enable `contextIsolation` and disable `nodeIntegration` in Electron apps. If that is not immediately possible (due to legacy code architecture), rigorously sanitize all inputs rendered to the DOM to prevent XSS.

## 2025-02-18 - Unsafe AI Response Parsing
**Vulnerability:** Application Denial of Service (DoS) and potential injection via AI-generated content
**Learning:** Generative AI models (like Gemini) are non-deterministic and often include Markdown formatting (e.g., ```json) even when explicitly instructed to return raw JSON. Directly calling `JSON.parse()` on this output causes the application feature to crash/fail silently.
**Prevention:** Always wrap AI response parsing in a sanitation layer that strips Markdown code blocks and handles parsing errors gracefully ("Fail Securely") to ensure system resilience.
