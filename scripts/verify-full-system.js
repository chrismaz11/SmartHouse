const { AutomationEngine } = require('../src/services/automationEngine');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');

// Mock Axios
jest = { fn: (impl) => impl }; // Simple mock wrapper if needed, but we'll monkey patch axios

async function main() {
  console.log('Starting System Verification (Mocked Network)...');
  console.log('----------------------------------------');

  // Mock Axios Implementation
  axios.post = async (url, data) => {
    console.log(`[MOCK] POST ${url}`);
    if (url.includes('/api/auth/login')) {
      console.log('       Credentials used:', data.username, '***');
      if (data.username === 'SynologyBridge' && data.password === 'inSomnia11!') {
          return { data: { access_token: 'mock_token_12345', expires_in: 3600 } };
      } else {
          throw { response: { status: 401, data: { message: 'Invalid credentials' } } };
      }
    }
    return { data: {} };
  };

  axios.get = async (url, config) => {
    console.log(`[MOCK] GET ${url}`);
    if (url.includes('/api/accessories')) {
        if (config.headers.Authorization === 'Bearer mock_token_12345') {
            return { data: [
                { aid: 1, iid: 10, serviceName: 'Living Room Light', humanType: 'Lightbulb', uuid: 'uuid-1', serviceCharacteristics: [] },
                { aid: 2, iid: 12, serviceName: 'Kitchen Switch', humanType: 'Switch', uuid: 'uuid-2', serviceCharacteristics: [] }
            ] };
        } else {
            throw { response: { status: 401 } };
        }
    }
    return { data: [] };
  };

  axios.put = async (url, data, config) => {
      console.log(`[MOCK] PUT ${url}`, data);
      return { data: { success: true } };
  }


  // 1. Check Configuration
  try {
    const configPath = path.join(__dirname, '../src/config/settings.json');
    const configData = await fs.readFile(configPath, 'utf8');
    const settings = JSON.parse(configData);
    console.log('[OK] settings.json found.');
    console.log('     Homebridge Target:', `${settings.homebridgeIp}:${settings.homebridgePort}`);
    console.log('     Credentials:', settings.homebridgeUsername, '***');
  } catch (err) {
    console.error('[FAIL] settings.json missing or invalid:', err.message);
  }

  // 2. Initialize AutomationEngine
  console.log('Initializing AutomationEngine...');
  const automationEngine = new AutomationEngine();

  try {
    // This will call our mocked axios
    await automationEngine.initialize();

    console.log('[OK] AutomationEngine initialized.');

    if (automationEngine.homebridgeConfig.token === 'mock_token_12345') {
        console.log('[SUCCESS] Authentication successful. Token stored.');
    } else {
        console.error('[FAIL] Authentication failed. Token not stored.');
    }

    if (automationEngine.homebridgeDevices.size > 0) {
        console.log(`[SUCCESS] Discovered ${automationEngine.homebridgeDevices.size} devices via API.`);
    } else {
        console.warn('[WARN] No devices found via API.');
    }

    // 3. Test Control
    console.log('Testing Device Control...');
    await automationEngine.testSmartDevice('light', 'on');

  } catch (error) {
    console.error('[FAIL] Verification error:', error);
  }

  console.log('----------------------------------------');
  console.log('System Verification Complete.');
}

main();
