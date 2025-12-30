const { GoogleGenerativeAI } = require('@google/generative-ai');
const bonjour = require('bonjour')();
const fs = require('fs').promises;
const path = require('path');

class AutomationEngine {
  constructor() {
    this.automations = [];
    this.geminiClient = null;
    this.homebridgeDevices = new Map();
    this.configPath = path.join(__dirname, '../config/automations.json');
  }

  async initialize() {
    await this.loadAutomationConfig();
    await this.initializeGemini();
    this.discoverHomebridgeDevices();
    this.startAutomationEngine();
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
    bonjour.find({ type: 'hap' }, (service) => {
      console.log('Found Homebridge device:', service.name);
      this.homebridgeDevices.set(service.name, {
        name: service.name,
        host: service.host,
        port: service.port,
        type: this.inferDeviceType(service.name)
      });
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

  async controlHomebridgeLights(theme, room) {
    const lights = Array.from(this.homebridgeDevices.values())
      .filter(device => device.type === 'light');
    
    for (const light of lights) {
      try {
        console.log(`Setting ${light.name} to theme:`, theme);
        // Would send HTTP requests to Homebridge API here
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
      return JSON.parse(data);
    } catch {
      return {};
    }
  }

  startAutomationEngine() {
    console.log('Automation engine started with Homebridge integration');
  }
}

module.exports = { AutomationEngine };
