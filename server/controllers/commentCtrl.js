const Comment = require('../models/Comment')
const User = require('../models/User')
const Post = require('../models/Post')
//发布评论
exports.createComment = async (req, res, next) => {
  try {
    const { content, textId = 0 } = req.body
    const postId = req.params.postId;
    const userId = req.user.userId
    //验证帖子是否存在
    const post = await Post.findByPk(postId)
    if (!post) {
      return res.status(404).json({ code: 404, msg: '帖子不存在' })
    }

    //获取当前用户信息
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' })
    }

    //创建评论
    const comment = await Comment.create({
      textId, // 可用于关联子评论（0 表示主评论）
      content,
      userId,
      userName: user.username, // 冗余存储用户名（避免查询时关联用户表）
      userAvatar: user.avatar, // 冗余存储用户头像
      postId,
      taleId: null,
      time: new Date()
    })

    //更新帖子的评论数
    await post.update({ Comment: (post.Comment || 0) + 1 })

    res.status(201).json({
      code: 200,
      msg: '评论发布成功',
      data: { Comment: comment.commentId }
    })
  } catch (err) {
    next(err)
  }
}

//获取评论列表
exports.getCommentList = async (req, res, next) => {
  try {
    const { postId } = req.params
    const { page = 1, limit = 10 } = req.query
    //分页查询指定帖子的评论
    const { count, rows } = await Comment.findAndCountAll({
      where: { postId },
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['time', 'DESC']]
    })
    res.json({
      code: 200,
      data: {
        total: count,
        list: rows,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    })
  } catch (err) {
    next(err)
  }
}

//删除评论
exports.deleteComment = async (req, res, next) => {
  try {
    const { commentId } = req.params
    const currentUser = req.user

    //查看评论是否存在
    const comment = await Comment.findByPk(commentId)
    if (!comment) {
      res.status(404).json({ code: 404, msg: '评论不存在' })
    }
    //权限验证
    if (comment.userId !== currentUser.userId && currentUser.role !== 1) {
      res.status(403).json({ code: 403, msg: '无权删除此评论' })
    }

    //删除评论
    await comment.destroy()
    //更新帖子的评论数
    const post = await Post.findByPk(comment.postId)
    if (post) {
      await post.update({ Comment: Math.max(0, (post.Comment || 0) - 1) })
    }
    res.json({ code: 200, msg: '评论删除成功' })
  } catch (err) {
    next(err)
  }
}