const express = require('express');
const router = express.Router();
// 引入 Mongoose 的 Draw 模型，用於操作資料庫中的 draws 集合
const Draw = require('../models/Draw');
const Prize = require('../models/Prize');

/**
 * GET /api/draws
 * 取得所有中獎紀錄
 * 這個路由的主要目的是提供給管理後台 (admin_dashboard.html) 顯示中獎名單。
 */
router.get('/', async (req, res) => {
  try {
    // 從資料庫中尋找所有的中獎紀錄，並根據時間戳（timestamp）進行降序排序
    // 這樣最新的中獎者會顯示在最前面
    const draws = await Draw.find({}).sort({ timestamp: -1 });
    res.json(draws);
  } catch (error) {
    // 如果在查詢資料庫時發生任何錯誤，則回傳 500 伺服器錯誤
    res.status(500).json({ success: false, error: `取得中獎名單失敗: ${error.message}` });
  }
});

/**
 * DELETE /api/draws/:id
 * 刪除一筆中獎紀錄，並將獎品數量加回
 */
router.delete('/:id', async (req, res) => {
  try {
    const drawIdToDelete = req.params.id;

    // 1. 找到要刪除的中獎紀錄
    const drawToDelete = await Draw.findById(drawIdToDelete);
    if (!drawToDelete) {
      return res.status(404).json({ success: false, error: '找不到要刪除的中獎紀錄' });
    }

    // 2. 將對應的獎品數量加回 1
    // 這裡假設獎品不會被刪除
    await Prize.updateOne(
      { id: drawToDelete.prizeId },
      { $inc: { remaining: 1 } }
    );

    // 3. 刪除中獎紀錄
    await Draw.findByIdAndDelete(drawIdToDelete);

    res.json({ success: true, message: '中獎紀錄已成功刪除，獎品數量已復原。' });
  } catch (error) {
    res.status(500).json({ success: false, error: `刪除中獎紀錄失敗: ${error.message}` });
  }
});

module.exports = router;