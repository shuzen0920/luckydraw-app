const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db'); // 假設 db.js 位於 config/ 資料夾

// 載入 .env 檔案中的環境變數
dotenv.config();

// 連線到 MongoDB
connectDB();

// 引入所有路由模組
const prizesRouter = require('./routes/prizes');
const resetRouter = require('./routes/reset_route');
const uploadRouter = require('./routes/upload_route');
const drawRouter = require('./routes/raw'); // 負責執行抽獎 (POST /api/draw)
const drawsRouter = require('./routes/draws'); // 負責獲取中獎名單 (GET /api/draws)

const app = express();

// --- 中介軟體 (Middleware) ---

// 啟用 CORS，允許所有來源的請求
app.use(cors());

// 使用 Express 內建的 JSON 解析器，取代舊的 bodyParser
app.use(express.json());

// --- API 路由 ---

// 將所有 API 路由統一掛載到對應的路徑下
app.use('/api/prizes', prizesRouter);
app.use('/api/reset', resetRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/draw', drawRouter); // 執行抽獎的端點
app.use('/api/draws', drawsRouter); // 獲取中獎名單的端點

// --- 靜態檔案服務 ---

// 將 'public' 資料夾設為靜態資源的根目錄
// 這會自動處理對 index.html, admin_dashboard.html, 以及圖片等檔案的請求
app.use(express.static(path.join(__dirname, 'public')));

// --- 伺服器啟動 ---

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器正在 ${PORT} 埠上運行`);
});