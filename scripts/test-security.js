const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

const testCases = [
    {
        input: { geminiApiKey: 'secret123', publicInfo: 'public' },
        expected: { geminiApiKey: '[REDACTED]', publicInfo: 'public' }
    },
    {
        input: { homebridgePassword: 'pass', port: 8080 },
        expected: { homebridgePassword: '[REDACTED]', port: 8080 }
    },
    {
        input: { nested: { secretKey: 'xyz' } },
        expected: { nested: { secretKey: '[REDACTED]' } }
    },
    {
        input: { nested: { safe: 'value', auth: 'token' } },
        expected: { nested: { safe: 'value', auth: '[REDACTED]' } }
    },
    {
        input: { normal: 'text', my_pin: '1234' },
        expected: { normal: 'text', my_pin: '[REDACTED]' }
    },
    {
        input: null,
        expected: null
    }
];

console.log('Running security tests...');

let passed = 0;
for (const test of testCases) {
    try {
        const result = sanitizeSettingsForLog(test.input);
        assert.deepStrictEqual(result, test.expected);
        passed++;
    } catch (e) {
        console.error('Test failed!', test.input);
        console.error('Expected:', test.expected);
        console.error('Actual:', sanitizeSettingsForLog(test.input));
        process.exit(1);
    }
}

console.log(`All ${passed} tests passed!`);
