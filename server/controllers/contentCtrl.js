const User = require('../models/User');
const Post = require('../models/Post');
const Tale = require('../models/Tale');
const sequelize = require('../config/db');

// 内容推荐接口
exports.getRecommendContent = async (req, res, next) => {
  try {
    // 1. 解析并转换参数为数字类型（避免SQL语法错误）
    const {
      type = 'hot',
      category = '',
      page = 1,
      limit = 10
    } = req.query;
    const pageNum = parseInt(page, 10); // 显式指定基数10
    const limitNum = parseInt(limit, 10);
    const offset = (pageNum - 1) * limitNum; // 计算偏移量（确保为数字）

    // 2. 构建查询条件（避免category未定义错误）
    const commonWhere = { isPublish: 1 };
    if (category && category.trim() !== '') { // 增加空值判断
      commonWhere.type = category;
    }

    // 3. 帖子表查询（修复分页参数类型）
    const postQuery = Post.findAll({
      attributes: [
        'postId', 'title', 'content', 'type', 'goodNumber', 'lookNumber', 'time',
        'authorId', 'Comment', 'whoCollection',
        [sequelize.literal(`'post'`), 'contentType'] // 恢复contentType字段
      ],
      where: commonWhere,
      include: [{
        model: User,
        as: 'userInfo',
        attributes: ['username', 'avatar', 'introduction']
      }],
      limit: limitNum, // 使用转换后的数字类型
      offset: offset // 使用转换后的数字类型
    });

    // 4. 故事表查询（修复分页参数类型）
    const taleQuery = Tale.findAll({
      attributes: [
        'taleId', 'title', 'content', 'type', 'goodNumber', 'lookNumber', 'time',
        'authorId', 'Comment', 'whoCollection',
        [sequelize.literal(`'tale'`), 'contentType'] // 恢复contentType字段
      ],
      where: commonWhere,
      include: [{
        model: User,
        as: 'authorInfo',
        attributes: ['username', 'avatar', 'introduction']
      }],
      limit: limitNum, // 使用转换后的数字类型
      offset: offset // 使用转换后的数字类型
    });

    // 5. 执行查询并合并结果
    const [posts, tales] = await Promise.all([postQuery, taleQuery]);
    let contentList = [...posts, ...tales];

    // 6. 按类型排序（修复时间排序逻辑）
    switch (type) {
      case 'hot':
        contentList.sort((a, b) => {
          const scoreA = (a.goodNumber || 0) * 2 + (a.lookNumber || 0);
          const scoreB = (b.goodNumber || 0) * 2 + (b.lookNumber || 0);
          return scoreB - scoreA; // 降序排列（热门在前）
        });
        break;
      case 'new':
        contentList.sort((a, b) => {
          const yearA = new Date(a.time).getFullYear();
          const yearB = new Date(b.time).getFullYear();
          if (yearA !== yearB) {
            return yearB - yearA; // 年份大的在前（2025优先于2024）
          }
          const timeA = new Date(a.time).getTime();
          const timeB = new Date(b.time).getTime();
          return timeB - timeA; // 同一年份，时间戳大的在前
        });
        break;
    }

    // 7. 计算总数据量（修复分页总数）
    const [postTotal, taleTotal] = await Promise.all([
      Post.count({ where: commonWhere }),
      Tale.count({ where: commonWhere })
    ]);
    const total = postTotal + taleTotal;

    // 8. 响应数据（修复重复type字段）
    res.json({
      code: 200,
      data: {
        list: contentList.map(item => ({
          id: item.postId || item.taleId,
          contentType: item.contentType === 'post' ? 0 : 1, // 重命名避免与item.type冲突
          title: item.title,
          content: item.content || '暂无摘要', // 增加默认值
          type: item.type, // 保留原type字段（如分类类型）
          goodNumber: item.goodNumber || 0,
          lookNumber: item.lookNumber || 0,
          time: item.time,
          Comment: item.Comment,
          whoCollection: item.whoCollection,
          author: {
            username: item.userInfo?.username || item.authorInfo?.username || '未知用户', // 增加默认值
            avatar: item.userInfo?.avatar || item.authorInfo?.avatar || '/default-avatar.png',// 增加默认值
            introduction: item.userInfo?.introduction || '暂无内容',
          }
        })),
        pagination: {
          total,
          page: pageNum, // 使用转换后的数字
          limit: limitNum, // 使用转换后的数字
          totalPage: Math.ceil(total / limitNum) // 计算总页数
        }
      }
    });
    const year2025Items = contentList.filter(item => {
      return new Date(item.time).getFullYear() === 2025;
    });
    console.log(`第${pageNum}页的2025年数据：`, year2025Items.map(item => item.time));
  } catch (err) {
    console.error('推荐接口错误：', err); // 打印错误详情
    next(err);
  }
};