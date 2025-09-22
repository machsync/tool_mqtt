# Tool MQTT Decoder

A Node.js application for decoding socket data from sensor devices and publishing the decoded data to an MQTT broker. This tool is designed to process high-frequency sensor data including bending, tension, torsion measurements, and low-frequency data such as temperature and accelerometer readings.

## Features

- **Socket Data Decoding**: Connects to a socket server and decodes incoming hexadecimal data packets
- **MQTT Publishing**: Publishes decoded sensor data to an MQTT broker
- **High-Frequency Data Processing**: Handles bending (X/Y), tension, and torsion measurements
- **Low-Frequency Data Processing**: Processes temperature and accelerometer (ADXL) data
- **Auto-Reconnection**: Automatically reconnects to socket and MQTT broker on connection loss
- **Configurable**: Supports environment variables and configuration files
- **Event-Driven**: Uses EventEmitter for flexible data handling

## Installation

### Prerequisites

- Node.js >= 14.0.0
- npm or yarn
- Access to a socket server providing sensor data
- MQTT broker (e.g., Mosquitto, HiveMQ)

### Install Dependencies

```bash
# Clone the repository
git clone https://github.com/yourusername/tool-mqtt-decoder.git
cd tool-mqtt-decoder

# Install dependencies
npm install
```

## Configuration

### Environment Variables

Copy the example environment file and modify it according to your setup:

```bash
cp .env.example .env
```

Edit `.env` file:

```env
# Socket Configuration
SOCKET_HOST=192.168.0.133
SOCKET_PORT=1333
SAMPLE_RATE=10000

# MQTT Configuration
MQTT_BROKER=mqtt://localhost:1883
MQTT_TOPIC=sensor/toolholder
```

### Configuration File

You can also use the JSON configuration file at `config/default.json`:

```json
{
  "socket": {
    "host": "192.168.0.182",
    "port": 1333,
    "sampleRate": 10000
  },
  "mqtt": {
    "broker": "mqtt://127.0.0.1:1883",
    "topic": "testtopic/sensor/data"
  }
}
```

## Usage

### Basic Usage

```bash
# Run the main application
npm start

# Run the example with detailed logging
npm run dev
```

### Programmatic Usage

```javascript
const SocketDecoderMQTT = require('./src/SocketDecoderMQTT');

const decoder = new SocketDecoderMQTT({
    host: '192.168.0.133',
    port: 1333,
    mqttBroker: 'mqtt://localhost:1883',
    mqttTopic: 'sensor/data'
});

// Listen for decoded data
decoder.on('dataDecoded', (data) => {
    console.log('Received sensor data:', data);
});

// Start the decoder
await decoder.start();
```

## Data Format

The decoded data includes:

### High-Frequency Data
- `MS_BendingX`: Bending measurements in X direction
- `MS_BendingY`: Bending measurements in Y direction  
- `MS_BendingXY`: Combined bending magnitude
- `MS_Tension`: Tension measurements
- `MS_Torsion`: Torsion measurements

### Low-Frequency Data
- `MS_Temperature`: Temperature readings
- `MS_ADXL_X/Y/Z`: Accelerometer data

### Status Data
- `temp_RSSI`: WiFi signal strength
- `temp_battery`: Battery level
- `MAC`: Device MAC address
- `Charging_Flag_temp`: Charging status
- `sleep_mode_temp`: Sleep mode status

## API Reference

### SocketDecoderMQTT Class

#### Constructor Options

```javascript
const options = {
    host: '192.168.0.133',        // Socket server IP
    port: 1333,                   // Socket server port
    sampleRate: 10000,            // Sample rate
    mqttBroker: 'mqtt://localhost:1883',  // MQTT broker URL
    mqttTopic: 'sensor/data'      // MQTT topic
};
```

#### Methods

- `start()`: Start the decoder and connect to socket/MQTT
- `stop()`: Stop the decoder and close all connections
- `pause()`: Pause data processing
- `resume()`: Resume data processing

#### Events

- `dataDecoded`: Emitted when new data is decoded
- `disconnected`: Emitted when socket connection is lost
- `error`: Emitted when an error occurs

## Development

### Project Structure

```
tool-mqtt-decoder/
├── src/
│   ├── SocketDecoderMQTT.js    # Main decoder class
│   ├── index.js                # Application entry point
│   └── example.js              # Usage example
├── config/
│   └── default.json            # Default configuration
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

### Running Examples

```bash
# Run the basic example
node src/example.js

# Run with custom configuration
SOCKET_HOST=192.168.1.100 MQTT_TOPIC=custom/topic node src/index.js
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if the socket server is running and accessible
2. **MQTT Connection Failed**: Verify MQTT broker is running and URL is correct
3. **No Data Received**: Check if the socket server is sending data in the expected format

### Debug Mode

Enable detailed logging by setting the log level:

```bash
LOG_LEVEL=debug node src/index.js
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

**中文版本**: [README.md](README.md)
