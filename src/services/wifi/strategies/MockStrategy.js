const ScannerStrategy = require('./ScannerStrategy');

class MockStrategy extends ScannerStrategy {
  async scan() {
    console.log('Using Mock WiFi Data');
    return [
      { ssid: 'Your_Current_Network', bssid: '00:11:22:33:44:55', signal_level: -45, frequency: 2437, current: true },
      { ssid: 'Xfinity_5G', bssid: '66:77:88:99:AA:BB', signal_level: -52, frequency: 5180 },
      { ssid: 'Neighbor_WiFi', bssid: 'CC:DD:EE:FF:00:11', signal_level: -68, frequency: 2462 },
      { ssid: 'Living_Room_Pod', bssid: '11:22:33:44:55:66', signal_level: -55, frequency: 2412 },
      { ssid: 'Office_Repeater', bssid: 'AA:BB:CC:DD:EE:FF', signal_level: -60, frequency: 5200 }
    ];
  }

  parseOutput(output) {
    return [];
  }
}

module.exports = MockStrategy;
