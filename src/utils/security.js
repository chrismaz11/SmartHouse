/**
 * Recursively sanitizes an object for logging, redacting sensitive values.
 * @param {any} obj - The object to sanitize
 * @returns {any} - The sanitized object
 */
function sanitizeSettingsForLog(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeSettingsForLog(item));
  }

  const sanitized = {};
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'pin', 'credential', 'auth', 'private'];

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(s => lowerKey.includes(s));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeSettingsForLog(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = { sanitizeSettingsForLog };
