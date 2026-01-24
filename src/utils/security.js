/**
 * Security utilities for the application.
 */

const SENSITIVE_KEYS = [
  'password',
  'token',
  'secret',
  'key',
  'pin',
  'geminiApiKey',
  'homebridgePassword',
  'homebridgeToken',
  'homebridgePin'
];

/**
 * Sanitizes a settings object for safe logging by redacting sensitive keys.
 * @param {Object} settings - The settings object to sanitize.
 * @returns {Object} - A new object with sensitive values redacted.
 */
function sanitizeSettingsForLog(settings) {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  const sanitized = { ...settings };

  for (const key of Object.keys(sanitized)) {
    // Check if key matches any sensitive key (case-insensitive partial match could be better, but explicit list is safer for now)
    // Let's use the list plus simple heuristic
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(sensitive =>
      lowerKey.includes(sensitive.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '***REDACTED***';
    }
  }

  return sanitized;
}

module.exports = {
  sanitizeSettingsForLog
};
