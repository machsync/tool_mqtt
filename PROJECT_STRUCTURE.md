# Project Structure

```
tool-mqtt-decoder/
├── src/                          # 源代碼目錄
│   ├── SocketDecoderMQTT.js     # 主要的解碼器類
│   ├── index.js                 # 應用程序入口點
│   └── example.js               # 使用示例
├── config/                       # 配置文件目錄
│   └── default.json             # 默認配置
├── node_modules/                 # Node.js 依賴包 (由 npm 管理)
├── .env.example                  # 環境變量示例文件
├── .gitignore                    # Git 忽略規則
├── LICENSE                       # MIT 許可證
├── README.md                     # 項目說明文檔
├── package.json                  # Node.js 項目配置
├── package-lock.json            # 依賴版本鎖定文件
└── PROJECT_STRUCTURE.md         # 本文件
```

## 文件說明

### 核心文件
- **src/SocketDecoderMQTT.js**: 主要的解碼器類，包含所有數據處理邏輯
- **src/index.js**: 應用程序的主入口點，可直接運行
- **src/example.js**: 詳細的使用示例，展示如何使用解碼器

### 配置文件
- **config/default.json**: JSON 格式的默認配置
- **.env.example**: 環境變量配置示例，複製為 .env 使用

### 文檔文件
- **README.md**: 完整的項目說明、安裝和使用指南
- **LICENSE**: MIT 開源許可證
- **PROJECT_STRUCTURE.md**: 項目結構說明

### 項目管理文件
- **package.json**: Node.js 項目配置，包含依賴、腳本等
- **package-lock.json**: 依賴版本鎖定，確保環境一致性
- **.gitignore**: Git 版本控制忽略規則

## 運行方式

```bash
# 安裝依賴
npm install

# 運行主程序
npm start

# 運行示例
npm run dev

# 直接運行
node src/index.js
node src/example.js
```

## 配置方式

1. **環境變量**: 複製 .env.example 為 .env 並修改
2. **配置文件**: 修改 config/default.json
3. **命令行**: 直接設置環境變量運行

## GitHub 準備

項目已經準備好推送到 GitHub：
- 包含完整的 .gitignore
- 有詳細的 README.md
- 包含 MIT 許可證
- 結構清晰，易於維護
- 包含使用示例和文檔
