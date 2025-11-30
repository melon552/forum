const Tale = require('../models/Tale');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification')
// 1. 发布故事（需登录）
exports.createTale = async (req, res, next) => {
  try {
    const { title, content, cover, type, isPublish = 1 } = req.body;
    const userId = req.user.userId;
    const user = await User.findByPk(userId);

    // 验证必填字段
    if (!title || !content) {
      return res.status(400).json({ code: 400, msg: '标题和内容不能为空' });
    }

    // 移除所有HTML标签（保留文本内容）
    const plainText = content.replace(/<[^>]+>/g, '');

    // 创建故事（合并逻辑，补充所有必填字段）
    const newTale = await Tale.create({
      title,
      content: plainText,
      author: user.username,
      authorId: userId,
      time: new Date(),
      whoGood: [],
      whoCollection: [],
      lookNumber: 0,
      goodNumber: 0,
      Comment: 0,
      type: type || 0,
      cover: cover || '/default-cover.png',
      isPublish: isPublish ? 1 : 0,
      isPost: 0
    });

    res.status(201).json({
      code: 200,
      msg: '故事发布成功',
      data: { taleId: newTale.taleId, newTale }
    });
  } catch (err) {
    next(err);
  }
};

// 2. 获取故事列表（公开，支持筛选排序）
exports.getTaleList = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type = null, // 按分类筛选
      sort = 'time', // 排序字段（time/ goodNumber）
      isPublish = 1 // 默认只查已发布
    } = req.query;

    // 筛选条件
    const where = { isPublish: parseInt(isPublish) };
    if (type !== null && !isNaN(Number(type))) {
      where.type = parseInt(type);
    }

    // 分页查询（关联作者基础信息）
    const { count, rows } = await Tale.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sort, 'DESC']], // 降序排列
      include: [{
        model: User,
        as: 'authorInfo',
        attributes: ['userId', 'username', 'avatar'] // 仅返回必要信息
      }]
    });

    res.json({
      code: 200,
      data: {
        total: count, // 总条数
        list: rows,   // 当前页数据
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit) // 总页数
      }
    });
  } catch (err) {
    next(err);
  }
};

// 3. 获取故事详情（公开，含作者信息+评论列表）
exports.getTaleDetail = async (req, res, next) => {
  try {
    const { taleId } = req.params;

    // 查询故事详情（关联作者+评论列表）
    const tale = await Tale.findByPk(taleId, {
      include: [
        {
          model: User,
          as: 'authorInfo',
          attributes: ['userId', 'username', 'avatar', 'introduction']
        },
        {
          model: Comment,
          as: 'comments',
          limit: 20, // 限制评论条数，避免数据过多
          order: [['time', 'DESC']],
          attributes: ['commentId', 'content', 'userAvatar', 'time']
        }
      ]
    });

    if (!tale || tale.isPublish !== 1) {
      return res.status(404).json({ code: 404, msg: '故事不存在或未发布' });
    }

    // 浏览量 +1（自动更新）
    await tale.update({ lookNumber: tale.lookNumber + 1 });

    res.json({ code: 200, data: tale });
  } catch (err) {
    next(err);
  }
};

// 4. 点赞/取消点赞（需登录）
exports.likeTale = async (req, res, next) => {
  try {
    const { taleId } = req.params;
    const userId = req.user.userId;

    const tale = await Tale.findByPk(taleId);
    if (!tale) {
      return res.status(404).json({ code: 404, msg: '故事不存在' });
    }

    // 处理点赞列表（JSON转数组，避免空值）
    const whoGood = tale.whoGood || [];
    const isLiked = whoGood.includes(userId);

    if (isLiked) {
      // 取消点赞：移除用户ID
      tale.whoGood = whoGood.filter(id => id !== userId);
      tale.goodNumber = Math.max(0, tale.goodNumber - 1);
    } else {
      // 点赞：添加用户ID
      tale.whoGood = [...whoGood, userId];
      tale.goodNumber += 1;
    }

    await tale.save();
    //首次点赞！isLike,并且不是自己点赞自己
    if (!isLiked && tale.authorId !== userId) { // 避免自己点赞自己发通知
      const formUser = await User.findByPk(userId); // 点赞者信息
      await Notification.create({
        userId: tale.authorId,       // 通知接收者：故事作者ID
        formUserId: formUser.userId, // 通知触发者：点赞用户ID
        targetType: 2,               // 目标类型：2=故事（与帖子的1区分）
        targetId: taleId,            // 目标ID：故事ID
        notifyType: 1,               // 通知类型：1=点赞
        content: `${formUser.username} 点赞了你的故事` // 通知内容
      });
    }
    res.json({
      code: 200,
      msg: isLiked ? '取消点赞成功' : '点赞成功',
      data: { isLiked: !isLiked, goodNumber: tale.goodNumber }
    });
  } catch (err) {
    next(err);
  }
};

