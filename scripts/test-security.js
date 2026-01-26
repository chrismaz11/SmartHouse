const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

console.log('Running security tests...');

const testCases = [
  {
    name: 'Basic Redaction',
    input: {
      username: 'user',
      password: 'myPassword123',
      apiKey: 'sk_live_12345'
    },
    expected: {
      username: 'user',
      password: '***',
      apiKey: '***'
    }
  },
  {
    name: 'Nested Objects',
    input: {
      service: {
        name: 'test',
        authToken: 'secret_token'
      }
    },
    expected: {
      service: {
        name: 'test',
        authToken: '***'
      }
    }
  },
  {
    name: 'Arrays of Objects',
    input: {
      items: [
        { id: 1, secretKey: 'hidden' },
        { id: 2, publicData: 'visible' }
      ]
    },
    expected: {
      items: [
        { id: 1, secretKey: '***' },
        { id: 2, publicData: 'visible' }
      ]
    }
  },
  {
    name: 'Case Insensitivity',
    input: {
      myPIN: '1234',
      APIKey: 'abc'
    },
    expected: {
      myPIN: '***',
      APIKey: '***'
    }
  },
  {
    name: 'Null and Non-Objects',
    input: {
      val: null,
      str: 'string',
      num: 123
    },
    expected: {
      val: null,
      str: 'string',
      num: 123
    }
  },
  {
      name: 'Immutability Check',
      input: { password: 'original' },
      checkImmutability: true
  }
];

let passed = 0;
let failed = 0;

testCases.forEach(test => {
  try {
    const inputCopy = JSON.parse(JSON.stringify(test.input)); // Deep copy for immutability check
    const result = sanitizeSettingsForLog(test.input);

    if (test.expected) {
        assert.deepStrictEqual(result, test.expected);
    }

    if (test.checkImmutability) {
        assert.deepStrictEqual(test.input, inputCopy);
        assert.notStrictEqual(result, test.input);
    }

    console.log(`✅ Passed: ${test.name}`);
    passed++;
  } catch (error) {
    console.error(`❌ Failed: ${test.name}`);
    console.error('Expected:', test.expected);
    console.error('Got:', sanitizeSettingsForLog(test.input));
    console.error(error);
    failed++;
  }
});

if (failed === 0) {
  console.log(`\nAll ${passed} tests passed!`);
  process.exit(0);
} else {
  console.error(`\n${failed} tests failed.`);
  process.exit(1);
}
