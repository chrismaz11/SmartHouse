const { sanitizeSettingsForLog } = require('../src/utils/security');
const assert = require('assert');

console.log('🛡️  Running Security Verification...');

const testCases = [
    {
        name: 'Basic Redaction',
        input: {
            apiKey: '12345-secret',
            password: 'supersecretpassword',
            username: 'admin'
        },
        check: (result) => {
            // sensitiveKeys = ['password', 'token', 'key', 'secret', 'pin', 'credential', 'auth', 'private']
            // apiKey contains 'key', so it should be redacted.
            assert.strictEqual(result.apiKey, '***REDACTED***');
            assert.strictEqual(result.password, '***REDACTED***');
            assert.strictEqual(result.username, 'admin');
        }
    },
    {
        name: 'Nested Objects',
        input: {
            service: {
                nestedConfig: {
                    token: 'abc-123',
                    expiry: 3600
                }
            }
        },
        check: (result) => {
            assert.strictEqual(result.service.nestedConfig.token, '***REDACTED***');
            assert.strictEqual(result.service.nestedConfig.expiry, 3600);
        }
    },
    {
        name: 'Whole Object Redaction',
        input: {
            authConfig: {
                token: 'abc-123',
                expiry: 3600
            }
        },
        check: (result) => {
            assert.strictEqual(result.authConfig, '***REDACTED***');
        }
    },
    {
        name: 'Arrays',
        input: {
            items: [
                { secretKey: 'hidden', id: 1 },
                { secretKey: 'hidden2', id: 2 }
            ]
        },
        check: (result) => {
            assert.strictEqual(result.items[0].secretKey, '***REDACTED***');
            assert.strictEqual(result.items[0].id, 1);
            assert.strictEqual(result.items[1].secretKey, '***REDACTED***');
        }
    },
    {
        name: 'Case Sensitivity',
        input: {
            APIKEY: 'SHOULD_BE_HIDDEN',
            MySeCrEt: 'HIDDEN_TOO'
        },
        check: (result) => {
            assert.strictEqual(result.APIKEY, '***REDACTED***');
            assert.strictEqual(result.MySeCrEt, '***REDACTED***');
        }
    }
];

let passed = 0;
let failed = 0;

testCases.forEach(test => {
    try {
        const result = sanitizeSettingsForLog(test.input);
        test.check(result);
        console.log(`✅ ${test.name} passed`);
        passed++;
    } catch (error) {
        console.error(`❌ ${test.name} failed`);
        console.error(error);
        failed++;
    }
});

if (failed > 0) {
    console.error(`\nFAILED: ${failed} tests failed.`);
    process.exit(1);
} else {
    console.log(`\nSUCCESS: All ${passed} tests passed.`);
    process.exit(0);
}
