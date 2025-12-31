const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class WifiStrategy {
  async scan() {
    throw new Error('scan() must be implemented');
  }
}

class LinuxStrategy extends WifiStrategy {
  async scan() {
    try {
      // nmcli -t -f SSID,BSSID,SIGNAL,FREQ,SECURITY dev wifi
      // -t: terse output
      // -f: fields
      const { stdout } = await execAsync('nmcli -t -f SSID,BSSID,SIGNAL,FREQ,SECURITY dev wifi');
      return this.parseOutput(stdout);
    } catch (error) {
      console.error('Linux scan failed:', error);
      throw error;
    }
  }

  parseOutput(output) {
    const networks = [];
    const lines = output.split('\n');

    for (const line of lines) {
      if (!line.trim()) continue;

      // Handle escaped colons (\:) in fields like BSSID
      // We replace escaped colons with a placeholder, split by colon, then restore
      const placeholder = '__ESCAPED_COLON__';
      const cleanLine = line.replace(/\\:/g, placeholder);
      const parts = cleanLine.split(':');

      if (parts.length >= 4) {
        const ssid = parts[0].replace(new RegExp(placeholder, 'g'), ':');
        const bssid = parts[1].replace(new RegExp(placeholder, 'g'), ':');
        const signal = parseInt(parts[2].replace(new RegExp(placeholder, 'g'), ':'));
        const freq = parseInt(parts[3].replace(new RegExp(placeholder, 'g'), ':'));
        // security is parts[4]

        if (bssid && !isNaN(signal)) {
            networks.push({
                ssid: ssid || 'Hidden Network',
                bssid: bssid,
                signal_level: signal, // nmcli usually gives signal as 0-100 or dBm.
                // Wait, nmcli SIGNAL is usually signal strength 0-100. RSSI is usually in dBm.
                // If it is 0-100, we might need to convert or check if it's RSSI.
                // `nmcli -f SIGNAL` gives bars/quality. `nmcli -f SIGNAL,SSID`...
                // Actually `nmcli` SIGNAL field is typically quality %.
                // However, `nmcli -f IN-USE,SSID,BSSID,SIGNAL,BARS,SECURITY`...
                // Some versions of nmcli give RSSI in dBm if specific fields are requested?
                // `nmcli -f WIFI-PROPERTIES.SIGNAL`?
                // Let's assume for now it is consistent with other strategies or we need to normalize.
                // Mac strategy assumes negative dBm values (-50).
                // If nmcli gives positive 0-100, we should probably map it.
                // Rough mapping: dBm = (Quality / 2) - 100
                // e.g. 100% -> -50dBm. 0% -> -100dBm.
                // Let's check if the value is > 0, then convert.
                frequency: freq
            });
        }
      }
    }

    // Normalize signal levels if they are quality percentages (0-100)
    return networks.map(n => {
        if (n.signal_level > 0) {
            n.signal_level = Math.floor((n.signal_level / 2) - 100);
        }
        return n;
    });
  }
}

class MacStrategy extends WifiStrategy {
  async scan() {
    let networks = [];

    // Method 1: Try airport scan
    try {
      const { stdout } = await execAsync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -s');
      networks = this.parseAirportOutput(stdout);
    } catch (airportError) {
      console.log('Airport command failed, trying alternatives...');
    }

    // Method 2: Get current network info
    try {
      const { stdout: currentNetwork } = await execAsync('/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport -I');
      const currentInfo = this.parseCurrentNetwork(currentNetwork);
      if (currentInfo) {
        // Remove duplicate if exists from scan
        networks = networks.filter(n => n.bssid !== currentInfo.bssid);
        networks.unshift(currentInfo); // Add current network first
      }
    } catch (currentError) {
      console.log('Current network detection failed');
    }

    // Method 3: Use system_profiler as fallback
    if (networks.length === 0) {
      try {
        const { stdout: profilerOutput } = await execAsync('system_profiler SPAirPortDataType');
        networks = this.parseSystemProfiler(profilerOutput);
      } catch (profilerError) {
        console.log('System profiler failed');
        throw profilerError;
      }
    }

    if (networks.length === 0) {
        throw new Error('No networks found on Mac');
    }

    return networks;
  }

  parseCurrentNetwork(output) {
    const lines = output.split('\n');
    let ssid = null;
    let bssid = null;
    let rssi = null;

    lines.forEach(line => {
      if (line.includes('SSID:')) {
        ssid = line.split('SSID:')[1]?.trim();
      }
      if (line.includes('BSSID:')) {
        bssid = line.split('BSSID:')[1]?.trim();
      }
      if (line.includes('agrCtlRSSI:')) {
        rssi = parseInt(line.split('agrCtlRSSI:')[1]?.trim());
      }
    });

    if (ssid && bssid) {
      return {
        ssid,
        bssid,
        signal_level: rssi || -50,
        frequency: 2437,
        current: true
      };
    }
    return null;
  }

  parseSystemProfiler(output) {
    const networks = [];
    const lines = output.split('\n');

    let currentNetwork = {};
    lines.forEach(line => {
      if (line.includes('Network Name:')) {
        if (currentNetwork.ssid) {
          networks.push(currentNetwork);
        }
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

    if (currentNetwork.ssid) {
      networks.push(currentNetwork);
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
              frequency: 2437
            });
          }
        }
      }
    });

    return networks;
  }
}

class MockStrategy extends WifiStrategy {
  async scan() {
    return [
      { ssid: 'Your_Current_Network', bssid: '00:11:22:33:44:55', signal_level: -45, frequency: 2437, current: true },
      { ssid: 'Xfinity_5G', bssid: '66:77:88:99:AA:BB', signal_level: -52, frequency: 5180 },
      { ssid: 'Neighbor_WiFi', bssid: 'CC:DD:EE:FF:00:11', signal_level: -68, frequency: 2462 }
    ];
  }
}

module.exports = { LinuxStrategy, MacStrategy, MockStrategy };