// 5. 收藏/取消收藏（需登录）
exports.collectTale = async (req, res, next) => {
  try {
    const { taleId } = req.params;
    const userId = req.user.userId;

    const tale = await Tale.findByPk(taleId);
    if (!tale) {
      return res.status(404).json({ code: 404, msg: '故事不存在' });
    }

    const whoCollection = tale.whoCollection || [];
    const isCollected = whoCollection.includes(userId);

    if (isCollected) {
      // 取消收藏：移除用户ID
      tale.whoCollection = whoCollection.filter(id => id !== userId);
    } else {
      // 收藏：添加用户ID
      tale.whoCollection = [...whoCollection, userId];
    }

    await tale.save();
    if (!isCollected && tale.authorId !== userId) { // 避免自己点赞自己发通知
      const formUser = await User.findByPk(userId); // 点赞者信息
      await Notification.create({
        userId: tale.authorId,       // 通知接收者：故事作者ID
        formUserId: formUser.userId, // 通知触发者：点赞用户ID
        targetType: 2,               // 目标类型：2=故事（与帖子的1区分）
        targetId: taleId,            // 目标ID：故事ID
        notifyType: 1,               // 通知类型：1=点赞
        content: `${formUser.username} 收藏了你的故事` // 通知内容
      });
    }
    res.json({
      code: 200,
      msg: isCollected ? '取消收藏成功' : '收藏成功',
      data: { isCollected: !isCollected }
    });
  } catch (err) {
    next(err);
  }
};

// 6. 编辑故事（仅作者或管理员）
exports.updateTale = async (req, res, next) => {
  try {
    const { taleId } = req.params;
    const { title, content, cover, type, isPublish } = req.body;

    console.log('后端接收的 cover：', cover);
    console.log('要更新的 taleId：', taleId);
    console.log('要更新的数据：', { title, content, cover, type, isPublish });

    // 校验至少传入一个值
    const hasValidField = [title, content, cover, type, isPublish].some(field => field !== undefined);
    if (!hasValidField) {
      return res.status(400).json({ code: 400, msg: '更新内容不能为空' });
    }

    // 验证故事是否存在
    const targetTale = await Tale.findByPk(taleId);
    if (!targetTale) {
      return res.status(404).json({ code: 404, msg: '故事不存在' });
    }

    // 构建更新数据
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (cover !== undefined) updateData.cover = cover;
    if (type !== undefined) updateData.type = type;
    if (isPublish !== undefined) updateData.isPublish = isPublish;

    // 执行更新并返回结果
    const [updatedRows] = await Tale.update(updateData, {
      where: { taleId: parseInt(taleId) },
      returning: true,

    });

    console.log('更新影响的行数：', updatedRows);
    if (updatedRows === 0) {
      return res.status(400).json({ code: 400, msg: '更新失败，无数据变更' });
    }

    // 获取更新后的记录
    const updatedTale = await Tale.findByPk(taleId);
    console.log('更新后的 cover：', updatedTale.cover);

    res.json({
      code: 200,
      msg: '故事更新成功',
      data: { cover: updatedTale.cover }
    });
  } catch (err) {
    console.error('更新失败错误详情：', err);
    next(err);
  }
};

// 7. 删除故事（仅作者或管理员）
exports.deleteTale = async (req, res, next) => {
  try {
    const tale = req.tale; // 从权限中间件获取故事信息

    // 先删除关联的评论（级联删除）
    await Comment.destroy({ where: { postId: tale.taleId } });

    // 再删除故事
    await tale.destroy();

    res.json({ code: 200, msg: '故事删除成功' });
  } catch (err) {
    next(err);
  }
};


//保存草稿
exports.saveDraft = async (req, res, next) => {
  try {
    const { taleId, type, title, content, cover } = req.body
    const userId = req.user.userId
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }
    if (taleId) {
      //编辑现有草稿
      const tale = await Tale.findOne({ where: { authorId: userId, taleId } })
      if (!tale) {
        return res.status(404).json({ code: 404, msg: '草稿不存在' })
      }
      await Tale.update({ title, content, cover, type, isPublish: 0 })
      return res.json({ code: 200, msg: '草稿保存成功', data: { taleId } })
    } else {
      //新建草稿
      const newTale = await Tale.create({
        title: title || '未命名草稿',
        content: content || '',
        author: user.username,
        authorId: user.userId,
        time: new Date(),
        whoGood: [],
        whoCollection: [],
        lookNumber: 0,
        goodNumber: 0,
        Comment: 0,
        type: type || 0,
        cover: cover || '/default-cover.png',
        isPublish: 0,//标记为草稿
        isPost: 1
      })
      return res.json({
        code: 200,
        msg: '草稿创建成功',
        data: { taleId: newTale.taleId } // 关键：返回新建的taleId
      })
    }
  } catch (err) {
    next(err)
  }
}

//获取草稿详情
exports.getDraftDetail = async (req, res, next) => {
  try {
    const { taleId } = req.params
    //查看帖子详情
    const tale = await Tale.findByPk(taleId, {
      include: [{
        model: User,
        as: 'authorInfo',
        attributes: ['userId', 'username', 'avatar', 'introduction']
      },
      {
        model: Comment,
        as: 'comments',
        limit: 20, // 限制评论条数，避免数据过多
        order: [['time', 'DESC']],
        attributes: ['commentId', 'content', 'userAvatar', 'time']
      }

      ]
    })
    if (!tale || tale.isPublish !== 0) {
      return res.status(404).json({ code: 404, msg: '草稿暂未发布或不存在' })
    }

    //浏览量加一
    await tale.update({ lookNumber: tale.lookNumber + 1 })

    res.json({ code: 200, data: tale })
  } catch (err) {
    next(err)
  }
}