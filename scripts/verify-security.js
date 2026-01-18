const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

console.log('Running security verification tests...');

// Test 1: Redact sensitive keys
const test1 = {
  geminiApiKey: 'secret-key-123',
  homebridgePassword: 'admin',
  homebridgePin: '123-45-678',
  normalSetting: 'value'
};
const result1 = sanitizeSettingsForLog(test1);

assert.strictEqual(result1.geminiApiKey, '***REDACTED***', 'geminiApiKey should be redacted');
assert.strictEqual(result1.homebridgePassword, '***REDACTED***', 'homebridgePassword should be redacted');
assert.strictEqual(result1.homebridgePin, '***REDACTED***', 'homebridgePin should be redacted');
assert.strictEqual(result1.normalSetting, 'value', 'normalSetting should be preserved');

// Test 2: Case insensitivity
const test2 = {
  SECRET_TOKEN: '123456'
};
const result2 = sanitizeSettingsForLog(test2);
assert.strictEqual(result2.SECRET_TOKEN, '***REDACTED***', 'SECRET_TOKEN should be redacted');

// Test 3: Null/undefined handling
assert.strictEqual(sanitizeSettingsForLog(null), null);
assert.strictEqual(sanitizeSettingsForLog(undefined), undefined);

// Test 4: Shallow copy check
const test4 = { password: '123' };
const result4 = sanitizeSettingsForLog(test4);
assert.notStrictEqual(test4, result4, 'Should return a new object');
assert.strictEqual(test4.password, '123', 'Original object should not be modified');

console.log('✅ All security tests passed!');
