// post.js 和 comment.js 基础结构
const express = require('express');
const router = express.Router();
const postCtrl = require('../controllers/postCtrl')
const userAuth = require('../middleware/userAuth')
const adminAuth = require('../middleware/adminAuth')
const { checkPostOwnerOrAdmin } = require('../middleware/taleAuth');

// 封装兼容鉴权中间件（普通用户或管理员均可访问）
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
//获取post列表
router.get('/list', postCtrl.getPostList)
//获取post详情
router.get('/:postId', postCtrl.getPostDetail)
//发布帖子
router.post('/', userAuth, postCtrl.createPost)
//点赞帖子
router.post('/:postId/like', userAuth, postCtrl.likePost)
//收藏帖子
router.post('/:postId/collect', userAuth, postCtrl.collectPost)
//更新tiez
router.put('/:postId', userAuth, authMiddleware, checkPostOwnerOrAdmin, postCtrl.updatePost);

//删除帖子
router.delete('/:postId', userAuth, authMiddleware, checkPostOwnerOrAdmin, postCtrl.deletePost);
//保存草稿
router.post('/draft', userAuth, postCtrl.saveDraft)
//获取草稿列表
router.get('/draft/list', userAuth, postCtrl.getMyDraft)
//草稿信息
router.get('/draft/:postId', userAuth, postCtrl.getDraftDetail)
module.exports = router;