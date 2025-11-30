const Tale = require('../models/Tale');
const Post = require('../models/Post')
// 验证是否为故事作者或管理员
// exports.checkTaleOwnerOrAdmin = async (req, res, next) => {
//   try {
//     const { taleId } = req.params;
//     const currentUser = req.user; // 从auth中间件获取当前用户（含userId和role）

//     // 查询故事是否存在
//     const tale = await Tale.findByPk(taleId);
//     if (!tale) {
//       return res.status(404).json({ code: 404, msg: '故事不存在' });
//     }

//     // 权限判断：作者（authorId匹配）或管理员（role=1）
//     if (tale.authorId === currentUser.userId || currentUser.role === 1) {
//       req.tale = tale; // 挂载故事信息到请求对象，供控制器使用
//       next();
//     } else {
//       return res.status(403).json({ code: 403, msg: '无权限操作此故事' });
//     }
//   } catch (err) {
//     next(err);
//   }
// };
exports.checkTaleOwnerOrAdmin = async (req, res, next) => {
  try {
    const { taleId } = req.params;
    // 兼容管理员（req.admin）和普通用户（req.user）
    const currentUser = req.admin || req.user;
    if (!currentUser) {
      return res.status(401).json({ code: 401, msg: '未登录，无法验证权限' });
    }

    const tale = await Tale.findByPk(taleId);
    if (!tale) {
      return res.status(404).json({ code: 404, msg: '故事不存在' });
    }

    // 权限判断逻辑：
    // - 帖子作者（authorId匹配普通用户userId）
    // - 后台管理员（req.admin存在）
    // - 普通用户中的管理员（req.user.role=1）
    const isTaleOwner = tale.authorId === currentUser.userId;
    const isSystemAdmin = req.admin; // 后台管理员直接拥有权限
    const isUserAdmin = req.user && req.user.role === 1; // 普通用户管理员

    if (isTaleOwner || isSystemAdmin || isUserAdmin) {
      req.tale = tale;
      next();
    } else {
      // 优化错误提示，区分管理员和普通用户
      return res.status(403).json({
        code: 403,
        msg: req.admin ? '管理员权限异常' : '无权限操作此帖子'
      });
    }
  } catch (err) {
    next(err);
  }
};


exports.checkPostOwnerOrAdmin = async (req, res, next) => {
  try {
    const { postId } = req.params;
    // 兼容管理员（req.admin）和普通用户（req.user）
    const currentUser = req.admin || req.user;
    if (!currentUser) {
      return res.status(401).json({ code: 401, msg: '未登录，无法验证权限' });
    }

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ code: 404, msg: '帖子不存在' });
    }

    // 权限判断逻辑：
    // - 帖子作者（authorId匹配普通用户userId）
    // - 后台管理员（req.admin存在）
    // - 普通用户中的管理员（req.user.role=1）
    const isPostOwner = post.authorId === currentUser.userId;
    const isSystemAdmin = req.admin; // 后台管理员直接拥有权限
    const isUserAdmin = req.user && req.user.role === 1; // 普通用户管理员

    if (isPostOwner || isSystemAdmin || isUserAdmin) {
      req.post = post;
      next();
    } else {
      // 优化错误提示，区分管理员和普通用户
      return res.status(403).json({
        code: 403,
        msg: req.admin ? '管理员权限异常' : '无权限操作此帖子'
      });
    }
  } catch (err) {
    next(err);
  }
};