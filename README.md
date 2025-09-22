# Tool MQTT 解碼器

一個用於解碼感測器設備 Socket 數據並將解碼後的數據發布到 MQTT 代理的 Node.js 應用程式。此工具專為處理高頻感測器數據（包括彎曲、張力、扭轉測量）和低頻數據（如溫度和加速度計讀數）而設計。

## 功能特色

- **Socket 數據解碼**：連接到 Socket 伺服器並解碼傳入的十六進制數據包
- **MQTT 發布**：將解碼後的感測器數據發布到 MQTT 代理
- **高頻數據處理**：處理彎曲（X/Y）、張力和扭轉測量
- **低頻數據處理**：處理溫度和加速度計（ADXL）數據
- **自動重連**：在連接丟失時自動重新連接到 Socket 和 MQTT 代理
- **可配置**：支援環境變數和配置文件
- **事件驅動**：使用 EventEmitter 進行靈活的數據處理

## 安裝

### 系統需求

- Node.js >= 14.0.0
- npm 或 yarn
- 可存取提供感測器數據的 Socket 伺服器
- MQTT 代理（例如 Mosquitto、HiveMQ）

### 安裝依賴

```bash
# 複製儲存庫
git clone https://github.com/yourusername/tool-mqtt-decoder.git
cd tool-mqtt-decoder

# 安裝依賴
npm install
```

## 配置

### 環境變數

複製範例環境文件並根據您的設定進行修改：

```bash
cp .env.example .env
```

編輯 `.env` 文件：

```env
# Socket 配置
SOCKET_HOST=192.168.0.133
SOCKET_PORT=1333
SAMPLE_RATE=10000

# MQTT 配置
MQTT_BROKER=mqtt://localhost:1883
MQTT_TOPIC=sensor/toolholder
```

### 配置文件

您也可以使用位於 `config/default.json` 的 JSON 配置文件：

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

## 使用方法

### 基本使用

```bash
# 執行主應用程式
npm start

# 執行詳細記錄的範例
npm run dev
```

### 程式化使用

```javascript
const SocketDecoderMQTT = require('./src/SocketDecoderMQTT');

const decoder = new SocketDecoderMQTT({
    host: '192.168.0.133',
    port: 1333,
    mqttBroker: 'mqtt://localhost:1883',
    mqttTopic: 'sensor/data'
});

// 監聽解碼數據
decoder.on('dataDecoded', (data) => {
    console.log('接收到感測器數據:', data);
});

// 啟動解碼器
await decoder.start();
```

## 數據格式

解碼後的數據包括：

### 高頻數據
- `MS_BendingX`：X 方向彎曲測量值
- `MS_BendingY`：Y 方向彎曲測量值
- `MS_BendingXY`：組合彎曲幅度
- `MS_Tension`：張力測量值
- `MS_Torsion`：扭轉測量值

### 低頻數據
- `MS_Temperature`：溫度讀數
- `MS_ADXL_X/Y/Z`：加速度計數據

### 狀態數據
- `temp_RSSI`：WiFi 信號強度
- `temp_battery`：電池電量
- `MAC`：設備 MAC 地址
- `Charging_Flag_temp`：充電狀態
- `sleep_mode_temp`：睡眠模式狀態

## API 參考

### SocketDecoderMQTT 類別

#### 建構函數選項

```javascript
const options = {
    host: '192.168.0.133',        // Socket 伺服器 IP
    port: 1333,                   // Socket 伺服器埠號
    sampleRate: 10000,            // 採樣率
    mqttBroker: 'mqtt://localhost:1883',  // MQTT 代理 URL
    mqttTopic: 'sensor/data'      // MQTT 主題
};
```

#### 方法

- `start()`：啟動解碼器並連接到 Socket/MQTT
- `stop()`：停止解碼器並關閉所有連接
- `pause()`：暫停數據處理
- `resume()`：恢復數據處理

#### 事件

- `dataDecoded`：解碼新數據時觸發
- `disconnected`：Socket 連接丟失時觸發
- `error`：發生錯誤時觸發

## 開發

### 專案結構

```
tool-mqtt-decoder/
├── src/
│   ├── SocketDecoderMQTT.js    # 主要解碼器類別
│   ├── index.js                # 應用程式入口點
│   └── example.js              # 使用範例
├── config/
│   └── default.json            # 預設配置
├── package.json
├── .env.example
├── .gitignore
└── README.md
```

### 執行範例

```bash
# 執行基本範例
node src/example.js

# 使用自訂配置執行
SOCKET_HOST=192.168.1.100 MQTT_TOPIC=custom/topic node src/index.js
```

## 故障排除

### 常見問題

1. **連接被拒絕**：檢查 Socket 伺服器是否正在運行且可存取
2. **MQTT 連接失敗**：驗證 MQTT 代理是否正在運行且 URL 正確
3. **未接收到數據**：檢查 Socket 伺服器是否以預期格式發送數據

### 除錯模式

通過設定日誌級別啟用詳細記錄：

```bash
LOG_LEVEL=debug node src/index.js
```

## 貢獻

1. Fork 此儲存庫
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 授權

此專案採用 MIT 授權 - 詳情請參閱 [LICENSE](LICENSE) 文件。

## 支援

如果您遇到任何問題或有疑問，請在 GitHub 上開啟 issue。

---

**English Version**: [README_en.md](README_en.md)
