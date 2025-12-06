// controllers/adminCtrl.js
const Admin = require('../models/Admin');
const User = require('../models/User')
const Comment = require('../models/Comment')
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { Op } = require('sequelize')
const { sequelize } = require('../models'); // 引入Sequelize实例
// 获取所有用户列表
exports.getAllUsers = async (req, res, next) => {
  try {
    //从请求查询参数中获取分页参数
    const { page = 1, limit = 10 } = req.query;
    //分页偏移量（跳过多少条数据）
    const offset = (page - 1) * limit;
    const { count, rows } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['jionTime', 'DESC']]
    });
    res.json({
      code: 200,
      msg: "获取成功",
      data: { total: count, list: rows, page, limit }
    });
  } catch (err) {
    next(err);
  }
};

// 删除用户
exports.deleteUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const deleteRows = await User.destroy({ where: { userId } });
    if (deleteRows === 0) {
      return res.status(404).json({ code: 404, msg: "用户不存在" });
    }
    res.json({ code: 200, msg: "用户删除成功" });
  } catch (err) {
    next(err);
  }
};

// 修改任意用户信息
exports.updateAnyUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { avatar, introduction, gender, role } = req.body;
    const [updatedRows] = await User.update(
      { avatar, introduction, gender, role },
      { where: { userId } }
    );
    if (updatedRows === 0) {
      return res.status(404).json({ code: 404, msg: "用户不存在" });
    }
    res.json({ code: 200, msg: "用户更新成功" });
  } catch (err) {
    next(err);
  }
};

// controllers/adminCtrl.js（管理员注册逻辑）
exports.register = async (req, res, next) => {
  try {
    const { username, password, email } = req.body;
    // 校验管理员账号是否存在（查询 admin 表）
    const existingAdmin = await Admin.findOne({ where: { username } });
    if (existingAdmin) {
      return res.status(400).json({ code: 400, msg: '管理员账号已存在' });
    }
    // 密码加密
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // 存入 admin 表（默认管理员角色）
    await Admin.create({
      username,
      password: hashedPassword,
      email,
      role: 1 // 明确管理员角色
      // 无需传入 joinTime、gender 等，模型会自动处理
    });
    res.status(201).json({ code: 200, msg: '管理员注册成功' });
  } catch (err) {
    next(err);
  }
};

//管理员登录
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    // 1. 查询管理员账号是否存在（从 admin 表查询）
    const admin = await Admin.findOne({ where: { username } });
    if (!admin) {
      return res.status(400).json({ code: 400, msg: '管理员账号不存在' });
    }
    // 2. 校验密码（与 admin 表中存储的加密密码比对）
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(400).json({ code: 400, msg: '密码错误' });
    }
    // 3. 生成管理员专属 Token（使用独立密钥，与用户 Token 区分）
    const token = jwt.sign(
      { sub: admin.adminId, role: admin.role, type: 'admin' }, // 携带管理员 ID、角色
      't7k4habp', // 管理员 Token 密钥（需与 adminAuth 中间件一致）
      { expiresIn: '24h' }
    );
    // 4. 返回登录结果（包含 Token 和管理员基本信息）
    res.json({
      code: 200,
      msg: '管理员登录成功',
      data: {
        token,
        admin: {
          id: admin.adminId,
          username: admin.username,
          role: admin.role // 返回角色，用于前端权限控制
        }
      }
    });
  } catch (err) {
    next(err); // 传递错误到全局错误处理中间件
  }
};



// ========== 新增：获取当前登录管理员信息 ==========
exports.getAdminInfo = async (req, res, next) => {
  try {
    // 从 adminAuth 中间件挂载的 req.admin 中获取 adminId
    const adminId = req.admin.adminId;
    const admin = await Admin.findByPk(adminId, {
      attributes: { exclude: ['password'] } // 排除密码字段
    });
    if (!admin) {
      return res.status(404).json({ code: 404, msg: '管理员信息不存在' });
    }
    res.json({
      code: 200,
      msg: '获取管理员信息成功',
      data: admin
    });
  } catch (err) {
    next(err);
  }
};

