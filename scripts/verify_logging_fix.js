// scripts/verify_logging_fix.js
const assert = require('assert');

function sanitizeSettingsForLog(settings) {
    if (!settings) return settings;

    // Create a shallow copy to avoid modifying the original object
    const sanitized = { ...settings };

    const sensitiveKeys = [
        'password',
        'key',
        'token',
        'secret',
        'pin'
    ];

    for (const key in sanitized) {
        const lowerKey = key.toLowerCase();
        if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
            sanitized[key] = '***REDACTED***';
        }
    }

    return sanitized;
}

// Test Case
const testSettings = {
    homebridgeUsername: 'admin',
    homebridgePassword: 'supersecretpassword', // Sensitive
    geminiApiKey: 'AIzaSyD...',                // Sensitive (contains 'Key')
    homebridgePin: '123-45-678',               // Sensitive
    homebridgeIp: '192.168.1.100',
    pathLoss: 2.5
};

console.log('Original Settings:', testSettings);

const redacted = sanitizeSettingsForLog(testSettings);
console.log('Sanitized Settings:', redacted);

// Assertions
try {
    assert.strictEqual(redacted.homebridgeUsername, 'admin', 'Username should remain');
    assert.strictEqual(redacted.homebridgePassword, '***REDACTED***', 'Password should be redacted');
    assert.strictEqual(redacted.geminiApiKey, '***REDACTED***', 'API Key should be redacted');
    assert.strictEqual(redacted.homebridgePin, '***REDACTED***', 'PIN should be redacted');
    assert.strictEqual(redacted.homebridgeIp, '192.168.1.100', 'IP should remain');
    assert.notStrictEqual(redacted, testSettings, 'Should return a new object');

    // Ensure original object is untouched
    assert.strictEqual(testSettings.homebridgePassword, 'supersecretpassword', 'Original object should not be modified');

    console.log('\n✅ Verification PASSED: Sensitive data is redacted correctly.');
} catch (e) {
    console.error('\n❌ Verification FAILED:', e.message);
    process.exit(1);
}
