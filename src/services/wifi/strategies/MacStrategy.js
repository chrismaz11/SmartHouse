const { exec } = require('child_process');
const { promisify } = require('util');
const ScannerStrategy = require('./ScannerStrategy');

const execAsync = promisify(exec);

class MacStrategy extends ScannerStrategy {
  async scan() {
    let networks = [];

    // Method 1: Try airport scan
    try {
      const { stdout } = await execAsync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s');
      networks = this.parseAirportOutput(stdout);
    } catch (airportError) {
      console.log('Airport command failed, trying alternatives...');
    }

    // Method 2: Get current network info (if scan fails or to augment)
    // Note: Original code did this. We can keep it or simplify.
    // Let's keep the airport logic as primary for Mac.

    if (networks.length === 0) {
      try {
        const { stdout: profilerOutput } = await execAsync('system_profiler SPAirPortDataType');
        networks = this.parseSystemProfiler(profilerOutput);
      } catch (profilerError) {
        console.log('System profiler failed');
      }
    }

    return networks;
  }

  parseAirportOutput(output) {
    const lines = output.split('\n').slice(1); // Skip header
    const networks = [];

    lines.forEach(line => {
      if (line.trim()) {
        const parts = line.trim().split(/\s+/);
        if (parts.length >= 3) {
          const ssid = parts[0];
          const bssid = parts[1];
          const rssi = parseInt(parts[2]);

          if (ssid && bssid && !isNaN(rssi)) {
            networks.push({
              ssid: ssid === '--' ? 'Hidden Network' : ssid,
              bssid: bssid,
              signal_level: rssi,
              frequency: 2437 // Default or parse if available
            });
          }
        }
      }
    });
    return networks;
  }

  parseSystemProfiler(output) {
    const networks = [];
    const lines = output.split('\n');
    let currentNetwork = {};

    lines.forEach(line => {
      if (line.includes('Network Name:')) {
        if (currentNetwork.ssid) networks.push(currentNetwork);
        currentNetwork = {
          ssid: line.split('Network Name:')[1]?.trim(),
          signal_level: -50,
          frequency: 2437
        };
      }
      if (line.includes('MAC Address:')) {
        currentNetwork.bssid = line.split('MAC Address:')[1]?.trim();
      }
    });

    if (currentNetwork.ssid) networks.push(currentNetwork);
    return networks;
  }

  parseOutput(output) {
    // Implemented internally via specific parsers
    return [];
  }
}

module.exports = MacStrategy;
