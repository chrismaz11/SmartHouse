const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

console.log('Running Security Utility Verification...');

const mockSettings = {
    geminiApiKey: 'secret-api-key-123',
    homebridgePassword: 'super-secret-password',
    homebridgePin: '123-45-678',
    pathLoss: 2.5,
    refPower: -40,
    nested: {
        someSecret: 'hidden-value',
        publicInfo: 'visible'
    },
    list: [
        { key: 'safe' },
        { apiKey: 'dangerous' }
    ]
};

const expected = {
    geminiApiKey: '[REDACTED]',
    homebridgePassword: '[REDACTED]',
    homebridgePin: '[REDACTED]',
    pathLoss: 2.5,
    refPower: -40,
    nested: {
        someSecret: '[REDACTED]',
        publicInfo: 'visible'
    },
    list: [
        { key: 'safe' },
        { apiKey: '[REDACTED]' }
    ]
};

try {
    const result = sanitizeSettingsForLog(mockSettings);

    // Check top level
    assert.strictEqual(result.geminiApiKey, '[REDACTED]', 'geminiApiKey should be redacted');
    assert.strictEqual(result.homebridgePassword, '[REDACTED]', 'homebridgePassword should be redacted');
    assert.strictEqual(result.homebridgePin, '[REDACTED]', 'homebridgePin should be redacted');
    assert.strictEqual(result.pathLoss, 2.5, 'pathLoss should be preserved');

    // Check nested
    assert.strictEqual(result.nested.someSecret, '[REDACTED]', 'nested.someSecret should be redacted');
    assert.strictEqual(result.nested.publicInfo, 'visible', 'nested.publicInfo should be preserved');

    // Check list
    assert.strictEqual(result.list[1].apiKey, '[REDACTED]', 'list item apiKey should be redacted');

    console.log('✅ Security Utility Verification Passed');
} catch (error) {
    console.error('❌ Security Utility Verification Failed:', error.message);
    process.exit(1);
}
