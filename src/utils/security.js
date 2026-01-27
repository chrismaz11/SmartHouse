/**
 * Recursively sanitizes an object for logging, redaction sensitive keys.
 * @param {Object} obj - The object to sanitize.
 * @returns {Object} - A new object with sensitive values redacted.
 */
function sanitizeSettingsForLog(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeSettingsForLog(item));
  }

  const sensitiveKeys = [
    'password', 'token', 'key', 'secret', 'pin', 'credential', 'auth', 'private'
  ];

  const newObj = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(sensitive => lowerKey.includes(sensitive));

    if (isSensitive) {
      newObj[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      newObj[key] = sanitizeSettingsForLog(value);
    } else {
      newObj[key] = value;
    }
  }

  return newObj;
}

module.exports = { sanitizeSettingsForLog };
