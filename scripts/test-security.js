const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

function testSanitizeSettingsForLog() {
  const sensitiveData = {
    geminiApiKey: 'sk-1234567890abcdef',
    homebridgePassword: 'supersecretpassword',
    homebridgePin: '123-45-678',
    wifiPassword: 'mywifipassword',
    someToken: 'token123',
    publicData: 'this is public',
    port: 8080
  };

  const sanitized = sanitizeSettingsForLog(sensitiveData);

  console.log('Original:', sensitiveData);
  console.log('Sanitized:', sanitized);

  // Assertions
  assert.strictEqual(sanitized.geminiApiKey, '***REDACTED***');
  assert.strictEqual(sanitized.homebridgePassword, '***REDACTED***');
  assert.strictEqual(sanitized.homebridgePin, '***REDACTED***');
  assert.strictEqual(sanitized.wifiPassword, '***REDACTED***');
  assert.strictEqual(sanitized.someToken, '***REDACTED***');
  assert.strictEqual(sanitized.publicData, 'this is public');
  assert.strictEqual(sanitized.port, 8080);

  // Check original object is not modified
  assert.strictEqual(sensitiveData.geminiApiKey, 'sk-1234567890abcdef');

  console.log('✅ Security verification passed!');
}

try {
  testSanitizeSettingsForLog();
} catch (error) {
  console.error('❌ Security verification failed:', error);
  process.exit(1);
}
