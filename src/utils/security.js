/**
 * Recursively masks sensitive values in objects/arrays.
 * @param {Object} settings - The settings object to sanitize.
 * @returns {Object} - The sanitized settings object.
 */
function sanitizeSettingsForLog(settings) {
  if (!settings || typeof settings !== 'object') {
    return settings;
  }

  const SENSITIVE_KEYS = [
    'password', 'token', 'key', 'secret', 'pin',
    'credential', 'auth', 'private'
  ];

  const sanitized = Array.isArray(settings) ? [] : {};

  for (const [key, value] of Object.entries(settings)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some(k => lowerKey.includes(k));

    if (isSensitive) {
      sanitized[key] = '***REDACTED***';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeSettingsForLog(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

module.exports = { sanitizeSettingsForLog };
