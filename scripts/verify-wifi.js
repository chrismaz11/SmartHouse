const { WiFiScanner } = require('../src/services/wifiScanner');

async function main() {
  console.log('Starting WiFi verification...');
  const scanner = new WiFiScanner();

  // We don't need initialize() for this simple test as it starts periodic scanning
  // We just want one scan.

  console.log(`Platform: ${process.platform}`);
  console.log('Scanning for networks...');

  try {
    const networks = await scanner.scanNetworks();
    console.log('----------------------------------------');
    console.log(`Found ${networks.length} networks:`);
    networks.forEach(n => {
      console.log(`- SSID: ${n.ssid}, BSSID: ${n.bssid}, Signal: ${n.signal_level}, Freq: ${n.frequency}`);
    });
    console.log('----------------------------------------');

    // Check identification logic
    scanner.identifyAccessPoints();
    const aps = await scanner.getAccessPoints();
    console.log(`Identified ${aps.length} Access Points (Router/Pods):`);
    aps.forEach(ap => {
      console.log(`- ${ap.ssid} (${ap.bssid})`);
    });

  } catch (error) {
    console.error('Verification failed:', error);
  }
}

main();
