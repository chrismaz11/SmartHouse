/**
 * Security utility functions for the application.
 */

/**
 * Sanitizes a settings object for safe logging by masking sensitive values.
 * Performs a shallow copy and redaction.
 *
 * @param {Object} settings The settings object to sanitize
 * @returns {Object} A new object with sensitive values redacted
 */
function sanitizeSettingsForLog(settings) {
    if (!settings || typeof settings !== 'object') {
        return settings;
    }

    const sensitiveKeys = [
        'password',
        'key',
        'token',
        'secret',
        'pin',
        'credential',
        'auth'
    ];

    const sanitized = {};

    for (const [key, value] of Object.entries(settings)) {
        const lowerKey = key.toLowerCase();
        const isSensitive = sensitiveKeys.some(s => lowerKey.includes(s));

        if (isSensitive) {
            sanitized[key] = '***REDACTED***';
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized;
}

module.exports = {
    sanitizeSettingsForLog
};
