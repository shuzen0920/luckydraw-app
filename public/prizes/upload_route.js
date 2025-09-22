
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const prizesPath = path.join(__dirname, '../data/prizes.json');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/prizes');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, req.body.id + ext);
  }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('image'), (req, res) => {
  const { id, name } = req.body;
  const imageUrl = `/prizes/${req.file.filename}`;

  let prizes = JSON.parse(fs.readFileSync(prizesPath));
  const index = prizes.findIndex(p => p.id === id);
  if (index >= 0) {
    prizes[index].name = name;
    prizes[index].image_url = imageUrl;
  } else {
    prizes.push({ id, name, image_url: imageUrl, remaining: 100 });
  }

  fs.writeFileSync(prizesPath, JSON.stringify(prizes, null, 2));
  res.send(`獎項 ${name} 圖片已成功上傳！`);
});

module.exports = router;
