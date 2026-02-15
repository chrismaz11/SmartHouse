/**
 * Security utilities for the application.
 */

/**
 * Recursively masks values in objects/arrays where keys contain sensitive terms.
 * @param {Object} settings - The settings object to sanitize.
 * @returns {Object} - The sanitized object.
 */
function sanitizeSettingsForLog(settings) {
    if (!settings || typeof settings !== 'object') {
        return settings;
    }

    // Deep clone to avoid mutating original
    const sanitized = JSON.parse(JSON.stringify(settings));

    const SENSITIVE_KEYS = [
        'password',
        'token',
        'key',
        'secret',
        'pin',
        'credential',
        'auth',
        'private'
    ];

    function traverse(obj) {
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                const lowerKey = key.toLowerCase();
                if (SENSITIVE_KEYS.some(term => lowerKey.includes(term))) {
                    obj[key] = '***REDACTED***';
                } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                    traverse(obj[key]);
                }
            }
        }
    }

    traverse(sanitized);
    return sanitized;
}

module.exports = { sanitizeSettingsForLog };
