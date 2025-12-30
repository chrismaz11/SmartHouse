const fs = require('fs').promises;
const path = require('path');

class DeviceTracker {
  constructor() {
    this.devices = new Map();
    this.devicePositions = new Map();
    this.deviceTags = new Map();
    this.configPath = path.join(__dirname, '../config/devices.json');
  }

  async initialize() {
    await this.loadDeviceConfig();
    this.startDeviceTracking();
  }

  async getDevices() {
    return Array.from(this.devices.values());
  }

  async getDevicePositions() {
    return Array.from(this.devicePositions.entries()).map(([mac, position]) => ({
      mac,
      position,
      tag: this.deviceTags.get(mac) || 'Unknown Device',
      lastSeen: this.devices.get(mac)?.lastSeen || Date.now()
    }));
  }

  calculateDistance(rssi, txPower = -59, pathLoss = 2.0) {
    return Math.pow(10, (txPower - rssi) / (10 * pathLoss));
  }

  trilaterate(distances) {
    if (distances.length < 3) return null;
    
    const [ap1, ap2, ap3] = distances;
    const { x: x1, y: y1 } = ap1.position;
    const { x: x2, y: y2 } = ap2.position;
    const { x: x3, y: y3 } = ap3.position;
    const { distance: r1 } = ap1;
    const { distance: r2 } = ap2;
    const { distance: r3 } = ap3;

    const A = 2 * (x2 - x1);
    const B = 2 * (y2 - y1);
    const C = Math.pow(r1, 2) - Math.pow(r2, 2) - Math.pow(x1, 2) + Math.pow(x2, 2) - Math.pow(y1, 2) + Math.pow(y2, 2);
    const D = 2 * (x3 - x2);
    const E = 2 * (y3 - y2);
    const F = Math.pow(r2, 2) - Math.pow(r3, 2) - Math.pow(x2, 2) + Math.pow(x3, 2) - Math.pow(y2, 2) + Math.pow(y3, 2);

    const x = (C * E - F * B) / (E * A - B * D);
    const y = (A * F - D * C) / (A * E - D * B);

    return { x, y, floor: ap1.position.floor };
  }

  updateDevicePosition(mac, accessPoints, rssiValues) {
    const distances = accessPoints.map((ap, i) => ({
      position: ap.position,
      distance: this.calculateDistance(rssiValues[i])
    }));

    const position = this.trilaterate(distances);
    if (position) {
      this.devicePositions.set(mac, position);
    }
  }

  async saveDeviceTags(tags) {
    this.deviceTags = new Map(Object.entries(tags));
    await this.saveDeviceConfig();
    return true;
  }

  async saveDeviceConfig() {
    const config = {
      tags: Object.fromEntries(this.deviceTags),
      positions: Object.fromEntries(this.devicePositions)
    };
    await fs.writeFile(this.configPath, JSON.stringify(config, null, 2));
  }

  async loadDeviceConfig() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(data);
      this.deviceTags = new Map(Object.entries(config.tags || {}));
      this.devicePositions = new Map(Object.entries(config.positions || {}));
    } catch {
      // Config doesn't exist yet
    }
  }

  startDeviceTracking() {
    // Simulate device detection and RSSI monitoring
    setInterval(() => {
      this.simulateDeviceDetection();
    }, 5000);
  }

  simulateDeviceDetection() {
    // This would be replaced with actual device scanning
    const mockDevices = [
      { mac: '00:11:22:33:44:55', rssi: [-45, -52, -48] },
      { mac: '66:77:88:99:AA:BB', rssi: [-38, -65, -55] },
      { mac: 'CC:DD:EE:FF:00:11', rssi: [-60, -42, -58] }
    ];

    const mockAccessPoints = [
      { position: { x: 100, y: 100, floor: 1 } },
      { position: { x: 100, y: 300, floor: 2 } },
      { position: { x: 100, y: 500, floor: 3 } }
    ];

    mockDevices.forEach(device => {
      this.devices.set(device.mac, { 
        mac: device.mac, 
        lastSeen: Date.now(),
        rssi: device.rssi
      });
      this.updateDevicePosition(device.mac, mockAccessPoints, device.rssi);
    });
  }
}

module.exports = { DeviceTracker };
