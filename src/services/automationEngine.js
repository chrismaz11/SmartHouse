const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const bonjour = require('bonjour')();
const fs = require('fs').promises;
const path = require('path');

class AutomationEngine {
  constructor() {
    this.automations = [];
    this.geminiClient = null;
    this.homebridgeDevices = new Map();
    this.configPath = path.join(__dirname, '../config/automations.json');
    this.homebridgeConfig = {
      ip: '127.0.0.1',
      port: 8581,
      token: null,
      username: 'admin',
      password: 'admin' // Default
    };
  }

  async initialize() {
    await this.loadAutomationConfig();
    await this.loadSettings(); // Load settings to get Homebridge config
    await this.initializeGemini();
    await this.authenticateHomebridge();
    this.discoverHomebridgeDevices();
    this.startAutomationEngine();
  }

  async authenticateHomebridge() {
    try {
      const baseUrl = `http://${this.homebridgeConfig.ip}:${this.homebridgeConfig.port}`;
      console.log(`Authenticating with Homebridge at ${baseUrl}...`);

      const response = await axios.post(`${baseUrl}/api/auth/login`, {
        username: this.homebridgeConfig.username,
        password: this.homebridgeConfig.password,
        otp: "string" // 2FA code if enabled, not handling for now
      });

      if (response.data && response.data.access_token) {
        this.homebridgeConfig.token = response.data.access_token;
        console.log('Successfully authenticated with Homebridge Config UI X');
        await this.fetchHomebridgeAccessories();
      }
    } catch (error) {
      console.error('Failed to authenticate with Homebridge:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
      console.warn('Using default "admin/admin". If you changed the password, please update settings.');
    }
  }

  async fetchHomebridgeAccessories() {
    if (!this.homebridgeConfig.token) return;

    try {
      const baseUrl = `http://${this.homebridgeConfig.ip}:${this.homebridgeConfig.port}`;
      const response = await axios.get(`${baseUrl}/api/accessories`, {
        headers: { Authorization: `Bearer ${this.homebridgeConfig.token}` }
      });

      if (Array.isArray(response.data)) {
        response.data.forEach(accessory => {
           // Simplify accessory data for our use
           const device = {
             aid: accessory.aid,
             iid: accessory.iid,
             name: accessory.serviceName || accessory.humanType,
             type: this.inferDeviceType(accessory.serviceName || accessory.humanType),
             uuid: accessory.uuid,
             characteristics: accessory.serviceCharacteristics || []
           };
           this.homebridgeDevices.set(device.name, device);
        });
        console.log(`Fetched ${this.homebridgeDevices.size} accessories from Homebridge API.`);
      }
    } catch (error) {
      console.error('Failed to fetch accessories:', error.message);
    }
  }

  async initializeGemini() {
    try {
      const settings = await this.loadSettings();
      if (settings.geminiApiKey) {
        const genAI = new GoogleGenerativeAI(settings.geminiApiKey);
        this.geminiClient = genAI.getGenerativeModel({ model: "gemini-pro" });
      }
    } catch (error) {
      console.error('Gemini initialization failed:', error);
    }
  }

  discoverHomebridgeDevices() {
    // Discover Homebridge accessories via Bonjour/mDNS
    // This is still useful as a fallback or for local discovery of HAP services not managed by Config UI X
    bonjour.find({ type: 'hap' }, (service) => {
      console.log('Found Homebridge device via Bonjour:', service.name);
      // Only add if not already found via API
      if (!this.homebridgeDevices.has(service.name)) {
        this.homebridgeDevices.set(service.name, {
          name: service.name,
          host: service.host,
          port: service.port,
          type: this.inferDeviceType(service.name),
          source: 'bonjour'
        });
      }
    });
  }

  inferDeviceType(deviceName) {
    const name = deviceName.toLowerCase();
    if (name.includes('lifx') || name.includes('light')) return 'light';
    if (name.includes('nanoleaf')) return 'light';
    if (name.includes('wyze') || name.includes('plug')) return 'switch';
    if (name.includes('ring') || name.includes('camera')) return 'camera';
    if (name.includes('sonos') || name.includes('speaker')) return 'speaker';
    if (name.includes('apple') || name.includes('tv')) return 'tv';
    return 'unknown';
  }

  async generateLightingTheme(context) {
    if (!this.geminiClient) return null;

    const prompt = `Generate a lighting theme based on this context:
    Person: ${context.person}
    Room: ${context.room}
    Time: ${context.time}
    Activity: ${context.activity}
    Weather: ${context.weather || 'unknown'}
    
    Return JSON with: {"brightness": 0-100, "hue": 0-360, "saturation": 0-100, "scene": "description"}`;

    try {
      const result = await this.geminiClient.generateContent(prompt);
      const response = await result.response;
      return JSON.parse(response.text());
    } catch (error) {
      console.error('Gemini theme generation failed:', error);
      return { brightness: 70, hue: 200, saturation: 50, scene: "warm ambient" };
    }
  }

  async processDeviceMovement(deviceMac, newPosition, oldPosition) {
    const deviceTag = await this.getDeviceTag(deviceMac);
    if (!deviceTag) return;

    const context = {
      person: deviceTag,
      room: this.getRoom(newPosition),
      time: new Date().toLocaleTimeString(),
      activity: this.inferActivity(newPosition, oldPosition),
      weather: await this.getWeather()
    };

    for (const automation of this.automations) {
      if (this.shouldTriggerAutomation(automation, context, newPosition)) {
        await this.executeAutomation(automation, context);
      }
    }
  }

  async executeAutomation(automation, context) {
    switch (automation.type) {
      case 'lighting':
        const theme = await this.generateLightingTheme(context);
        await this.controlHomebridgeLights(theme, context.room);
        break;
      
      case 'music':
        await this.controlHomebridgeSpeakers('play', context.room);
        break;
      
      case 'security':
        await this.controlHomebridgeCameras('record', context.room);
        break;
      
      case 'appliance':
        await this.controlHomebridgeSwitch(automation.deviceName, automation.action);
        break;
    }
  }

  async setAccessoryCharacteristic(uniqueId, characteristicType, value) {
     if (!this.homebridgeConfig.token) {
       console.warn('Cannot control device: No Homebridge token.');
       return;
     }

     const baseUrl = `http://${this.homebridgeConfig.ip}:${this.homebridgeConfig.port}`;
     try {
       await axios.put(`${baseUrl}/api/accessories/${uniqueId}`, {
         characteristicType: characteristicType,
         value: value
       }, {
        headers: { Authorization: `Bearer ${this.homebridgeConfig.token}` }
       });
       console.log(`Set ${uniqueId} ${characteristicType} to ${value}`);
     } catch (error) {
       console.error(`Failed to set characteristic for ${uniqueId}:`, error.message);
     }
  }

  async controlHomebridgeLights(theme, room) {
    const lights = Array.from(this.homebridgeDevices.values())
      .filter(device => device.type === 'light');
    
    for (const light of lights) {
      try {
        console.log(`Setting ${light.name} to theme:`, theme);

        // If device has a UUID, use the API
        if (light.uuid) {
            await this.setAccessoryCharacteristic(light.uuid, 'On', true);
            if (theme.brightness) {
               await this.setAccessoryCharacteristic(light.uuid, 'Brightness', theme.brightness);
            }
        } else {
             console.log('Cannot control light (no UUID, likely Bonjour discovered only):', light.name);
        }

      } catch (error) {
        console.error(`Failed to control ${light.name}:`, error);
      }
    }
  }

  async controlHomebridgeSpeakers(action, room) {
    const speakers = Array.from(this.homebridgeDevices.values())
      .filter(device => device.type === 'speaker');
    
    console.log(`${action} speakers in ${room}:`, speakers.map(s => s.name));
  }

  async controlHomebridgeCameras(action, room) {
    const cameras = Array.from(this.homebridgeDevices.values())
      .filter(device => device.type === 'camera');
    
    console.log(`${action} cameras in ${room}:`, cameras.map(c => c.name));
  }

  async controlHomebridgeSwitch(deviceName, action) {
    const device = Array.from(this.homebridgeDevices.values())
      .find(d => d.name.toLowerCase().includes(deviceName.toLowerCase()));
    
    if (device) {
        console.log(`${action} ${device.name}`);
        if (device.uuid) {
             const value = action === 'on';
             await this.setAccessoryCharacteristic(device.uuid, 'On', value);
        }
    }
  }

  getRoom(position) {
    if (position.x < 200) return 'Living Room';
    if (position.x < 400) return 'Kitchen';
    if (position.x < 600) return 'Bedroom';
    return 'Unknown';
  }

  inferActivity(newPos, oldPos) {
    if (!oldPos) return 'arriving';
    const distance = Math.sqrt(Math.pow(newPos.x - oldPos.x, 2) + Math.pow(newPos.y - oldPos.y, 2));
    return distance > 100 ? 'moving' : 'stationary';
  }

  async getAutomations() {
    return this.automations;
  }

  async saveAutomation(automation) {
    this.automations.push(automation);
    await this.saveAutomationConfig();
    return true;
  }

  async testSmartDevice(deviceType, action) {
    const devices = Array.from(this.homebridgeDevices.values())
      .filter(device => device.type === deviceType || device.name.toLowerCase().includes(deviceType));
    
    if (devices.length > 0) {
      console.log(`Testing ${deviceType}:`, devices.map(d => d.name));
      // Trigger a test action on the first device found
      if (devices[0].uuid) {
          // Toggle it to prove control
          await this.setAccessoryCharacteristic(devices[0].uuid, 'On', true);
          setTimeout(() => this.setAccessoryCharacteristic(devices[0].uuid, 'On', false), 2000);
      }
      return true;
    }
    return false;
  }

  shouldTriggerAutomation(automation, context, position) {
    if (automation.zone) {
      const inZone = position.x >= automation.zone.x1 && 
                    position.x <= automation.zone.x2 &&
                    position.y >= automation.zone.y1 && 
                    position.y <= automation.zone.y2;
      return inZone && automation.trigger === 'enter';
    }
    return false;
  }

  async saveAutomationConfig() {
    await fs.writeFile(this.configPath, JSON.stringify(this.automations, null, 2));
  }

  async loadAutomationConfig() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      this.automations = JSON.parse(data);
    } catch {
      this.automations = [];
    }
  }

  async loadSettings() {
    try {
      const data = await fs.readFile(path.join(__dirname, '../config/settings.json'), 'utf8');
      const settings = JSON.parse(data);

      if (settings.homebridgeIp) this.homebridgeConfig.ip = settings.homebridgeIp;
      if (settings.homebridgePort) this.homebridgeConfig.port = settings.homebridgePort;
      if (settings.homebridgeUsername) this.homebridgeConfig.username = settings.homebridgeUsername;
      if (settings.homebridgePassword) this.homebridgeConfig.password = settings.homebridgePassword;

      return settings;
    } catch {
      return {};
    }
  }

  startAutomationEngine() {
    console.log('Automation engine started with Homebridge integration');
  }
}

module.exports = { AutomationEngine };
