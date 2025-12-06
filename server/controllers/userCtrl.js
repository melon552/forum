const Post = require('../models/Post')
const User = require('../models/User')
const Tale = require('../models/Tale')
const bcrypt = require('bcrypt')
const sequelize = require('sequelize')
const { Op } = require('sequelize')
//生成token
const jwt = require('jsonwebtoken')

//注册逻辑
exports.register = async (req, res, next) => {
  try {
    const { username, password } = req.body
    //判断用户名是否存在
    const exsistingUser = await User.findOne({ where: { username } })
    if (exsistingUser) {
      return res.status(400).json({ code: 400, msg: '用户名已存在' })
    }

    // 2. 密码加密（不可逆，提高安全性）
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    //存入数据库
    // await User.create({
    //   username,
    //   password: hashedPassword
    // })
    await User.create({
      username,
      password: hashedPassword,
      email: req.body.email || `${username}@example.com`,
      gender: 0,
      role: 0,
      avatar: '/default-avatar.png',
      vip: 0,
      jionTime: new Date(),
      level: 1,
      postNum: 0,
      taleNum: 0,
      marckTime: Date.now()
      // 若模型中还有其他必填字段，需同步补充
    });
    //返回注册成功响应
    return res.status(201).json({ code: 200, msg: '注册成功' })
  } catch (err) {
    console.error('注册接口错误详情：', err);
    next(err)
  }
}

//登录逻辑
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body
    //查找用户判断用户名是否存在
    const user = await User.findOne({ where: { username } })
    if (!user) return res.status(400).json({ code: 400, msg: '用户不存在' })
    //判断密码是否正确
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) return res.status(400).json({ code: 400, msg: '用户名或密码错误' })
    //生成token
    const token = jwt.sign({ sub: user.userId }, 't7k4habp', { expiresIn: '24h' })
    res.json({
      code: 200,
      msg: '登陆成功',
      data: {
        token,
        user: { id: user.userId, username: user.username, avatar: user.avatar }
      }
    })
  } catch (err) {
    next(err)
  }
}

//获取当前用户信息
exports.getUserInfo = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password'] }
    })
    if (!user) {
      return res.status(404).json({ code: 404, msg: "用户不存在" })
    }
    //返回完整用户信息
    res.json({
      code: 200,
      msg: "获取信息成功",
      data: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        introduction: user.introduction,
        gender: user.gender,
        level: user.level,
        postNum: user.postNum,
        jionTime: user.jionTime
      }
    })
    // res.json({
    //   code: 200,
    //   msg: "测试成功",
    //   data: req.user
    // });
  } catch (err) {
    next(err)
  }
}


//更新用户信息
exports.updateUser = async (req, res, next) => {
  try {
    const userId = req.user.userId
    //前端可传递的更新字段
    const { avatar, introduction, gender } = req.body
    const [updatedRows] = await User.update(
      { avatar, introduction, gender },
      { where: { userId: userId } }
    )

    //判断是否更新成功
    if (updatedRows === 0) {
      return res.status(404).json({ code: 404, msg: "用户不存在或信息未修改" })
    }
    return res.json({ code: 200, msg: "信息修改成功" })
  } catch (err) {
    next(err)
  }
}


//修改密码
exports.changePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { oldPassword, newPassword } = req.body
    //查询用户，获取旧密码
    const user = await User.findByPk(userId)
    if (!user) {
      return res.status(404).json({ code: 404, msg: "用户不存在" })
    }
    //验证旧密码
    const isMatch = await bcrypt.compare(oldPassword, user.password)
    if (!isMatch) {
      return res.status(400).json({ code: 400, msg: "旧密码错误" })
    }

    //加密新密码并更新
    const salt = await bcrypt.genSalt(10)
    const hashedNewPassword = await bcrypt.hash(newPassword, salt)
    await User.update(
      { password: hashedNewPassword },
      { where: { userId: userId } }
    )
    res.json({ code: 200, msg: "密码修改成功" })

  } catch (err) {
    next(err)
  }
}

//点赞

