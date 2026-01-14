
function sanitizeSettingsForLog(settings) {
  if (!settings) return settings;
  const sanitized = { ...settings };
  const sensitiveKeys = ['password', 'key', 'token', 'secret', 'pin'];

  for (const key in sanitized) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      sanitized[key] = '***REDACTED***';
    }
  }
  return sanitized;
}

// Test cases
const testSettings = {
  geminiApiKey: 'AIzaSyD-12345',
  homebridgePassword: 'admin',
  homebridgePin: '123-45-678',
  pathLoss: 2.0,
  refPower: -59,
  userToken: 'abc-token-123',
  apiSecret: 'super-secret',
  normalConfig: 'value'
};

console.log('Original Settings:', JSON.stringify(testSettings, null, 2));

const sanitized = sanitizeSettingsForLog(testSettings);

console.log('Sanitized Settings:', JSON.stringify(sanitized, null, 2));

// Verification
const errors = [];

if (sanitized.geminiApiKey !== '***REDACTED***') errors.push('geminiApiKey was not redacted');
if (sanitized.homebridgePassword !== '***REDACTED***') errors.push('homebridgePassword was not redacted');
if (sanitized.homebridgePin !== '***REDACTED***') errors.push('homebridgePin was not redacted');
if (sanitized.userToken !== '***REDACTED***') errors.push('userToken was not redacted');
if (sanitized.apiSecret !== '***REDACTED***') errors.push('apiSecret was not redacted');
if (sanitized.pathLoss === '***REDACTED***') errors.push('pathLoss should not be redacted');
if (sanitized.normalConfig === '***REDACTED***') errors.push('normalConfig should not be redacted');

if (errors.length > 0) {
  console.error('❌ Verification FAILED:');
  errors.forEach(err => console.error(` - ${err}`));
  process.exit(1);
} else {
  console.log('✅ Verification PASSED: All sensitive fields redacted correctly.');
  process.exit(0);
}
