// post.js 和 comment.js 基础结构
const express = require('express');
const router = express.Router();
const commentCtrl = require('../controllers/commentCtrl')
const userAuth = require('../middleware/userAuth')
const commentCtrl1 = require('../controllers/commentCtrl1')

// 1. 公开接口：获取帖子的评论列表
router.get('/post/:postId', commentCtrl.getCommentList);
//获取故事的评论列表
router.get('/tale/:taleId', commentCtrl1.getCommentList)
// 2. 需登录的接口
router.post('/post/:postId', userAuth, commentCtrl.createComment); // 发布评论
router.delete('/:commentId', userAuth, commentCtrl.deleteComment); // 删除评论

//故事
router.post('/tale/:taleId', userAuth, commentCtrl1.createComment)
router.delete('/:commentId', userAuth, commentCtrl.deleteComment);
module.exports = router;