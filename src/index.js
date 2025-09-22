#!/usr/bin/env node

const SocketDecoderMQTT = require('./SocketDecoderMQTT');

/**
 * Main entry point for the tool-mqtt-decoder application
 */
async function main() {
    // 從環境變量或使用默認配置
    const config = {
        host: process.env.SOCKET_HOST || '192.168.0.133',
        port: parseInt(process.env.SOCKET_PORT) || 1333,
        sampleRate: parseInt(process.env.SAMPLE_RATE) || 10000,
        mqttBroker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
        mqttTopic: process.env.MQTT_TOPIC || 'sensor/toolholder'
    };

    console.log('Starting Tool MQTT Decoder with configuration:');
    console.log(`Socket: ${config.host}:${config.port}`);
    console.log(`MQTT Broker: ${config.mqttBroker}`);
    console.log(`MQTT Topic: ${config.mqttTopic}`);
    console.log(`Sample Rate: ${config.sampleRate}`);

    const socketDecoder = new SocketDecoderMQTT(config);

    // 設置事件監聽器
    socketDecoder.on('dataDecoded', (data) => {
        console.log('Decoded data:', {
            timestamp: data.timestamp,
            dataCount: data.dataCount,
            temp_RSSI: data.temp_RSSI,
            temp_battery: data.temp_battery,
            MAC: data.MAC,
            // 顯示前3個數據點作為範例
            sampleBendingX: data.MS_BendingX.slice(0, 3),
            sampleBendingY: data.MS_BendingY.slice(0, 3),
            sampleTension: data.MS_Tension.slice(0, 3),
            sampleTorsion: data.MS_Torsion.slice(0, 3)
        });
    });

    socketDecoder.on('disconnected', () => {
        console.log('Connection lost, attempting to reconnect in 5 seconds...');
        setTimeout(() => {
            socketDecoder.start().catch(console.error);
        }, 5000);
    });

    socketDecoder.on('error', (error) => {
        console.error('SocketDecoder error:', error);
    });

    // 優雅關閉處理
    process.on('SIGINT', () => {
        console.log('\nReceived SIGINT, shutting down gracefully...');
        socketDecoder.stop();
        process.exit(0);
    });

    process.on('SIGTERM', () => {
        console.log('\nReceived SIGTERM, shutting down gracefully...');
        socketDecoder.stop();
        process.exit(0);
    });

    try {
        await socketDecoder.start();
        console.log('Tool MQTT Decoder is running. Press Ctrl+C to stop.');
    } catch (error) {
        console.error('Failed to start Tool MQTT Decoder:', error);
        process.exit(1);
    }
}

// 只有在直接執行此文件時才運行 main 函數
if (require.main === module) {
    main().catch((error) => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

module.exports = { main };
