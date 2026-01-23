/**
 * Security utilities for the application.
 */

/**
 * Sanitizes settings object for secure logging.
 * Redacts sensitive keys like api keys, passwords, and tokens.
 *
 * @param {Object} settings - The settings object to sanitize.
 * @returns {Object} - The sanitized settings object.
 */
function sanitizeSettingsForLog(settings) {
    if (!settings || typeof settings !== 'object') {
        return settings;
    }

    // Create a shallow copy to avoid mutating the original object
    const sanitized = { ...settings };

    const sensitivePatterns = [
        'apikey',
        'password',
        'token',
        'secret',
        'key',
        'pin',
        'auth',
        'credential'
    ];

    for (const key of Object.keys(sanitized)) {
        const lowerKey = key.toLowerCase();
        // Check if key matches any sensitive pattern
        if (sensitivePatterns.some(pattern => lowerKey.includes(pattern))) {
            sanitized[key] = '***REDACTED***';
        }
    }

    return sanitized;
}

module.exports = {
    sanitizeSettingsForLog
};
