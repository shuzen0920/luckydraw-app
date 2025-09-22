const mongoose = require('mongoose');

const DrawSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true, // 為 userId 加上索引，以加速查詢
  },
  userName: {
    type: String,
    required: true,
  },
  prizeId: {
    type: String,
    required: true,
  },
  prizeName: {
    'zh': { type: String, required: true },
    'en': { type: String, required: true }
  },
  ipAddress: {
    type: String,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true, // 為時間戳加上索引，以加速排序
  },
});

module.exports = mongoose.model('Draw', DrawSchema);
