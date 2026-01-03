const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let wifiScanner;
let deviceTracker;
let automationEngine;
let geminiEvolution;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    titleBarStyle: 'hiddenInset'
  });

  mainWindow.loadFile('src/renderer/index.html');
  
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

app.whenReady().then(() => {
  createWindow();
  initializeServices();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

async function initializeServices() {
  try {
    const { WiFiScanner } = require('./services/wifiScanner');
    const { DeviceTracker } = require('./services/deviceTracker');
    const { AutomationEngine } = require('./services/automationEngine');
    const { GeminiEvolutionEngine } = require('./services/geminiEvolution');
    
    wifiScanner = new WiFiScanner();
    deviceTracker = new DeviceTracker();
    automationEngine = new AutomationEngine();
    geminiEvolution = new GeminiEvolutionEngine();
    
    await wifiScanner.initialize();
    await deviceTracker.initialize();
    await automationEngine.initialize();
    
    // Initialize Gemini Evolution if API key is available
    const settings = await loadSettingsSync();
    if (settings.geminiApiKey) {
      await geminiEvolution.initialize(settings.geminiApiKey);
      geminiEvolution.continuousImprovement();
    }
    
    console.log('All services initialized successfully');
  } catch (error) {
    console.error('Service initialization failed:', error);
  }
}

async function loadSettingsSync() {
  try {
    const data = await fs.readFile(path.join(__dirname, 'config/settings.json'), 'utf8');
    return JSON.parse(data);
  } catch {
    return {};
  }
}

// IPC Handlers
ipcMain.handle('scan-wifi', async () => {
  try {
    return wifiScanner ? await wifiScanner.scanNetworks() : [];
  } catch (error) {
    console.error('WiFi scan error:', error);
    return [];
  }
});

ipcMain.handle('get-access-points', async () => {
  try {
    return wifiScanner ? await wifiScanner.getAccessPoints() : [];
  } catch (error) {
    console.error('Get access points error:', error);
    return [];
  }
});

ipcMain.handle('save-ap-positions', async (event, positions) => {
  try {
    return wifiScanner ? await wifiScanner.saveAccessPointPositions(positions) : false;
  } catch (error) {
    console.error('Save AP positions error:', error);
    return false;
  }
});

ipcMain.handle('delete-automation', async (event, id) => {
  try {
    return automationEngine ? await automationEngine.deleteAutomation(id) : false;
  } catch (error) {
    console.error('Delete automation error:', error);
    return false;
  }
});

ipcMain.handle('get-devices', async () => {
  try {
    return deviceTracker ? await deviceTracker.getDevices() : [];
  } catch (error) {
    console.error('Get devices error:', error);
    return [];
  }
});

ipcMain.handle('get-device-positions', async () => {
  try {
    return deviceTracker ? await deviceTracker.getDevicePositions() : [];
  } catch (error) {
    console.error('Get device positions error:', error);
    return [];
  }
});

ipcMain.handle('save-device-tags', async (event, tags) => {
  try {
    return deviceTracker ? await deviceTracker.saveDeviceTags(tags) : false;
  } catch (error) {
    console.error('Save device tags error:', error);
    return false;
  }
});

ipcMain.handle('get-automations', async () => {
  try {
    return automationEngine ? await automationEngine.getAutomations() : [];
  } catch (error) {
    console.error('Get automations error:', error);
    return [];
  }
});

ipcMain.handle('save-automation', async (event, automation) => {
  try {
    return automationEngine ? await automationEngine.saveAutomation(automation) : false;
  } catch (error) {
    console.error('Save automation error:', error);
    return false;
  }
});

ipcMain.handle('test-smart-device', async (event, deviceType, action) => {
  try {
    return automationEngine ? await automationEngine.testSmartDevice(deviceType, action) : false;
  } catch (error) {
    console.error('Test smart device error:', error);
    return false;
  }
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const configDir = path.join(__dirname, 'config');
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(path.join(configDir, 'settings.json'), JSON.stringify(settings, null, 2));
    console.log('Settings saved:', settings);
    
    // Initialize Gemini Evolution if API key was added
    if (settings.geminiApiKey && geminiEvolution) {
      await geminiEvolution.initialize(settings.geminiApiKey);
      geminiEvolution.continuousImprovement();
    }
    
    return true;
  } catch (error) {
    console.error('Save settings error:', error);
    return false;
  }
});

// Gemini Evolution IPC Handlers
ipcMain.handle('start-intelligent-setup', async () => {
  try {
    return geminiEvolution ? await geminiEvolution.startIntelligentSetup() : null;
  } catch (error) {
    console.error('Intelligent setup error:', error);
    return null;
  }
});

ipcMain.handle('process-user-action', async (event, action, data) => {
  try {
    return geminiEvolution ? await geminiEvolution.processUserAction(action, data) : null;
  } catch (error) {
    console.error('Process user action error:', error);
    return null;
  }
});

ipcMain.handle('walking-setup', async (event, position, deviceType, setupCodes) => {
  try {
    return geminiEvolution ? await geminiEvolution.processWalkingSetup(position, deviceType, setupCodes) : null;
  } catch (error) {
    console.error('Walking setup error:', error);
    return null;
  }
});

ipcMain.handle('evolve-ui', async (event, currentUI, userBehavior) => {
  try {
    return geminiEvolution ? await geminiEvolution.evolveUserInterface(currentUI, userBehavior) : null;
  } catch (error) {
    console.error('UI evolution error:', error);
    return null;
  }
});

ipcMain.handle('get-setup-progress', async () => {
  try {
    return geminiEvolution ? geminiEvolution.getSetupProgress() : null;
  } catch (error) {
    console.error('Get setup progress error:', error);
    return null;
  }
});

ipcMain.handle('load-settings', async () => {
  try {
    const data = await fs.readFile(path.join(__dirname, 'config/settings.json'), 'utf8');
    const settings = JSON.parse(data);
    console.log('Settings loaded:', settings);
    return settings;
  } catch (error) {
    console.log('No settings file found, using defaults');
    return {};
  }
});
