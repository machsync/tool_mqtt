const net = require('net');
const mqtt = require('mqtt');
const EventEmitter = require('events');

/**
 * SocketDecoderMQTT - A class for decoding socket data and publishing to MQTT
 * 
 * This class connects to a socket server, decodes incoming data packets,
 * and publishes the decoded data to an MQTT broker.
 */
class SocketDecoderMQTT extends EventEmitter {
    constructor(options = {}) {
        super();
        
        // Socket 配置
        this.host = options.host || '192.168.0.182';
        this.port = options.port || 1333;
        this.sampleRate = options.sampleRate || 10000;
        
        // MQTT 配置
        this.mqttBroker = options.mqttBroker || 'mqtt://127.0.0.1:1883';
        this.mqttTopic = options.mqttTopic || 'testtopic/sensor/data';
        
        // 計算參數 (與 Python 版本一致)
        this.SamplePoint1 = Math.ceil(this.sampleRate / 12.5);
        this.sample_N = Math.ceil(this.SamplePoint1 * 1.005);
        this.sample_byte = this.sample_N * 16;
        this.SamplePoint2 = Math.floor(this.SamplePoint1 / 200);
        this.expectedDataLength = this.sample_N * 32; // 十六進制字符數
        
        // 狀態控制
        this.running = false;
        this.paused = false;
        this.socket = null;
        this.mqttClient = null;
        
        // 數據緩存
        this.collectData = '';
        
        // MQTT 發送定時器
        this.mqttTimer = null;
        this.lastDecodedData = null;
        
        console.log(`SamplePoint1: ${this.SamplePoint1}, sample_N: ${this.sample_N}`);
        console.log(`Expected data length: ${this.expectedDataLength} hex chars`);
    }

    async start() {
        try {
            await this.connectMQTT();
            await this.connectSocket();
            this.startMQTTTimer();
            this.running = true;
            console.log('SocketDecoderMQTT started successfully');
        } catch (error) {
            console.error('Failed to start:', error);
            throw error;
        }
    }

    async connectMQTT() {
        return new Promise((resolve, reject) => {
            this.mqttClient = mqtt.connect(this.mqttBroker);
            
            this.mqttClient.on('connect', () => {
                console.log('MQTT connected');
                resolve();
            });
            
            this.mqttClient.on('error', (error) => {
                console.error('MQTT error:', error);
                reject(error);
            });
        });
    }

    async connectSocket() {
        return new Promise((resolve, reject) => {
            this.socket = new net.Socket();
            
            this.socket.connect(this.port, this.host, () => {
                console.log(`Socket connected to ${this.host}:${this.port}`);
                this.setupSocketHandlers();
                resolve();
            });
            
            this.socket.on('error', (error) => {
                console.error('Socket error:', error);
                reject(error);
            });
        });
    }

    setupSocketHandlers() {
        this.socket.on('data', (data) => {
            if (this.paused) {
                this.collectData = '';
                return;
            }
            
            const hexData = data.toString('hex');
            this.processRawData(hexData);
        });

        this.socket.on('close', () => {
            console.log('Socket connection closed');
            this.emit('disconnected');
        });

        this.socket.on('error', (error) => {
            console.error('Socket error:', error);
            this.emit('error', error);
        });
    }

    processRawData(hexData) {
        try {
            // 累積數據
            this.collectData += hexData;
            
            // 檢查是否有足夠的數據進行解碼
            while (this.collectData.length >= this.expectedDataLength) {
                // 提取一個完整的數據包
                const completePacket = this.collectData.substring(0, this.expectedDataLength);
                
                // 解碼數據
                const decodedData = this.socketDecoder(completePacket);
                if (decodedData) {
                    this.lastDecodedData = decodedData;
                    this.emit('dataDecoded', decodedData);
                }
                
                // 移除已處理的數據
                this.collectData = this.collectData.substring(this.expectedDataLength);
            }
            
        } catch (error) {
            console.error('Error processing raw data:', error);
        }
    }

