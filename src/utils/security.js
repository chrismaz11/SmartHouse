/**
 * Security utilities for the application.
 */

/**
 * Redacts sensitive keys from a settings object for safe logging.
 * @param {Object} settings The settings object to sanitize.
 * @returns {Object} A new object with sensitive values redacted.
 */
function sanitizeSettingsForLog(settings) {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  const sensitiveKeys = [
    'geminiApiKey',
    'homebridgePassword',
    'homebridgePin',
    'wifiPassword',
    'password',
    'token',
    'key',
    'secret',
    'credential',
    'auth'
  ];

  const sanitized = { ...settings };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive.toLowerCase()))) {
      if (sanitized[key]) {
        sanitized[key] = '***REDACTED***';
      }
    }
  }

  return sanitized;
}

module.exports = {
  sanitizeSettingsForLog
};
