const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

console.log('Running security utility tests...');

const testCases = [
  {
    name: 'Simple object with secret',
    input: { name: 'app', apiKey: 'secret123' },
    expected: { name: 'app', apiKey: '***REDACTED***' }
  },
  {
    name: 'Nested object with secret',
    input: { config: { dbPassword: 'pass' } },
    expected: { config: { dbPassword: '***REDACTED***' } }
  },
  {
    name: 'Array of objects with secrets',
    input: { users: [{ token: 'abc' }, { token: 'def' }] },
    expected: { users: [{ token: '***REDACTED***' }, { token: '***REDACTED***' }] }
  },
  {
    name: 'No secrets',
    input: { public: 'data' },
    expected: { public: 'data' }
  },
  {
    name: 'Mixed case keys',
    input: { APIKey: 'secret', mySECRET: 'hidden' },
    expected: { APIKey: '***REDACTED***', mySECRET: '***REDACTED***' }
  }
];

let failed = false;

testCases.forEach(test => {
  try {
    const result = sanitizeSettingsForLog(test.input);
    assert.deepStrictEqual(result, test.expected);
    console.log(`✅ ${test.name} passed`);
  } catch (e) {
    console.error(`❌ ${test.name} failed`);
    console.error('Expected:', test.expected);
    console.error('Got:', sanitizeSettingsForLog(test.input));
    failed = true;
  }
});

if (failed) {
  process.exit(1);
} else {
  console.log('All security tests passed!');
}
