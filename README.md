# WiFi Triangulation System with Gemini AI

A comprehensive smart home automation system that uses WiFi triangulation to track device locations and trigger intelligent automations powered by Google Gemini AI.

## Features

- **WiFi Triangulation**: Track device locations using RSSI measurements from multiple access points
- **Gemini AI Integration**: AI-powered lighting themes and automation decisions
- **Smart Home Integration**: Control LIFX, Nanoleaf, Wyze, Ring, Sonos, Apple TV, and more
- **Interactive Floor Plans**: Lovelace-style visualization with device tracking
- **Personal Device Tracking**: Tag and track family members' devices
- **Zone-based Automation**: Trigger actions when people enter/exit specific areas
- **Real-time Monitoring**: Live device position updates and signal strength monitoring

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd wifi-triangulation-system
```

2. Install dependencies:
```bash
npm install
```

3. Configure your settings:
   - Open the app and go to Settings
   - Add your Gemini API key
   - Configure smart device credentials
   - Adjust triangulation parameters

4. Run the application:
```bash
npm start
```

## Configuration

### Gemini AI Setup
1. Get a Gemini API key from Google AI Studio
2. Enter the key in Settings > Gemini AI Configuration

### Smart Device Setup
- **LIFX**: Get API token from LIFX Cloud
- **Nanoleaf**: Find device IP address on your network
- **Ring**: Use your Ring account credentials
- **Wyze**: Get API key from Wyze developer portal
- **Sonos**: Devices auto-discovered on network

### Access Point Configuration
1. Go to Network tab
2. Scan for networks to identify your Xfinity router and pods
3. Manually position access points on the floor plan
4. Save configuration

## Usage

### Device Tracking
1. Go to Devices tab
2. Tag detected devices with names (e.g., "John's Phone")
3. View real-time device positions on floor plan

### Automation Rules
1. Go to Automation tab
2. Create rules based on person + zone combinations
3. Choose actions: lighting, music, security, appliances
4. Test smart device connections

### Floor Plan Visualization
1. Upload floor plan images for each floor
2. View real-time device positions
3. Zoom and pan for detailed tracking
4. Switch between floors

## Technical Details

### Triangulation Algorithm
- Uses RSSI-to-distance conversion: `d = 10^((A - RSSI) / (10 * n))`
- Geometric trilateration with 3+ access points
- Position smoothing and error correction

### AI Integration
- Context-aware lighting theme generation
- Learning system for user preferences
- Time, location, and activity pattern analysis

### Smart Device APIs
- LIFX LAN protocol for local control
- Nanoleaf OpenAPI integration
- Ring REST API for security features
- Sonos UPnP for music control

## Development

Built with:
- Electron for cross-platform desktop app
- Node.js for backend services
- HTML5 Canvas for floor plan visualization
- Google Gemini AI for intelligent automation

## License

MIT License - see LICENSE file for details
# SmartHouse
