const mongoose = require('mongoose');

const PrizeSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    'zh': { type: String, required: true },
    'en': { type: String, required: true }
  },
  total: {
    type: Number,
    required: true,
  },
  remaining: {
    type: Number,
    required: true,
  },
  image_icon: {
    type: String,
  },
  image_photo: {
    type: String,
  },
});

module.exports = mongoose.model('Prize', PrizeSchema);