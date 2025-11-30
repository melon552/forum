const User = require('../../models/User')
const Post = require('../../models/Post')
const Tale = require('../../models/Tale')
const Comment = require('../../models/Comment')
const sequelize = require('../../config/db')

// 生成运营报表
exports.getOperationalReport = async (req, res, next) => {
  try {
    // 基础统计
    const [userCount, postCount, taleCount, commentCount] = await Promise.all([
      User.count(),
      Post.count({ where: { isPublish: 1 } }),
      Comment.count(),
      Tale.count({ where: { isPublish: 1 } })
    ]);

    // 互动总数（点赞+收藏）
    const [postLikeTotal, taleLikeTotal] = await Promise.all([
      Post.sum('goodNumber'),
      Tale.sum('goodNumber')
    ]);
    const totalLike = (postLikeTotal || 0) + (taleLikeTotal || 0);

    // 热门分类
    // 热门分类 - 帖子分类统计
    const postCategoryStats = await Post.findAll({
      attributes: ['type', [sequelize.fn('COUNT', sequelize.col('*')), 'count']], // 改为 COUNT(*)
      where: { isPublish: 1 },
      group: ['type'],
      order: [[sequelize.fn('COUNT', sequelize.col('*')), 'DESC']], // 改为 COUNT(*)
      limit: 5,

    });

    // 热门分类 - 故事分类统计
    const taleCategoryStats = await Tale.findAll({
      attributes: ['type', [sequelize.fn('COUNT', sequelize.col('*')), 'count']], // 改为 COUNT(*)
      where: { isPublish: 1 },
      group: ['type'],
      order: [[sequelize.fn('COUNT', sequelize.col('*')), 'DESC']], // 改为 COUNT(*)
      limit: 5,

    });

    // 合并分类统计
    const categoryMap = {};
    [...postCategoryStats, ...taleCategoryStats].forEach(item => {
      const type = item.dataValues.type; // 显式从 dataValues 中取值
      const count = item.dataValues.count; // 显式从 dataValues 中取值
      categoryMap[type] = (categoryMap[type] || 0) + count;
    });
    const hotCategories = Object.entries(categoryMap)
      .map(([type, count]) => ({ type: parseInt(type), count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 活跃用户（发布内容数+评论数）
    // 发布内容数（帖子+故事）
    const contentSql = `(
      SELECT SUM(count) 
      FROM (
        SELECT COUNT(*) as count FROM post WHERE post.authorId = user.userId AND post.isPublish = 1
        UNION ALL
        SELECT COUNT(*) as count FROM tale WHERE tale.authorId = user.userId AND tale.isPublish = 1
      ) AS sub
    )`;

    // 发布评论数
    const commentSql = `(
      SELECT COUNT(*) FROM comment WHERE comment.userId = user.userId
    )`;

    const activeUsers = await User.findAll({
      attributes: [
        'userId', 'username', 'avatar',
        [sequelize.literal(contentSql), 'contentCount'],
        [sequelize.literal(commentSql), 'commentCount'],
        [sequelize.literal(`(${contentSql}) + (${commentSql})`), 'totalActive'],
      ],
      order: [[sequelize.literal('totalActive'), 'DESC']],
      limit: 10
    });

    res.json({
      code: 200,
      data: {
        baseStats: {
          userCount,
          contentCount: postCount + taleCount,
          commentCount,
          totalLike
        },
        hotCategories,
        activeUsers
      }
    });

  } catch (err) {
    next(err);
  }
};

