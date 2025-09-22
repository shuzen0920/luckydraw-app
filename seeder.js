const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// 載入環境變數
dotenv.config();

// 載入所有 Mongoose 模型
const Prize = require('./models/Prize');
const Draw = require('./models/Draw');

// 載入 JSON 檔案讀取工具
const { readJsonFile } = require('./utils');

// 引入共用的資料庫連線函式
const { connectDB, disconnectDB } = require('./config/db');

// 定義舊資料檔案的路徑
const prizesPath = path.join(__dirname, 'data', 'prizes.json');
const drawsPath = path.join(__dirname, 'data', 'draws.json');

// 匯入資料到資料庫的函數
const importData = async () => {
  try {
    // 讀取所有 JSON 檔案
    const prizes = readJsonFile(prizesPath, []);
    const draws = readJsonFile(drawsPath, []);

    // 為了避免重複匯入，我們先清空相關的 collection
    console.log('正在清空舊資料...');
    await Prize.deleteMany();
    await Draw.deleteMany();

    // 使用 insertMany 進行高效的批次匯入
    console.log('正在匯入新資料...');
    await Prize.insertMany(prizes);
    await Draw.insertMany(draws);

    console.log('✅ 資料匯入成功！');
  } catch (error) {
    console.error(`❌ 匯入錯誤: ${error.message}`);
    throw error; // 拋出錯誤讓主函式處理
  }
};

// 從資料庫刪除所有資料的函數
const deleteData = async () => {
  try {
    await Prize.deleteMany();
    await Draw.deleteMany();
    console.log('✅ 資料已成功刪除！');
  } catch (error) {
    console.error(`❌ 刪除錯誤: ${error.message}`);
    throw error; // 拋出錯誤讓主函式處理
  }
};

const main = async () => {
  let exitCode = 0;
  try {
    await connectDB();

    if (process.argv[2] === '-i') {
      await importData();
    } else if (process.argv[2] === '-d') {
      await deleteData();
    } else {
      console.log('請使用 -i 參數匯入資料，或使用 -d 參數刪除資料。');
    }
  } catch (error) {
    console.error('Seeder 執行期間發生錯誤。');
    exitCode = 1;
  } finally {
    await disconnectDB();
    process.exit(exitCode);
  }
};

main();