const { sanitizeSettingsForLog } = require('../src/utils/security');

function runTest() {
    console.log('Running security sanitization tests...');

    const testCases = [
        {
            name: 'Basic Redaction',
            input: {
                username: 'admin',
                password: 'secret123',
                apiKey: 'abc-123'
            },
            validate: (result) => {
                return result.username === 'admin' &&
                       result.password === '***REDACTED***' &&
                       result.apiKey === '***REDACTED***';
            }
        },
        {
            name: 'Nested Objects',
            input: {
                server: {
                    host: 'localhost',
                    authToken: 'xyz-999'
                }
            },
            validate: (result) => {
                return result.server.host === 'localhost' &&
                       result.server.authToken === '***REDACTED***';
            }
        },
        {
            name: 'Sensitive Key with Array Value',
            input: {
                apiKeys: ['key1', 'key2']
            },
            validate: (result) => {
                 return result.apiKeys === '***REDACTED***';
            }
        },
        {
            name: 'Array of Objects with Sensitive Fields',
            input: {
                users: [
                    { name: 'Alice', secretPin: '1234' },
                    { name: 'Bob', secretPin: '5678' }
                ]
            },
            validate: (result) => {
                return result.users[0].name === 'Alice' &&
                       result.users[0].secretPin === '***REDACTED***' &&
                       result.users[1].secretPin === '***REDACTED***';
            }
        },
        {
            name: 'Case Insensitivity',
            input: {
                MySecretValue: 'hidden'
            },
            validate: (result) => {
                return result.MySecretValue === '***REDACTED***';
            }
        }
    ];

    let passed = 0;
    let failed = 0;

    testCases.forEach(test => {
        try {
            // deep clone input to ensure no mutation affects test (though function clones)
            const input = JSON.parse(JSON.stringify(test.input));
            const result = sanitizeSettingsForLog(input);
            if (test.validate(result)) {
                console.log(`✅ ${test.name}: Passed`);
                passed++;
            } else {
                console.error(`❌ ${test.name}: Failed`);
                console.error('Input:', JSON.stringify(test.input, null, 2));
                console.error('Output:', JSON.stringify(result, null, 2));
                failed++;
            }
        } catch (error) {
            console.error(`❌ ${test.name}: Error - ${error.message}`);
            failed++;
        }
    });

    console.log(`\nTests completed: ${passed} passed, ${failed} failed.`);

    if (failed > 0) {
        process.exit(1);
    }
}

runTest();
