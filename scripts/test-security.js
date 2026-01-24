const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

console.log('Testing security utilities...');

const sensitiveData = {
  geminiApiKey: 'AIzaSyD-1234567890',
  homebridgeIp: '192.168.1.100',
  homebridgePassword: 'superSecretPassword',
  publicOption: 'visible',
  someToken: 'xyz123',
  mySecretKey: 'keepSafe'
};

const sanitized = sanitizeSettingsForLog(sensitiveData);

console.log('Original:', sensitiveData);
console.log('Sanitized:', sanitized);

assert.strictEqual(sanitized.geminiApiKey, '***REDACTED***', 'geminiApiKey should be redacted');
assert.strictEqual(sanitized.homebridgePassword, '***REDACTED***', 'homebridgePassword should be redacted');
assert.strictEqual(sanitized.someToken, '***REDACTED***', 'someToken should be redacted');
assert.strictEqual(sanitized.mySecretKey, '***REDACTED***', 'mySecretKey should be redacted');
assert.strictEqual(sanitized.homebridgeIp, '192.168.1.100', 'homebridgeIp should NOT be redacted');
assert.strictEqual(sanitized.publicOption, 'visible', 'publicOption should NOT be redacted');

console.log('✅ Security tests passed!');
