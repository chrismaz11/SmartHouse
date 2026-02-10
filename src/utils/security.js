/**
 * Sanitizes sensitive keys in an object for logging.
 * @param {Object} data - The object to sanitize.
 * @returns {Object} - A new object with sensitive values masked.
 */
function sanitizeSettingsForLog(data) {
  if (!data || typeof data !== 'object') return data;

  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'pin', 'credential', 'auth', 'private'];
  const sanitized = Array.isArray(data) ? [...data] : { ...data };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();

    // Check if the key itself indicates sensitivity
    const isSensitive = sensitiveKeys.some(s => lowerKey.includes(s));

    if (isSensitive) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeSettingsForLog(sanitized[key]);
    }
  }

  return sanitized;
}

module.exports = { sanitizeSettingsForLog };
