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
  // --- Add this new field ---
  photo_link: {
    type: String, // The link will be stored as a string.
    default: null // It's optional, so it can be null by default.
  },
});

module.exports = mongoose.model('Prize', PrizeSchema);