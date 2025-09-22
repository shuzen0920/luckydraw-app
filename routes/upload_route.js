const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const Prize = require('../models/Prize');

// 設定 Multer，將上傳的檔案暫存在記憶體中
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/upload/prizes
 * 透過上傳 Excel 檔案來批次更新或新增獎品
 */
router.post('/prizes', upload.single('prizesFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: '沒有上傳檔案。' });
  }

  try {
    // 解析上傳的 Excel 檔案
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    if (data.length === 0) {
      return res.status(400).json({ success: false, message: 'Excel 檔案中沒有資料。' });
    }

    // 準備批次更新操作
    const bulkOps = data.map(item => {
      // 確保欄位名稱與模型相符
      const prizeData = {
        id: item.id,
        name: {
          'zh': item.name_zh,
          'en': item.name_en,
        },
        total: item.total,
        remaining: item.remaining !== undefined ? item.remaining : item.total, // 如果沒有提供剩餘數量，則預設為總數
        image_icon: item.image_icon || undefined,
        image_photo: item.image_photo || undefined,
      };

      return {
        updateOne: {
          filter: { id: prizeData.id }, // 根據獎品 ID 尋找
          update: { $set: prizeData },   // 更新資料
          upsert: true,                  // 如果找不到，則新增一筆
        },
      };
    });

    // 執行批次操作
    const result = await Prize.bulkWrite(bulkOps);

    res.json({ success: true, message: '獎品資料已成功匯入/更新。', result });
  } catch (error) {
    console.error('處理上傳檔案時發生錯誤:', error);
    res.status(500).json({ success: false, message: `處理檔案失敗: ${error.message}` });
  }
});

module.exports = router;