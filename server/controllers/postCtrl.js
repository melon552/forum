const Post = require('../models/Post')
const User = require('../models/User')
const Notification = require('../models/Notification')
const Comment = require('../models/Comment')
//发布帖子
exports.createPost = async (req, res, next) => {
  try {
    const { title, cover, content, type } = req.body
    const userId = req.user.userId
    const user = await User.findByPk(userId)

    if (!title || !content) {
      return res.status(400).json({ code: 400, msg: "标题和内容不能为空" })
    }

    const plainText = content.replace(/<[^>]+>/g, '');
    //创建帖子
    const post = await Post.create({
      title,
      content: plainText,
      author: user.username, // 作者名（冗余存储，便于列表展示）
      authorId: userId,      // 关联用户 ID
      time: new Date(),      // 发布时间
      whoGood: [],           // 点赞用户 ID 列表（初始空）
      whoCollection: [],     // 收藏用户 ID 列表（初始空）
      lookNumber: 0,         // 浏览量初始 0
      goodNumber: 0,         // 点赞数初始 0
      Comment: 0,            // 评论数初始 0
      type: type || 0,       // 帖子类型（默认 0）
      cover: cover || '/default-cover.png', // 封面图
      isPublish: 1,          // 1=已发布
      isPost: 1
    });
    res.status(201).json({
      code: 200,
      msg: "帖子发布成功",
      data: { postId: post.postId }
    })
  } catch (err) {
    next(err)
  }
}


//获取帖子列表
exports.getPostList = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, type = null, sort = "time" } = req.query
    //初始化条件查询对象
    const where = {}
    //筛选条件
    if (type !== null) where.type = type
    where.isPublish = 1
    //分页查询
    const { count, rows } = await Post.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [[sort, 'DESC']],
      // 关联作者信息
      include: [{
        model: User,
        as: 'userInfo',
        attributes: ['userId', 'avatar'] // 只返回头像
      }]
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


//获取帖子详情
exports.getPostDetail = async (req, res, next) => {
  try {
    const { postId } = req.params
    //查看帖子详情
    const post = await Post.findByPk(postId, {
      include: [{
        model: User,
        as: 'userInfo',
        attributes: ['userId', 'username', 'avatar', 'introduction']
      },
      {
        model: Comment,
        as: 'comments',
        limit: 20, // 限制评论条数，避免数据过多
        order: [['time', 'DESC']],
        include: [{
          model: User,
          as: 'user',
          attributes: ['userId', 'username', 'avatar']
        }]
      }
      ]
    })
    if (!post || post.isPublish !== 1) {
      return res.status(404).json({ code: 404, msg: '帖子暂未发布或不存在' })
    }

    //浏览量加一
    await post.update({ lookNumber: post.lookNumber + 1 })

    res.json({ code: 200, data: post })
  } catch (err) {
    next(err)
  }
}


//点赞
exports.likePost = async (req, res, next) => {
  try {
    const { postId } = req.params
    const userId = req.user.userId
    const post = await Post.findByPk(postId)
    if (!post) {
      return res.status(404).json({ code: 404, msg: '帖子未发布或不存在' })
    }
    const whoGood = post.whoGood || []
    const isLiked = whoGood.includes(userId)
    if (isLiked) {
      //遍历数组中的每一项，只保留不与当前userId相同的id
      post.whoGood = whoGood.filter(id => id !== userId)

      post.goodNumber = Math.max(post.goodNumber - 1, 0)
    } else {
      post.whoGood = [...whoGood, userId];
      post.goodNumber += 1
    }
    await post.save()
    //首次点赞！isLike,并且不是自己点赞自己
    if (!isLiked && post.authorId !== userId) {
      const formUser = await User.findByPk(userId)
      await Notification.create({
        userId: post.authorId, // 接收者（作者）
        formUserId: formUser.userId,    // 触发者（点赞者）
        targetType: 1,         // 1=帖子
        targetId: postId,
        notifyType: 1,         // 1=点赞
        content: `${formUser.username} 点赞了你的帖子`
      })
    }
    res.json({
      code: 200,
      msg: isLiked ? '取消点赞成功' : '点赞成功',
      data: { isLiked: !isLiked, goodNumber: post.goodNumber }
    })
  } catch (err) {
    next(err)
  }
}

