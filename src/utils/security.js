/**
 * Sanitize settings object for logging by masking sensitive fields.
 * @param {Object} settings - The settings object to sanitize.
 * @returns {Object} - A sanitized copy of the settings object.
 */
function sanitizeSettingsForLog(settings) {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  const sanitized = { ...settings };
  const sensitiveKeys = ['password', 'key', 'token', 'secret', 'pin', 'credential', 'auth'];

  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeSettingsForLog(sanitized[key]);
      }
    }
  }

  return sanitized;
}

module.exports = { sanitizeSettingsForLog };
