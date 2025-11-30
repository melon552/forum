// routes/upload.js
const express = require('express');
const router = express.Router();
const upload = require('../config/upload');

router.post('/avatar', upload.single('avatar'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, msg: '请选择要上传的图片' });
  }

  // 动态生成正确的 base URL（支持 http/https + 域名/IP）
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const avatarUrl = `${baseUrl}/static/images/${req.file.filename}`;

  res.json({
    code: 200,
    data: {
      url: avatarUrl,
      filename: req.file.filename
    },
    msg: '图片上传成功'
  });
  console.log('文件保存路径:', req.file.path); // 输出实际保存路径
  console.log('文件名:', req.file.filename);
});

module.exports = router;