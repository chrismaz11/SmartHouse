/**
 * Sanitizes a settings object for safe logging by redacting sensitive values.
 * @param {Object} settings - The settings object to sanitize.
 * @returns {Object} A new object with sensitive values redacted.
 */
function sanitizeSettingsForLog(settings) {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  const sensitivePatterns = [
    'password',
    'key',
    'token',
    'secret',
    'pin',
    'credential',
    'auth'
  ];

  const sanitized = { ...settings };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (sensitivePatterns.some(pattern => lowerKey.includes(pattern))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

module.exports = {
  sanitizeSettingsForLog
};
