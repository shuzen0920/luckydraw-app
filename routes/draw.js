const express = require('express');
const router = express.Router();
const Prize = require('../models/Prize');
const Draw = require('../models/Draw');
const { getCleanIPv4 } = require('../utils');

// --- 設定 ---
// 設為 true 來啟用 IP + 工號檢查，設為 false 則只檢查工號。
// 在正式環境中，建議從環境變數讀取 (e.g., process.env.CHECK_IP_ENABLED === 'true')
const CHECK_IP_AND_USERID = false;

/**
 * GET /api/draws
 * 取得所有中獎紀錄
 */
router.get('/', async (req, res) => {
  try {
    // Sort by timestamp descending to show newest first
    const draws = await Draw.find({}).sort({ timestamp: -1 });
    res.json(draws);
  } catch (error) {
    console.error('取得中獎名單時發生錯誤:', error);
    res.status(500).json({ success: false, message: '無法取得中獎名單' });
  }
});

/**
 * POST /api/draw
 * 執行一次抽獎
 */
router.post('/', async (req, res) => {
  const { userId, userName } = req.body;
  const rawIp = (req.headers['x-forwarded-for'] || '').split(',').shift() || req.socket.remoteAddress;
  const ipAddress = getCleanIPv4(rawIp);

  if (!userId || !userName) {
    return res.status(400).json({ success: false, message: '需要提供使用者 ID 和姓名。' });
  }

  try {
    // 1. 根據設定檢查使用者是否已經抽過獎
    let query = { userId };
    if (CHECK_IP_AND_USERID) {
      query = { $or: [{ userId }, { ipAddress }] };
    }
    const existingDraw = await Draw.findOne(query);

    if (existingDraw) {
      return res.status(409).json({ success: false, message: '您已經參加過抽獎，不能重複參加。', prize: existingDraw });
    }

    // 2. 找出所有還有剩餘數量的獎品
    const availablePrizes = await Prize.find({ remaining: { $gt: 0 } }).sort({ id: 1 }); // 增加確定性的排序，確保與前端順序一致
    if (availablePrizes.length === 0) {
      return res.status(404).json({ success: false, message: '所有獎品都已經被抽完了！' });
    }

    // 3. 執行加權隨機抽獎 (以剩餘數量作為權重)
    const totalWeight = availablePrizes.reduce((sum, p) => sum + p.remaining, 0);
    let randomPoint = Math.random() * totalWeight;
    let selectedPrize = null;

    for (const prize of availablePrizes) {
      randomPoint -= prize.remaining;
      if (randomPoint <= 0) {
        selectedPrize = prize;
        break;
      }
    }

    // 4. 原子性地扣減獎品數量
    // 這是關鍵一步，確保在高併發下資料的一致性
    const updatedPrize = await Prize.findOneAndUpdate(
      { _id: selectedPrize._id, remaining: { $gt: 0 } }, // 再次確認還有庫存
      { $inc: { remaining: -1 } }, // 將 remaining 數量減 1
      { new: true } // 回傳更新後的文件
    );

    if (!updatedPrize) {
      // 如果在高併發的瞬間，獎品剛好被抽完，則提示使用者再試一次
      return res.status(503).json({ success: false, message: '手速太慢了，獎品剛好被抽走，請再試一次！' });
    }

    // 5. 記錄中獎結果
    const newDraw = new Draw({
      userId,
      userName,
      prizeId: updatedPrize.id,
      prizeName: updatedPrize.name,
      ipAddress: ipAddress,
    });
    await newDraw.save();

    res.status(201).json({ success: true, message: '恭喜中獎！', prize: updatedPrize });
  } catch (error) {
    console.error('抽獎時發生錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器發生內部錯誤，請稍後再試。' });
  }
});

/**
 * GET /api/draw/check
 * 檢查指定使用者(或IP)是否已抽過獎 (修正以符合前端 API 呼叫)
 */
router.get('/check', async (req, res) => {
  try {
    const { userId } = req.query; // 從查詢參數(query)獲取
    if (!userId) {
      return res.status(400).json({ success: false, message: '需要提供使用者 ID。' });
    }

    // 根據設定建立查詢條件
    let query = { userId };
    if (CHECK_IP_AND_USERID) {
      const rawIp = (req.headers['x-forwarded-for'] || '').split(',').shift() || req.socket.remoteAddress;
      const ipAddress = getCleanIPv4(rawIp);
      query = { $or: [{ userId }, { ipAddress }] };
    }
    const existingDraw = await Draw.findOne(query);

    if (existingDraw) {
      res.json({ hasDrawn: true, prize: existingDraw });
    } else {
      res.json({ hasDrawn: false });
    }
  } catch (error) {
    console.error(`檢查抽獎資格時發生錯誤 (userId: ${req.query.userId}):`, error);
    res.status(500).json({ success: false, message: '伺服器發生內部錯誤，無法查詢資格。' });
  }
});

module.exports = router;