//收藏帖子
exports.collectPost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId

    const post = await Post.findByPk(postId);
    if (!post) {
      return res.status(404).json({ code: 404, msg: '帖子不存在' });
    }

    const whoCollection = post.whoCollection || [];
    const isCollected = whoCollection.includes(userId);

    if (isCollected) {
      // 取消收藏
      post.whoCollection = whoCollection.filter(id => id !== userId);
    } else {
      // 收藏
      post.whoCollection = [...whoCollection, userId];
    }

    await post.save();
    if (!isCollected && post.authorId !== userId) {
      const formUser = await User.findByPk(userId)
      await Notification.create({
        userId: post.authorId, // 接收者（作者）
        formUserId: formUser.userId,    // 触发者（点赞者）
        targetType: 1,         // 1=帖子
        targetId: postId,
        notifyType: 1,         // 1=点赞
        content: `${formUser.username} 收藏了你的帖子`
      })
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


//编辑帖子
exports.updatePost = async (req, res, next) => {
  try {
    const { postId } = req.params;
    const { title, content, cover, type, isPublish } = req.body;

    console.log('后端接收的 cover：', cover);
    console.log('要更新的 postId：', postId);
    console.log('要更新的数据：', { title, content, cover, type, isPublish });

    // 校验至少传入一个值
    const hasValidField = [title, content, cover, type, isPublish].some(field => field !== undefined);
    if (!hasValidField) {
      return res.status(400).json({ code: 400, msg: '更新内容不能为空' });
    }

    // 验证故事是否存在
    const targetPost = await Post.findByPk(postId);
    if (!targetPost) {
      return res.status(404).json({ code: 404, msg: '帖子不存在' });
    }

    // 构建更新数据
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (cover !== undefined) updateData.cover = cover;
    if (type !== undefined) updateData.type = type;
    if (isPublish !== undefined) updateData.isPublish = isPublish;

    // 执行更新并返回结果
    const [updatedRows] = await Post.update(updateData, {
      where: { postId: parseInt(postId) },
      returning: true,

    });

    console.log('更新影响的行数：', updatedRows);
    if (updatedRows === 0) {
      return res.status(400).json({ code: 400, msg: '更新失败，无数据变更' });
    }

    // 获取更新后的记录
    const updatedPost = await Post.findByPk(postId);
    console.log('更新后的 cover：', updatedPost.cover);

    res.json({
      code: 200,
      msg: '帖子更新成功',
      data: { cover: updatedPost.cover }
    });
  } catch (err) {
    console.error('更新失败错误详情：', err);
    next(err);
  }
};



//删除帖子
exports.deletePost = async (req, res, next) => {
  try {
    const post = req.post; // 从权限中间件获取故事信息

    // 先删除关联的评论（级联删除）
    await Comment.destroy({ where: { postId: post.postId } });

    // 再删除故事
    await post.destroy();

    res.json({ code: 200, msg: '帖子删除成功' });
  } catch (err) {
    next(err);
  }
};

//保存草稿
exports.saveDraft = async (req, res, next) => {
  try {
    const { postId, type, title, content, cover } = req.body
    const userId = req.user.userId
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }
    if (postId) {
      //编辑现有草稿
      const post = await Post.findOne({ where: { authorId: userId, postId } })
      if (!post) {
        return res.status(404).json({ code: 404, msg: '草稿不存在' })
      }
      await post.update({ title, content, cover, type, isPublish: 0 })
      return res.json({ code: 200, msg: '草稿保存成功' })
    } else {
      //新建草稿
      await Post.create({
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
      return res.json({ code: 200, msg: '草稿创建成功' })
    }
  } catch (err) {
    next(err)
  }
}

//获取草稿列表
exports.getMyDraft = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const userId = req.user.userId
    const { count, rows } = await Post.findAndCountAll({
      where: { authorId: userId, isPublish: 0 },
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

//获取草稿详情
exports.getDraftDetail = async (req, res, next) => {
  try {
    const { postId } = req.params
    //查看帖子详情
    const post = await Post.findByPk(postId, {
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
    if (!post || post.isPublish !== 0) {
      return res.status(404).json({ code: 404, msg: '草稿暂未发布或不存在' })
    }

    //浏览量加一
    await post.update({ lookNumber: post.lookNumber + 1 })

    res.json({ code: 200, data: post })
  } catch (err) {
    next(err)
  }
}

//数组转嵌套
// function buildTree(arr,parentId=0){
//   const children=arr.map(item.parentId===parentId)
//   return children.map(children,({
//     ...children,
//     children:buildTree(falt,children.id)
//   }))
// }



// function compareVersion(version1,version2){
//   const v1=version1.split('.').map(item=>parseInt(item))
//   const v2=version2.split('.').map(item=>parseInt(item))
//   const MaxLen=Math.max(v1.length,v2.length)
//   for(let i=0;i<MaxLen;i++){
//     const num1=i<v1.length?v1[i]:0
//     const num2=i<v2.length?v2[1]:0
//     if(num1>num2) return 1
//     if(num1<num2) return -1
//   }
// }