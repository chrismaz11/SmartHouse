const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

console.log('Running security tests...');

const testCases = [
  {
    name: 'Sanitize simple object',
    input: {
      username: 'user',
      password: 'secretpassword',
      apiKey: '12345',
      public: 'visible'
    },
    expected: {
      username: 'user',
      password: '***REDACTED***',
      apiKey: '***REDACTED***',
      public: 'visible'
    }
  },
  {
    name: 'Sanitize nested object',
    input: {
      config: {
        dbPassword: 'db-secret',
        host: 'localhost'
      },
      tokens: {
        authToken: 'token-123',
        refreshToken: 'token-456'
      }
    },
    expected: {
      config: {
        dbPassword: '***REDACTED***',
        host: 'localhost'
      },
      tokens: '***REDACTED***' // 'tokens' contains 'token', so the whole object is redacted
    }
  },
  {
    name: 'Sanitize mixed casing',
    input: {
      APIKEY: 'big-secret',
      PinCode: '1234'
    },
    expected: {
      APIKEY: '***REDACTED***',
      PinCode: '***REDACTED***'
    }
  },
  {
    name: 'Handle arrays',
    input: {
      keys: ['key1', 'key2'], // Arrays of strings might not be recursively sanitized if the parent key doesn't match, but let's see logic.
      // Wait, my logic checks key name. If key is 'keys', it matches 'key'. So it should redact the whole array.
      credentials: [{ user: 'a', pass: 'b' }]
    },
    expected: {
      keys: '***REDACTED***',
      credentials: '***REDACTED***' // 'credential' matches
    }
  },
  {
    name: 'Non-sensitive array',
    input: {
      items: [{ id: 1, secret: 'hidden' }, { id: 2, name: 'ok' }]
    },
    expected: {
      items: [{ id: 1, secret: '***REDACTED***' }, { id: 2, name: 'ok' }]
    }
  }
];

let failed = false;

testCases.forEach((test, index) => {
  try {
    const result = sanitizeSettingsForLog(test.input);
    assert.deepStrictEqual(result, test.expected);
    console.log(`✅ Test ${index + 1}: ${test.name} passed`);
  } catch (error) {
    console.error(`❌ Test ${index + 1}: ${test.name} failed`);
    console.error('Expected:', test.expected);
    console.error('Actual:', sanitizeSettingsForLog(test.input));
    failed = true;
  }
});

if (failed) {
  console.error('Some tests failed!');
  process.exit(1);
} else {
  console.log('All security tests passed!');
}
