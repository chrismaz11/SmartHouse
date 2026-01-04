## 2024-05-23 - Hardcoded Secrets & Log Exposure
**Vulnerability:** Found hardcoded Homebridge credentials in `src/config/settings.json` and full configuration logging in `src/main.js`.
**Learning:** Even local configuration files can be accidentally committed if not properly ignored. Logging full configuration objects for debugging can leak secrets.
**Prevention:** Use `.gitignore` for configuration files immediately upon creation. Redact sensitive keys when logging configuration objects.
