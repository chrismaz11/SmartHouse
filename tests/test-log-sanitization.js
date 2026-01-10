// tests/test-log-sanitization.js
const assert = require('assert');

// ------------------------------------------------------------------
// The function to be tested (this will be copied to src/main.js)
// ------------------------------------------------------------------
function sanitizeSettingsForLog(settings) {
  if (!settings) return settings;

  // Create a shallow copy to avoid mutating the original object
  const sanitized = { ...settings };

  // List of keys to redact
  const sensitiveKeys = [
    'password',
    'pass',
    'key',
    'secret',
    'token',
    'auth',
    'pin',
    'credential'
  ];

  for (const key in sanitized) {
    if (Object.prototype.hasOwnProperty.call(sanitized, key)) {
      const lowerKey = key.toLowerCase();
      // Check if key contains any sensitive keyword
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '********';
      }
    }
  }

  return sanitized;
}
// ------------------------------------------------------------------

// Test Case 1: Redacts exact matches
{
  const input = {
    password: 'supersecretpassword',
    key: 'api-key-12345',
    pin: '1234'
  };
  const output = sanitizeSettingsForLog(input);

  assert.strictEqual(output.password, '********');
  assert.strictEqual(output.key, '********');
  assert.strictEqual(output.pin, '********');
  console.log('✅ Test Case 1 passed');
}

// Test Case 2: Redacts partial matches (case insensitive)
{
  const input = {
    homebridgePassword: 'admin',
    geminiApiKey: 'AIzaSy...',
    mySecretToken: 'xyz',
    someAuthHeader: 'Bearer ...'
  };
  const output = sanitizeSettingsForLog(input);

  assert.strictEqual(output.homebridgePassword, '********');
  assert.strictEqual(output.geminiApiKey, '********');
  assert.strictEqual(output.mySecretToken, '********');
  assert.strictEqual(output.someAuthHeader, '********');
  console.log('✅ Test Case 2 passed');
}

// Test Case 3: Does not redact safe keys
{
  const input = {
    username: 'jules', // username might be considered sensitive but usually not secret
    ip: '192.168.1.1',
    port: 8080,
    pathLoss: 2.5
  };
  const output = sanitizeSettingsForLog(input);

  assert.strictEqual(output.username, 'jules');
  assert.strictEqual(output.ip, '192.168.1.1');
  assert.strictEqual(output.port, 8080);
  assert.strictEqual(output.pathLoss, 2.5);
  console.log('✅ Test Case 3 passed');
}

// Test Case 4: Handles null/undefined
{
  assert.strictEqual(sanitizeSettingsForLog(null), null);
  assert.strictEqual(sanitizeSettingsForLog(undefined), undefined);
  console.log('✅ Test Case 4 passed');
}

console.log('All tests passed!');
