/**
 * Sanitizes sensitive information from objects for safe logging.
 * Recursively redacts values for keys containing sensitive terms.
 *
 * @param {Object} obj - The object to sanitize
 * @returns {Object} - A new object with sensitive values redacted
 */
function sanitizeSettingsForLog(obj) {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeSettingsForLog(item));
  }

  const sensitiveKeys = [
    'password',
    'token',
    'key',
    'secret',
    'pin',
    'credential',
    'auth',
    'private'
  ];

  const newObj = {};

  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = sensitiveKeys.some(term => lowerKey.includes(term));

    if (isSensitive) {
      newObj[key] = '***';
    } else if (typeof value === 'object' && value !== null) {
      newObj[key] = sanitizeSettingsForLog(value);
    } else {
      newObj[key] = value;
    }
  }

  return newObj;
}

module.exports = {
  sanitizeSettingsForLog
};
