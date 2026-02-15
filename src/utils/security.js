
/**
 * Redacts sensitive keys from an object for safe logging.
 * @param {Object} settings - The settings object to sanitize.
 * @returns {Object} - A new object with sensitive values redacted.
 */
function sanitizeSettingsForLog(settings) {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  // List of keys that are sensitive or contain sensitive patterns
  const sensitivePatterns = [
    'apiKey',
    'api_key',
    'password',
    'secret',
    'token',
    'credential',
    'auth',
    'private',
    'geminiApiKey',
    'pin'
  ];

  const sanitized = {};

  for (const key of Object.keys(settings)) {
    const value = settings[key];
    const lowerKey = key.toLowerCase();

    // Check if key matches any sensitive pattern
    const isSensitive = sensitivePatterns.some(pattern => lowerKey.includes(pattern.toLowerCase()));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        // Recursive sanitization for nested objects
        sanitized[key] = sanitizeSettingsForLog(value);
    } else {
        sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = { sanitizeSettingsForLog };
