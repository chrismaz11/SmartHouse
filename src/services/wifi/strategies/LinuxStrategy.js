const { exec } = require('child_process');
const { promisify } = require('util');
const ScannerStrategy = require('./ScannerStrategy');

const execAsync = promisify(exec);

class LinuxStrategy extends ScannerStrategy {
  async scan() {
    try {
      // -t: terse output (colon separated)
      // -f: fields
      const { stdout } = await execAsync('nmcli -t -f SSID,BSSID,SIGNAL,FREQ device wifi list');
      return this.parseOutput(stdout);
    } catch (error) {
      // Don't log full error stack to console if it's just command not found (common in dev/mac)
      if (error.code !== 127) { // 127 is command not found
         console.warn(`Linux scan warning: ${error.message}`);
      }
      throw error;
    }
  }

  parseOutput(output) {
    const networks = [];
    const lines = output.split('\n');

    lines.forEach(line => {
      if (!line.trim()) return;

      // NMCLI terse format: SSID:BSSID:SIGNAL:FREQ
      // Colons within values are escaped with backslash (e.g., 11\:22\:33...)

      // Step 1: Temporarily replace escaped colons to safe placeholder
      const safeLine = line.replace(/\\:/g, '__ESCAPED_COLON__');

      const parts = safeLine.split(':');
      if (parts.length < 4) return;

      // We expect exactly 4 parts: SSID, BSSID, SIGNAL, FREQ
      // However, if SSID contained unescaped colons (shouldn't happen in terse mode),
      // parts would be > 4. But we asked for 4 specific fields.
      // Let's pop from the end to be safe.

      const freqStr = parts.pop();
      const signalStr = parts.pop();
      const bssidStr = parts.pop();
      // The rest is SSID
      const ssidStr = parts.join(':');

      const freq = parseInt(freqStr);
      const signal = parseInt(signalStr); // Usually 0-100 (Quality)

      // Restore colons
      const bssid = bssidStr.replace(/__ESCAPED_COLON__/g, ':');
      const ssid = ssidStr.replace(/__ESCAPED_COLON__/g, ':');

      if (bssid && !isNaN(signal)) {
        networks.push({
          ssid: ssid || 'Hidden Network',
          bssid: bssid,
          signal_level: signal,
          frequency: freq
        });
      }
    });

    return networks;
  }
}

module.exports = LinuxStrategy;
