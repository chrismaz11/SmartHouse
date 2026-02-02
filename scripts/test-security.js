const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

console.log('Running security verification tests...');

const testSettings = {
  appName: 'WiFi Triangulation',
  version: '1.0.0',
  geminiApiKey: 'AIzaSyD-1234567890abcdef',
  homebridgePassword: 'mySuperSecretPassword',
  wifiConfig: {
    ssid: 'MyHomeWiFi',
    password: 'wifiPassword123'
  },
  tokens: [
    { service: 'google', token: 'oauth-token-123' },
    { service: 'aws', key: 'AKIA123456' }
  ],
  publicInfo: {
    description: 'Smart Home System'
  }
};

const sanitized = sanitizeSettingsForLog(testSettings);

try {
  // Check that sensitive fields are redacted
  assert.strictEqual(sanitized.geminiApiKey, '***REDACTED***', 'geminiApiKey should be redacted');
  assert.strictEqual(sanitized.homebridgePassword, '***REDACTED***', 'homebridgePassword should be redacted');
  assert.strictEqual(sanitized.wifiConfig.password, '***REDACTED***', 'Nested password should be redacted');

  // Check arrays of objects
  // Note: 'tokens' key matches sensitive pattern, so the entire array is redacted.
  assert.strictEqual(sanitized.tokens, '***REDACTED***', 'Entire tokens array should be redacted due to key name');

  // Check that non-sensitive fields are preserved
  assert.strictEqual(sanitized.appName, 'WiFi Triangulation', 'appName should be preserved');
  assert.strictEqual(sanitized.version, '1.0.0', 'version should be preserved');
  assert.strictEqual(sanitized.wifiConfig.ssid, 'MyHomeWiFi', 'ssid should be preserved');
  assert.strictEqual(sanitized.publicInfo.description, 'Smart Home System', 'description should be preserved');

  console.log('✅ Security verification passed: Sensitive data is correctly redacted.');
} catch (error) {
  console.error('❌ Security verification failed:', error.message);
  console.error('Sanitized output:', JSON.stringify(sanitized, null, 2));
  process.exit(1);
}
