## 2026-01-08 - Secure Logging of Settings
**Vulnerability:** The application was logging the entire settings object, including API keys and passwords, to the console on save and load.
**Learning:** Even internal logs can expose sensitive data if not sanitized. `console.log` in Electron main process can be visible in terminal output or persistent logs.
**Prevention:** Implemented a `sanitizeSettingsForLog` function that redacts keys containing 'password', 'key', 'secret', 'token', 'pin' before logging.
