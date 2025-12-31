const fs = require('fs').promises;
const path = require('path');
const LinuxStrategy = require('./wifi/strategies/LinuxStrategy');
const MacStrategy = require('./wifi/strategies/MacStrategy');
const MockStrategy = require('./wifi/strategies/MockStrategy');

class WiFiScanner {
  constructor() {
    this.networks = [];
    this.accessPoints = [];
    this.configPath = path.join(__dirname, '../config/access-points.json');
    this.strategy = this.selectStrategy();
  }

  selectStrategy() {
    if (process.platform === 'linux') {
      return new LinuxStrategy();
    } else if (process.platform === 'darwin') {
      return new MacStrategy();
    } else {
      console.log('Unsupported platform, falling back to mock data');
      return new MockStrategy();
    }
  }

  async initialize() {
    await this.loadAccessPointConfig();
    this.startPeriodicScanning();
  }

  async scanNetworks() {
    try {
      let networks = [];
      try {
        networks = await this.strategy.scan();
      } catch (error) {
        console.warn(`Primary strategy failed: ${error.message}. Falling back to MockStrategy.`);
        // Fallback to mock if the system tool fails (e.g., nmcli not installed)
        const fallback = new MockStrategy();
        networks = await fallback.scan();
      }
      
      this.networks = networks;
      this.identifyAccessPoints();
      // console.log('Found networks:', this.networks);
      return this.networks;
    } catch (error) {
      console.error('WiFi scan error:', error);
      return [];
    }
  }

  identifyAccessPoints() {
    this.accessPoints = this.networks.filter(network => {
      const ssid = network.ssid?.toLowerCase() || '';
      // Look for any strong signals that could be your home network
      // Note: signal_level might be positive (quality) or negative (dBm) depending on strategy
      // Simple heuristic: if > 0 (quality), strong is > 70? If < 0 (dBm), strong is > -60?

      let isStrong = false;
      if (network.signal_level > 0) {
        isStrong = network.signal_level > 50; // Quality %
      } else {
        isStrong = network.signal_level > -65; // dBm
      }

      return isStrong ||
             ssid.includes('xfinity') || 
             ssid.includes('home') ||
             ssid.includes('wifi') ||
             ssid.includes('pod');
    }).slice(0, 5); // Get top 5 strongest networks
    
    // console.log('Identified access points:', this.accessPoints);
  }

  async getAccessPoints() {
    return this.accessPoints.map(ap => ({
      ...ap,
      position: this.getAccessPointPosition(ap.bssid)
    }));
  }

  getAccessPointPosition(bssid) {
    const saved = this.accessPoints.find(ap => ap.bssid === bssid);
    return saved?.position || { x: 0, y: 0, floor: 1 };
  }

  async saveAccessPointPositions(positions) {
    try {
      await fs.writeFile(this.configPath, JSON.stringify(positions, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving AP positions:', error);
      return false;
    }
  }

  async loadAccessPointConfig() {
    try {
      const data = await fs.readFile(this.configPath, 'utf8');
      const config = JSON.parse(data);
      this.accessPoints = this.accessPoints.map(ap => ({
        ...ap,
        position: config[ap.bssid] || { x: 0, y: 0, floor: 1 }
      }));
    } catch {
      // Config doesn't exist yet
    }
  }

  startPeriodicScanning() {
    setInterval(() => {
      this.scanNetworks();
    }, 10000);
  }
}

module.exports = { WiFiScanner };
