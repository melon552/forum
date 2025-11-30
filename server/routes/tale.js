const express = require('express');
const router = express.Router();
const taleCtrl = require('../controllers/taleCtrl');
const userAuth = require('../middleware//userAuth'); // 登录验证
const adminAuth = require('../middleware/adminAuth')
const { checkTaleOwnerOrAdmin } = require('../middleware/taleAuth'); // 故事权限验证
const authMiddleware = (req, res, next) => {
  // 先尝试管理员鉴权，失败则尝试普通用户鉴权
  adminAuth(req, res, (adminErr) => {
    if (adminErr) {
      userAuth(req, res, next);
    } else {
      next();
    }
  });
};
// 1. 公开接口（无需登录）
router.get('/list', taleCtrl.getTaleList); // 故事列表（支持筛选分页）
router.get('/:taleId', taleCtrl.getTaleDetail); // 故事详情（含评论）

// 2. 需登录的接口（普通用户可操作）
router.post('/', userAuth, taleCtrl.createTale); // 发布故事
router.post('/:taleId/like', userAuth, taleCtrl.likeTale); // 点赞/取消点赞
router.post('/:taleId/collect', userAuth, taleCtrl.collectTale); // 收藏/取消收藏

// 3. 需权限的接口（仅作者或管理员）
router.put('/:taleId', userAuth, authMiddleware, checkTaleOwnerOrAdmin, taleCtrl.updateTale); // 编辑故事
router.delete('/:taleId', userAuth, authMiddleware, checkTaleOwnerOrAdmin, taleCtrl.deleteTale); // 删除故事

//保存草稿
router.post('/draft', userAuth, taleCtrl.saveDraft)

//获取草稿详情
router.get('/draft/:taleId', userAuth, taleCtrl.getDraftDetail)
module.exports = router;