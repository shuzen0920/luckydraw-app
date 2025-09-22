const express = require('express');
// 引入 Mongoose Prize 模型
const Prize = require('../models/Prize');
const router = express.Router();

// GET /api/prizes - 取得所有獎項
router.get('/', async (req, res) => {
  try {
    const prizes = await Prize.find({}).sort({ id: 1 }); // 增加確定性的排序，確保順序一致
    res.json(prizes);
  } catch (error) {
    res.status(500).json({ success: false, error: `取得獎項失敗: ${error.message}` });
  }
});

// POST /api/prizes - 新增一個獎項
router.post('/', async (req, res) => {
  try {
    const { id, name_zh, name_en, total, image_icon, image_photo } = req.body;

    // 簡易驗證
    if (!id || !name_zh || !name_en || !total) {
      return res.status(400).json({ success: false, error: 'ID, 中英文名稱和總數為必填欄位。' });
    }

    // 檢查相同 ID 的獎品是否已存在
    const existingPrize = await Prize.findOne({ id });
    if (existingPrize) {
      return res.status(409).json({ success: false, error: '此 ID 的獎品已存在。' });
    }

    const newPrize = new Prize({
      id,
      name: {
        'zh': name_zh,
        'en': name_en,
      },
      total,
      remaining: total, // 新增時，剩餘數量等於總數
      image_icon: image_icon || undefined,
      image_photo: image_photo || undefined,
    });

    await newPrize.save();
    res.status(201).json({ success: true, message: '獎項新增成功', data: newPrize });
  } catch (error) {
    res.status(500).json({ success: false, error: `新增獎項失敗: ${error.message}` });
  }
});

// PUT /api/prizes/:id - 更新指定 ID 的獎項資訊
// 注意：路由已從 POST /update 改為更符合 RESTful 風格的 PUT /:id
router.put('/:id', async (req, res) => {
  try {
    const prizeIdToUpdate = req.params.id;
    const updateData = req.body;

    // 將 name_zh 和 name_en 轉換為 mongoDB 的 dot notation
    if (updateData.name_zh || updateData.name_en) {
      if(updateData.name_zh) updateData['name.zh'] = updateData.name_zh;
      if(updateData.name_en) updateData['name.en'] = updateData.name_en;
      delete updateData.name_zh;
      delete updateData.name_en;
    }

    // 1. 找到原始獎品
    const originalPrize = await Prize.findOne({ id: prizeIdToUpdate });
    if (!originalPrize) {
      return res.status(404).json({ success: false, error: '找不到要更新的獎項' });
    }

    // 2. 如果 ID 被更改，檢查唯一性
    if (updateData.id && updateData.id !== prizeIdToUpdate) {
      const existingPrize = await Prize.findOne({ id: updateData.id });
      if (existingPrize) {
        return res.status(409).json({ success: false, error: `ID '${updateData.id}' 已被其他獎品使用。` });
      }
    }

    // 3. 智慧地更新 'remaining' 數量
    // 如果前端沒有直接提供 'remaining'，但 'total' 被更改了，我們才根據 total 的變化來調整 'remaining'。
    if (updateData.remaining === undefined && updateData.total !== undefined && updateData.total !== originalPrize.total) {
        const totalDiff = updateData.total - originalPrize.total;
        const newRemaining = originalPrize.remaining + totalDiff;
        // 確保剩餘數量不會是負數，也不會超過新的總數
        updateData.remaining = Math.max(0, Math.min(updateData.total, newRemaining));
    } else if (updateData.remaining !== undefined) {
        // 如果直接提供了 remaining，要確保它不超過 total
        const newTotal = updateData.total !== undefined ? updateData.total : originalPrize.total;
        if (updateData.remaining > newTotal) {
            return res.status(400).json({ success: false, error: `剩餘數量 (${updateData.remaining}) 不能超過總數量 (${newTotal})。` });
        }
    }

    // 4. 執行更新
    const updatedPrize = await Prize.findOneAndUpdate(
      { id: prizeIdToUpdate },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    res.json({ success: true, message: '獎項資料更新成功', data: updatedPrize });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: `更新後的獎品 ID 已存在。` });
    }
    res.status(500).json({ success: false, error: `更新獎項失敗: ${error.message}` });
  }
});

// DELETE /api/prizes - 刪除所有獎項
router.delete('/', async (req, res) => {
  try {
    const result = await Prize.deleteMany({});

    res.json({
      success: true,
      message: `已成功刪除所有 ${result.deletedCount} 個獎項。`
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `刪除所有獎項失敗: ${error.message}` });
  }
});

// DELETE /api/prizes/:id - 刪除指定 ID 的獎項
// 注意：路由已從 POST /delete 改為更符合 RESTful 風格的 DELETE /:id
router.delete('/:id', async (req, res) => {
  try {
    const prizeIdToDelete = req.params.id;

    const result = await Prize.deleteOne({ id: prizeIdToDelete });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: '找不到要刪除的獎項' });
    }

    res.json({ success: true, message: `獎項 ${prizeIdToDelete} 已成功刪除` });
  } catch (error) {
    res.status(500).json({ success: false, error: `刪除獎項失敗: ${error.message}` });
  }
});

module.exports = router;