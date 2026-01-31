/**
 * Recursively sanitizes an object for secure logging by redacting sensitive keys.
 * @param {any} obj - The object to sanitize
 * @returns {any} - The sanitized object
 */
function sanitizeSettingsForLog(obj) {
    if (!obj) return obj;
    if (typeof obj !== 'object') return obj;

    // Handle arrays
    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeSettingsForLog(item));
    }

    const sanitized = { ...obj };
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'pin', 'credential', 'auth', 'private'];

    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        // Check if key matches sensitive patterns
        if (sensitiveKeys.some(s => lowerKey.includes(s))) {
            sanitized[key] = '***REDACTED***';
        } else if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
            // Recursively sanitize nested objects
            sanitized[key] = sanitizeSettingsForLog(sanitized[key]);
        }
    }
    return sanitized;
}

module.exports = { sanitizeSettingsForLog };
