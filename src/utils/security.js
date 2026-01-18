/**
 * Sanitizes settings object for secure logging.
 * Redacts values for keys containing sensitive keywords.
 * @param {Object} settings - The settings object to sanitize.
 * @returns {Object} - A new object with sensitive values redacted.
 */
function sanitizeSettingsForLog(settings) {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  const sensitiveKeys = ['password', 'key', 'token', 'secret', 'pin', 'credential', 'auth'];
  const sanitized = { ...settings };

  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      if (sensitiveKeys.some(k => key.toLowerCase().includes(k))) {
        sanitized[key] = '***REDACTED***';
      }
    }
  }

  return sanitized;
}

module.exports = { sanitizeSettingsForLog };
