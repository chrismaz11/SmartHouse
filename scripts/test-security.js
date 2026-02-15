const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

console.log('🧪 Testing Security Utilities...');

// Test Case 1: Redaction of sensitive keys
const sensitiveSettings = {
    geminiApiKey: 'AIzaSyD-1234567890abcdef',
    homebridgePassword: 'superSecretPassword',
    homebridgePin: '123-45-678',
    pathLoss: 3.5,
    refPower: -40,
    homebridgeIp: '192.168.1.100'
};

const sanitized1 = sanitizeSettingsForLog(sensitiveSettings);

console.log('Test Case 1: Sensitive keys redaction');
try {
    assert.strictEqual(sanitized1.geminiApiKey, '***REDACTED***', 'geminiApiKey should be redacted');
    assert.strictEqual(sanitized1.homebridgePassword, '***REDACTED***', 'homebridgePassword should be redacted');
    assert.strictEqual(sanitized1.homebridgePin, '***REDACTED***', 'homebridgePin should be redacted');
    assert.strictEqual(sanitized1.pathLoss, 3.5, 'pathLoss should NOT be redacted');
    assert.strictEqual(sanitized1.homebridgeIp, '192.168.1.100', 'homebridgeIp should NOT be redacted');
    console.log('✅ Passed');
} catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
}

// Test Case 2: Case insensitivity and partial matches
const edgeCaseSettings = {
    mySecretToken: 'token123',
    API_KEY_V2: 'key456',
    userAuthData: 'auth789',
    publicData: 'public'
};

const sanitized2 = sanitizeSettingsForLog(edgeCaseSettings);

console.log('Test Case 2: Pattern matching');
try {
    assert.strictEqual(sanitized2.mySecretToken, '***REDACTED***', 'mySecretToken should be redacted (contains "token")');
    assert.strictEqual(sanitized2.API_KEY_V2, '***REDACTED***', 'API_KEY_V2 should be redacted (contains "key")');
    assert.strictEqual(sanitized2.userAuthData, '***REDACTED***', 'userAuthData should be redacted (contains "auth")');
    assert.strictEqual(sanitized2.publicData, 'public', 'publicData should NOT be redacted');
    console.log('✅ Passed');
} catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
}

// Test Case 3: Null/Undefined handling
console.log('Test Case 3: Null/Undefined handling');
try {
    assert.strictEqual(sanitizeSettingsForLog(null), null, 'Should handle null');
    assert.strictEqual(sanitizeSettingsForLog(undefined), undefined, 'Should handle undefined');
    console.log('✅ Passed');
} catch (error) {
    console.error('❌ Failed:', error.message);
    process.exit(1);
}

console.log('🎉 All security tests passed!');
