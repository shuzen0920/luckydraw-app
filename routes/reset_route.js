const express = require('express');
// 引入 Mongoose 模型
const Draw = require('../models/Draw');
const Prize = require('../models/Prize');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // 1. 清空抽獎紀錄 (draws collection)
    await Draw.deleteMany({});

    // 2. 重設所有獎項的剩餘數量
    // 這個操作會遍歷所有獎項文件，並將 'remaining' 欄位的值設為其 'total' 欄位的值。
    // 如果 'total' 欄位不存在或為 null，則預設為 100。
    // 這是對 `p.remaining = p.total || 100` 邏輯的直接資料庫翻譯。
    await Prize.updateMany({}, [
      {
        $set: {
          remaining: { $ifNull: ['$total', 100] }
        }
      }
    ]);

    // 回傳成功的 JSON 物件
    res.status(200).json({ success: true, message: '✅ 已成功重設抽獎資料' });
  } catch (error) {
    console.error('重設錯誤:', error);
    res.status(500).json({ success: false, error: `❌ 重設失敗: ${error.message}` });
  }
});

module.exports = router;