    socketDecoder(hexData) {
        // 初始化數組 (與 Python 版本一致)
        const MS_BendingX = new Array(this.SamplePoint1).fill(0);
        const MS_BendingY = new Array(this.SamplePoint1).fill(0);
        const MS_BendingXY = new Array(this.SamplePoint1).fill(0);
        const MS_Tension = new Array(this.SamplePoint1).fill(0);
        const MS_Torsion = new Array(this.SamplePoint1).fill(0);
        
        const MS_Temperature = new Array(this.SamplePoint2).fill(0);
        const MS_ADXL_X = new Array(this.SamplePoint2).fill(0);
        const MS_ADXL_Y = new Array(this.SamplePoint2).fill(0);
        const MS_ADXL_Z = new Array(this.SamplePoint2).fill(0);
        
        let Append_index = 0;
        let temp_RSSI = 0;
        let Charging_Flag_temp = false;
        let sleep_mode_temp = false;
        let temp_battery = 0;
        let MAC = '';
        
        console.log(`Decoding data length: ${hexData.length}, expected: ${this.expectedDataLength}`);
        
        try {
            for (let i = 0; i < this.sample_N; i++) {
                const offset = i * 32;
                
                // 檢查是否有足夠的數據
                if (offset + 32 > hexData.length) {
                    console.warn(`Not enough data at offset ${offset}, breaking`);
                    break;
                }
                
                // 檢查是否為低頻資料 (每201筆的第一筆)
                if (i % 201 === 0) {
                    // 解析低頻數據
                    const lowFreqData = this.decodeLowFreqData(hexData, offset);
                    
                    const index = Math.floor(i / 201);
                    if (index < this.SamplePoint2) {
                        MS_ADXL_X[index] = lowFreqData.Data_ADXL_X;
                        MS_ADXL_Y[index] = lowFreqData.Data_ADXL_Y;
                        MS_ADXL_Z[index] = lowFreqData.Data_ADXL_Z;
                        if (lowFreqData.data_temperature < 125) {
                            MS_Temperature[index] = lowFreqData.data_temperature;
                        }
                    }
                    
                    temp_RSSI = lowFreqData.wifi_RSSI;
                    Charging_Flag_temp = lowFreqData.is_charging;
                    sleep_mode_temp = lowFreqData.is_sleeping;
                    MAC = lowFreqData.MAC;
                    
                    continue;
                }
                
                // 處理高頻資料
                if (Append_index < this.SamplePoint1) {
                    const highFreqData = this.decodeHighFreqData(hexData, offset);
                    
                    MS_BendingX[Append_index] = highFreqData.Data_x;
                    MS_BendingY[Append_index] = highFreqData.Data_y;
                    MS_BendingXY[Append_index] = Math.sqrt(
                        highFreqData.Data_x * highFreqData.Data_x + 
                        highFreqData.Data_y * highFreqData.Data_y
                    );
                    MS_Tension[Append_index] = highFreqData.Data_ten;
                    MS_Torsion[Append_index] = highFreqData.Data_tor;
                    
                    temp_battery = highFreqData.Data_battery;
                    Append_index++;
                }
            }
        } catch (error) {
            console.error('Error in socketDecoder:', error);
            return null;
        }
        
        console.log(`Successfully decoded ${Append_index} high-freq data points`);
        
        return {
            timestamp: Date.now(),
            // 高頻數據 (原始解碼值，未換算)
            MS_BendingX: MS_BendingX,
            MS_BendingY: MS_BendingY,
            MS_BendingXY: MS_BendingXY,
            MS_Tension: MS_Tension,
            MS_Torsion: MS_Torsion,
            // 低頻數據
            MS_Temperature: MS_Temperature,
            MS_ADXL_X: MS_ADXL_X,
            MS_ADXL_Y: MS_ADXL_Y,
            MS_ADXL_Z: MS_ADXL_Z,
            // 狀態數據
            temp_RSSI: temp_RSSI,
            Charging_Flag_temp: Charging_Flag_temp,
            sleep_mode_temp: sleep_mode_temp,
            temp_battery: temp_battery,
            MAC: MAC,
            dataCount: Append_index
        };
    }