// ========== 新增：修改管理员个人信息（非密码） ==========
exports.updateAdminInfo = async (req, res, next) => {
  try {
    // 从登录态中获取当前管理员ID（确保只能修改自己的信息）
    const currentAdminId = req.admin.adminId;
    const { username, email, avatar, gender } = req.body;

    // 校验：如果修改用户名，需确保新用户名未被占用
    if (username) {
      const existingAdmin = await Admin.findOne({
        where: { username, adminId: { [Op.ne]: currentAdminId } } // 排除自己
      });
      if (existingAdmin) {
        return res.status(400).json({ code: 400, msg: '用户名已被占用' });
      }
    }

    // 更新管理员信息
    const [updatedRows] = await Admin.update(
      { username, email, gender, avatar }, // 支持修改的字段：用户名、邮箱、头像、性别
      { where: { adminId: currentAdminId } }
    );

    if (updatedRows === 0) {
      return res.status(404).json({ code: 404, msg: '管理员不存在' });
    }

    // 返回更新后的管理员信息（排除密码）
    const updatedAdmin = await Admin.findByPk(currentAdminId, {
      attributes: { exclude: ['password'] }
    });

    res.json({
      code: 200,
      msg: '管理员信息修改成功',
      data: updatedAdmin
    });
  } catch (err) {
    next(err);
  }
};

// ========== 新增：修改管理员密码（需校验原密码） ==========
exports.updateAdminPassword = async (req, res, next) => {
  try {
    const currentAdminId = req.admin.adminId;
    const { oldPassword, newPassword } = req.body;

    // 1. 校验参数
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ code: 400, msg: '原密码和新密码不能为空' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ code: 400, msg: '新密码长度不能少于6位' });
    }

    // 2. 查询当前管理员信息
    const admin = await Admin.findByPk(currentAdminId);
    if (!admin) {
      return res.status(404).json({ code: 404, msg: '管理员不存在' });
    }

    // 3. 校验原密码
    const isOldPwdMatch = await bcrypt.compare(oldPassword, admin.password);
    if (!isOldPwdMatch) {
      return res.status(400).json({ code: 400, msg: '原密码错误' });
    }

    // 4. 加密新密码并更新
    const salt = await bcrypt.genSalt(10);
    const hashedNewPwd = await bcrypt.hash(newPassword, salt);
    await Admin.update(
      { password: hashedNewPwd },
      { where: { adminId: currentAdminId } }
    );

    res.json({ code: 200, msg: '密码修改成功，请重新登录' });
  } catch (err) {
    next(err);
  }
};



//获取评论列表
exports.getAdminCommentList = async (req, res, next) => {
  try {
    // 解析查询参数：分页、筛选条件
    const {
      page = 1,
      limit = 10,
      sourceType = '', // 来源类型：post（帖子）/tale（故事）
      status = '', // 状态：normal（正常）/deleted（已删除）
      keyword = '' // 搜索关键词（评论内容/用户名）
    } = req.query;

    // 计算分页偏移量
    const offset = (page - 1) * limit;

    // 构建查询条件
    const whereCondition = {};
    // 按来源类型筛选（帖子/故事）
    if (sourceType) {
      whereCondition.sourceType = sourceType;
    }
    // 按状态筛选（正常/已删除）
    if (status) {
      whereCondition.status = status;
    }
    // 关键词搜索（评论内容或评论者用户名）
    if (keyword) {
      whereCondition[Op.or] = [
        { content: { [Op.like]: `%${keyword}%` } }, // 评论内容模糊匹配
        { userName: { [Op.like]: `%${keyword}%` } } // 评论者用户名模糊匹配
      ];
    }

    // 执行查询（关联查询可能的关联表，如用户表，根据实际模型调整）
    const { count, rows } = await Comment.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['time', 'DESC']], // 按创建时间倒序
      attributes: { exclude: [] } // 按需排除字段，如无则留空
    });

    res.json({
      code: 200,
      msg: '获取评论列表成功',
      data: {
        total: count,
        list: rows,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (err) {
    next(err);
  }
};




//删除评论
// 删除评论（通过路径参数:commentId传递单个ID）
exports.deleteComment = async (req, res, next) => {
  try {
    // 从URL路径参数中获取评论ID
    const { commentId } = req.params;

    // 1. 校验参数：commentId必须存在且为有效数字
    if (!commentId || isNaN(Number(commentId))) {
      return res.status(400).json({ code: 400, msg: '请提供有效的评论ID' });
    }

    // 2. 执行删除操作（按ID精确匹配）
    const deleteCount = await Comment.destroy({
      where: { commentId: Number(commentId) } // 转换为数字类型匹配数据库
    });

    // 3. 校验删除结果
    if (deleteCount === 0) {
      return res.status(404).json({ code: 404, msg: '评论不存在或已被删除' });
    }

    // 4. 返回成功响应
    res.json({
      code: 200,
      msg: '评论删除成功',
      data: { commentId: Number(commentId) } // 返回删除的评论ID
    });

  } catch (err) {
    next(err);
  }
};

