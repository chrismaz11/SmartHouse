const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

console.log('Running security verification...');

const mockSettings = {
    geminiApiKey: 'AIzaSyD-1234567890',
    homebridgePassword: 'superSecretPassword',
    homebridgePin: '123-45-678',
    authToken: 'abcdef123456',
    pathLoss: 3.0,
    refPower: -40,
    homebridgeIp: '192.168.1.100',
    publicData: 'public'
};

const sanitized = sanitizeSettingsForLog(mockSettings);

// Check redaction
try {
    assert.strictEqual(sanitized.geminiApiKey, '***REDACTED***', 'geminiApiKey should be redacted');
    assert.strictEqual(sanitized.homebridgePassword, '***REDACTED***', 'homebridgePassword should be redacted');
    assert.strictEqual(sanitized.homebridgePin, '***REDACTED***', 'homebridgePin should be redacted');
    assert.strictEqual(sanitized.authToken, '***REDACTED***', 'authToken should be redacted');
} catch (e) {
    console.error('FAILED: Redaction check', e.message);
    process.exit(1);
}

// Check preservation
try {
    assert.strictEqual(sanitized.pathLoss, 3.0, 'pathLoss should be preserved');
    assert.strictEqual(sanitized.refPower, -40, 'refPower should be preserved');
    assert.strictEqual(sanitized.homebridgeIp, '192.168.1.100', 'homebridgeIp should be preserved');
    assert.strictEqual(sanitized.publicData, 'public', 'publicData should be preserved');
} catch (e) {
    console.error('FAILED: Preservation check', e.message);
    process.exit(1);
}

// Check immutability (shallow)
try {
    assert.notStrictEqual(sanitized, mockSettings, 'Should return a new object');
    assert.strictEqual(mockSettings.geminiApiKey, 'AIzaSyD-1234567890', 'Original object should not be modified');
} catch (e) {
    console.error('FAILED: Immutability check', e.message);
    process.exit(1);
}

// Check non-object input
try {
    assert.strictEqual(sanitizeSettingsForLog(null), null);
    assert.strictEqual(sanitizeSettingsForLog(123), 123);
} catch (e) {
    console.error('FAILED: Edge case check', e.message);
    process.exit(1);
}

console.log('✅ Security verification passed!');
