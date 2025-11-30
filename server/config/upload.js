const multer = require('multer')
const path = require('path')

//存储配置
const storage = multer.diskStorage({
  //图片存储目录
  destination: function (req, file, cb) {
    const newPath = path.join(__dirname, '../../forum/public/static/images')
    cb(null, newPath)
  },
  // 生成唯一文件名（避免重名）
  filename: function (req, file, cb) {
    const uniqueFileName = `avatar-${Date.now()}-${file.originalname}`;
    cb(null, uniqueFileName);
  }
})

// 初始化 multer
const upload = multer({
  storage,
  // 图片格式与大小限制
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 限制
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPG、PNG 格式图片'), false);
    }
  }
});
module.exports = upload;