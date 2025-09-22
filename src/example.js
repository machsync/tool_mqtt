const SocketDecoderMQTT = require('./SocketDecoderMQTT');

/**
 * Example usage of SocketDecoderMQTT
 * This file demonstrates how to use the SocketDecoderMQTT class
 */
async function runExample() {
    console.log('=== Tool MQTT Decoder Example ===\n');

    // 創建 SocketDecoderMQTT 實例，使用自定義配置
    const socketDecoder = new SocketDecoderMQTT({
        host: '192.168.0.133',           // 目標 Socket 服務器 IP
        port: 1333,                      // 目標 Socket 服務器端口
        sampleRate: 10000,               // 採樣率
        mqttBroker: 'mqtt://localhost:1883',  // MQTT Broker 地址
        mqttTopic: 'sensor/toolholder'   // MQTT 主題
    });

    // 監聽數據解碼事件
    socketDecoder.on('dataDecoded', (data) => {
        console.log('\n--- New Data Decoded ---');
        console.log(`Timestamp: ${new Date(data.timestamp).toISOString()}`);
        console.log(`Data Count: ${data.dataCount}`);
        console.log(`RSSI: ${data.temp_RSSI}`);
        console.log(`Battery: ${data.temp_battery}`);
        console.log(`MAC: ${data.MAC}`);
        console.log(`Charging: ${data.Charging_Flag_temp}`);
        console.log(`Sleep Mode: ${data.sleep_mode_temp}`);
        
        // 顯示一些高頻數據樣本
        console.log('\nHigh Frequency Data Samples (first 5 points):');
        console.log(`Bending X: [${data.MS_BendingX.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`);
        console.log(`Bending Y: [${data.MS_BendingY.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`);
        console.log(`Tension: [${data.MS_Tension.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`);
        console.log(`Torsion: [${data.MS_Torsion.slice(0, 5).map(v => v.toFixed(3)).join(', ')}]`);
        
        // 顯示低頻數據
        console.log('\nLow Frequency Data:');
        console.log(`Temperature: [${data.MS_Temperature.slice(0, 3).map(v => v.toFixed(2)).join(', ')}]`);
        console.log(`ADXL X: [${data.MS_ADXL_X.slice(0, 3).join(', ')}]`);
        console.log(`ADXL Y: [${data.MS_ADXL_Y.slice(0, 3).join(', ')}]`);
        console.log(`ADXL Z: [${data.MS_ADXL_Z.slice(0, 3).join(', ')}]`);
    });

    // 監聽連接斷開事件
    socketDecoder.on('disconnected', () => {
        console.log('\n⚠️  Connection lost, attempting to reconnect in 3 seconds...');
        setTimeout(() => {
            socketDecoder.start().catch(console.error);
        }, 3000);
    });

    // 監聽錯誤事件
    socketDecoder.on('error', (error) => {
        console.error('\n❌ Error occurred:', error.message);
    });

    // 優雅關閉處理
    process.on('SIGINT', () => {
        console.log('\n\n🛑 Received interrupt signal, shutting down...');
        socketDecoder.stop();
        console.log('✅ Shutdown complete');
        process.exit(0);
    });

    try {
        console.log('🚀 Starting SocketDecoderMQTT...');
        await socketDecoder.start();
        console.log('✅ SocketDecoderMQTT started successfully!');
        console.log('📊 Waiting for data... (Press Ctrl+C to stop)\n');
        
        // 示例：10秒後暫停數據處理
        setTimeout(() => {
            console.log('\n⏸️  Pausing data processing for 5 seconds...');
            socketDecoder.pause();
            
            setTimeout(() => {
                console.log('▶️  Resuming data processing...\n');
                socketDecoder.resume();
            }, 5000);
        }, 10000);
        
    } catch (error) {
        console.error('❌ Failed to start SocketDecoderMQTT:', error);
        process.exit(1);
    }
}

// 只有在直接執行此文件時才運行示例
if (require.main === module) {
    runExample().catch((error) => {
        console.error('❌ Example failed:', error);
        process.exit(1);
    });
}

module.exports = { runExample };