    decodeLowFreqData(hexData, offset) {
        const Data_ADXL_X = this.decodeHex16StrToInt(hexData.substr(offset, 4));
        const Data_ADXL_Y = this.decodeHex16StrToInt(hexData.substr(offset + 4, 4));
        const Data_ADXL_Z = this.decodeHex16StrToInt(hexData.substr(offset + 8, 4));
        const data_temperature = this.decodeHex16StrToInt(
            hexData.substr(offset + 14, 2) + hexData.substr(offset + 12, 2)
        ) / 128; // 溫度，高低位元有錯位
        const wifi_RSSI = this.decodeHex16StrToInt(hexData.substr(offset + 16, 2));
        
        const chargingFlag = this.decodeHex16StrToInt(hexData.substr(offset + 19, 1));
        const is_charging = (chargingFlag & 0x1) === 1;
        const is_sleeping = (chargingFlag & 0x2) === 2;
        
        const MAC = hexData.substr(offset + 20, 12);
        
        return {
            Data_ADXL_X,
            Data_ADXL_Y,
            Data_ADXL_Z,
            data_temperature,
            wifi_RSSI,
            is_charging,
            is_sleeping,
            MAC
        };
    }

    decodeHighFreqData(hexData, offset) {
        const Data_x = this.decodeHex16StrToFloat(hexData.substr(offset, 4));
        const Data_y = this.decodeHex16StrToFloat(hexData.substr(offset + 4, 4));
        const Data_ten = this.decodeHex16StrToFloat(hexData.substr(offset + 8, 4));
        const Data_tor = this.decodeHex16StrToFloat(hexData.substr(offset + 12, 4));
        const Data_battery = this.decodeHex16StrToFloat(hexData.substr(offset + 16, 4));
        
        return {
            Data_x: parseFloat(Data_x.toFixed(6)),
            Data_y: parseFloat(Data_y.toFixed(6)),
            Data_ten: parseFloat(Data_ten.toFixed(6)),
            Data_tor: parseFloat(Data_tor.toFixed(6)),
            Data_battery: parseFloat(Data_battery.toFixed(3))
        };
    }

    decodeHex16StrToFloat(hexStr) {
        if (!hexStr || hexStr.length !== 4) {
            console.warn('Invalid hex string for float:', hexStr);
            return 0;
        }
        
        try {
            const intValue = parseInt(hexStr, 16);
            if (isNaN(intValue)) {
                console.warn('Failed to parse hex:', hexStr);
                return 0;
            }
            return intValue / 6553.5; // _HEX16_TO_FLOAT_DIVISOR
        } catch (error) {
            console.error('Error converting hex to float:', error);
            return 0;
        }
    }

    decodeHex16StrToInt(hexStr) {
        if (!hexStr) {
            console.warn('Invalid hex string for int:', hexStr);
            return 0;
        }

        try {
            const intValue = parseInt(hexStr, 16);
            return isNaN(intValue) ? 0 : intValue;
        } catch (error) {
            console.error('Error converting hex to int:', error);
            return 0;
        }
    }

    startMQTTTimer() {
        this.mqttTimer = setInterval(() => {
            if (this.lastDecodedData && this.mqttClient && this.mqttClient.connected) {
                this.publishToMQTT(this.lastDecodedData);
            }
        }, 1000); // 每秒發送一次
    }

    publishToMQTT(data) {
        try {
            if (!data || data.dataCount === 0) {
                console.warn('No valid data to publish');
                return;
            }

            const payload = JSON.stringify(data);
            this.mqttClient.publish(this.mqttTopic, payload, (error) => {
                if (error) {
                    console.error('MQTT publish error:', error);
                } else {
                    console.log(`Data published to MQTT: ${data.timestamp}, count: ${data.dataCount}`);
                }
            });
        } catch (error) {
            console.error('Error publishing to MQTT:', error);
        }
    }

    pause() {
        this.paused = true;
        this.collectData = '';
        console.log('Data processing paused');
    }

    resume() {
        this.paused = false;
        console.log('Data processing resumed');
    }

    stop() {
        this.running = false;

        if (this.mqttTimer) {
            clearInterval(this.mqttTimer);
            this.mqttTimer = null;
        }

        if (this.socket) {
            this.socket.destroy();
            this.socket = null;
        }

        if (this.mqttClient) {
            this.mqttClient.end();
            this.mqttClient = null;
        }

        console.log('SocketDecoderMQTT stopped');
    }
}

module.exports = SocketDecoderMQTT;
