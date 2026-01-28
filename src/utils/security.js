/**
 * Security utilities for the application.
 */

/**
 * Recursively masks sensitive values in an object for logging purposes.
 * @param {Object|Array|any} obj - The object to sanitize
 * @returns {Object|Array|any} - The sanitized object
 */
function sanitizeSettingsForLog(obj) {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeSettingsForLog(item));
  }

  // Handle objects
  const sanitized = { ...obj };
  const sensitiveKeys = ['password', 'token', 'key', 'secret', 'pin', 'credential', 'auth', 'private'];

  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      const lowerKey = key.toLowerCase();
      // Check if key contains any sensitive term
      if (sensitiveKeys.some(term => lowerKey.includes(term))) {
        sanitized[key] = '***REDACTED***';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeSettingsForLog(sanitized[key]);
      }
    }
  }

  return sanitized;
}

module.exports = {
  sanitizeSettingsForLog
};
