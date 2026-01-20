const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

console.log('Verifying sanitizeSettingsForLog...');

const testSettings = {
  geminiApiKey: 'secret-api-key',
  wifiPassword: 'secret-password',
  userToken: 'secret-token',
  publicSetting: 'public-value',
  nested: {
    secretKey: 'nested-secret',
    publicInfo: 'nested-public'
  },
  nested2: {
    deep: {
      authCredential: 'deep-secret'
    }
  }
};

const sanitized = sanitizeSettingsForLog(testSettings);

console.log('Sanitized output:', JSON.stringify(sanitized, null, 2));

// Assertions
try {
  assert.strictEqual(sanitized.geminiApiKey, '***REDACTED***', 'geminiApiKey should be redacted');
  assert.strictEqual(sanitized.wifiPassword, '***REDACTED***', 'wifiPassword should be redacted');
  assert.strictEqual(sanitized.userToken, '***REDACTED***', 'userToken should be redacted');
  assert.strictEqual(sanitized.publicSetting, 'public-value', 'publicSetting should NOT be redacted');
  assert.strictEqual(sanitized.nested.secretKey, '***REDACTED***', 'nested.secretKey should be redacted');
  assert.strictEqual(sanitized.nested.publicInfo, 'nested-public', 'nested.publicInfo should NOT be redacted');
  assert.strictEqual(sanitized.nested2.deep.authCredential, '***REDACTED***', 'nested2.deep.authCredential should be redacted');

  // Verify original object is not mutated
  assert.strictEqual(testSettings.geminiApiKey, 'secret-api-key', 'Original object should not be mutated');

  console.log('✅ Verification passed!');
} catch (error) {
  console.error('❌ Verification failed:', error.message);
  process.exit(1);
}