// 获取当前用户点赞信息（帖子+故事）
exports.getUserLikedInfo = async (req, res, next) => {
  try {
    const userId = req.user.userId; // 当前用户ID（如21）

    // 1. 查询用户点赞过的帖子（type=0）
    const likedPosts = await Post.findAll({
      where: {
        [Op.and]: [
          sequelize.literal(`JSON_CONTAINS(whoGood, '${userId}')`),
          { isPublish: 1, type: 0 }
        ]
      },
      attributes: [
        'postId', 'title', 'cover', 'time', 'goodNumber', 'lookNumber',
        'type', 'isPublish'
      ],
      include: [{
        model: User,
        as: 'userInfo',
        attributes: ['userId', 'username', 'avatar']
      }],
      order: [['time', 'DESC']]
    });

    // 2. 查询用户点赞过的故事（type=1）
    const likedTales = await Tale.findAll({
      where: {
        [Op.and]: [
          sequelize.literal(`JSON_CONTAINS(whoGood, '${userId}')`),
          { isPublish: 1, type: 1 }
        ]
      },
      attributes: [
        'taleId', 'title', 'cover', 'time', 'goodNumber', 'lookNumber',
        'type', 'isPublish'
      ],
      include: [{
        model: User,
        as: 'authorInfo',
        attributes: ['userId', 'username', 'avatar']
      }],
      order: [['time', 'DESC']]
    });

    const formattedPosts = likedPosts.map(post => ({
      ...post.toJSON(),
      targetType: 0 // 0=帖子
    }));
    const formattedTales = likedTales.map(tale => ({
      ...tale.toJSON(),
      targetType: 1 // 1=故事
    }));

    res.json({
      code: 200,
      msg: '获取点赞信息成功',
      data: {
        totalLiked: formattedPosts.length + formattedTales.length,
        likedPosts: formattedPosts,
        likedTales: formattedTales
      }
    });
  } catch (err) {
    console.error('获取用户点赞信息错误：', err);
    next(err);
  }
};


// 获取当前用户收藏信息（帖子+故事）
exports.getUserCollectedInfo = async (req, res, next) => {
  try {
    const userId = req.user.userId; // 当前登录用户ID

    // 1. 查询用户收藏过的帖子（type=0）
    const collectedPosts = await Post.findAll({
      where: {
        [Op.and]: [
          sequelize.literal(`JSON_CONTAINS(whoCollection, '${userId}')`), // 改为收藏字段whoCollection
          { isPublish: 1, type: 0 } // 0=帖子，仅查询已发布
        ]
      },
      attributes: [
        'postId', 'title', 'cover', 'time', 'goodNumber', 'lookNumber',
        'type', 'isPublish', 'whoCollection'
      ],
      include: [{
        model: User,
        as: 'userInfo', // 与点赞接口保持一致的关联别名（确保User模型关联正确）
        attributes: ['userId', 'username', 'avatar']
      }],
      order: [['time', 'DESC']] // 按发布时间倒序
    });

    // 2. 查询用户收藏过的故事（type=1）
    const collectedTales = await Tale.findAll({
      where: {
        [Op.and]: [
          sequelize.literal(`JSON_CONTAINS(whoCollection, '${userId}')`), // 改为收藏字段whoCollection
          { isPublish: 1, type: 1 } // 1=故事，仅查询已发布
        ]
      },
      attributes: [
        'taleId', 'title', 'cover', 'time', 'goodNumber', 'lookNumber',
        'type', 'isPublish', 'whoCollection'
      ],
      include: [{
        model: User,
        as: 'authorInfo', // 与故事点赞接口保持一致的关联别名
        attributes: ['userId', 'username', 'avatar']
      }],
      order: [['time', 'DESC']]
    });

    // 格式化结果（添加内容类型标识，方便前端区分）
    const formattedPosts = collectedPosts.map(post => ({
      ...post.toJSON(),
      targetType: 0 // 0=帖子
    }));
    const formattedTales = collectedTales.map(tale => ({
      ...tale.toJSON(),
      targetType: 1 // 1=故事
    }));

    // 返回统一格式响应
    res.json({
      code: 200,
      msg: '获取收藏信息成功',
      data: {
        totalCollected: formattedPosts.length + formattedTales.length, // 收藏总数
        collectedPosts: formattedPosts, // 收藏的帖子列表
        collectedTales: formattedTales // 收藏的故事列表
      }
    });
  } catch (err) {
    console.error('获取用户收藏信息错误：', err);
    next(err);
  }
};






