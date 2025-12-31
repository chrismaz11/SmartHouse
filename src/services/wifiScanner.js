const fs = require('fs').promises;
const path = require('path');
const { LinuxStrategy, MacStrategy, MockStrategy } = require('./strategies/wifiStrategies');

class WiFiScanner {
  constructor() {
    this.networks = [];
    this.accessPoints = [];
    this.configPath = path.join(__dirname, '../config/access-points.json');

    // Select strategy based on platform
    if (process.platform === 'linux') {
      this.strategy = new LinuxStrategy();
    } else if (process.platform === 'darwin') {
      this.strategy = new MacStrategy();
    } else {
      this.strategy = new MockStrategy();
    }

    // Also use mock strategy if we want to force it or if initialization fails
    // But for now, we trust the platform check.
    // We can wrap the strategy execution in try-catch to fallback to mock.
    this.mockStrategy = new MockStrategy();
  }

  async initialize() {
    await this.loadAccessPointConfig();
    this.startPeriodicScanning();
  }

  async scanNetworks() {
    try {
      this.networks = await this.strategy.scan();
      if (this.networks.length === 0) {
        throw new Error('No networks found');
      }
    } catch (error) {
      console.log(`Scanning with ${this.strategy.constructor.name} failed or found nothing, using MockStrategy.`);
      console.error(error.message); // Log the actual error for debugging
      try {
        this.networks = await this.mockStrategy.scan();
      } catch (mockError) {
        console.error('Mock strategy failed:', mockError);
        this.networks = [];
      }
    }
    
    this.identifyAccessPoints();
    console.log('Found networks:', this.networks);
    return this.networks;
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
