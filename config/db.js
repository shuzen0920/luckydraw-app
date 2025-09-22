const mongoose = require('mongoose');
// const { MongoMemoryServer } = require('mongodb-memory-server'); // 改為延後載入

let mongod = null;

const connectDB = async () => {
  try {
    let mongoUri = process.env.MONGO_URI;
 
    // [DEBUG] 讓我們印出環境變數的實際值和類型，以進行診斷
    console.log(`[DEBUG] Checking USE_MEMORY_DB: Value is "${process.env.USE_MEMORY_DB}", Type is "${typeof process.env.USE_MEMORY_DB}"`);

    // 如果環境變數 USE_MEMORY_DB 為 'true'，則使用記憶體資料庫
    if (process.env.USE_MEMORY_DB?.trim() === 'true') {
      let MongoMemoryServer;
      try {
        // 只在需要時才載入此模組，避免在正式環境中因缺少開發依賴而崩潰
        MongoMemoryServer = require('mongodb-memory-server').MongoMemoryServer;
      } catch (e) {
        console.error("錯誤：您試圖使用記憶體資料庫，但 'mongodb-memory-server' 套件未安裝。");
        console.error("請在您的專案目錄中執行 'npm install --save-dev mongodb-memory-server' 來安裝它。");
        process.exit(1);
      }
      console.log('正在啟動記憶體中的 MongoDB 進行測試...');
      mongod = await MongoMemoryServer.create();
      mongoUri = mongod.getUri();
      console.log('記憶體中的 MongoDB 已成功啟動。');
    }

    if (!mongoUri) {
      console.error('資料庫連線錯誤: MONGO_URI 環境變數未設定。');
      process.exit(1);
    }

    // Mongoose 6+ 不再需要傳遞額外選項
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB 已連線: ${conn.connection.host}`);
  } catch (error) {
    console.error(`資料庫連線錯誤: ${error.message}`);
    process.exit(1); // 讓程式在連線失敗時直接退出
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
      console.log('記憶體中的 MongoDB 已停止。');
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

module.exports = { connectDB, disconnectDB };