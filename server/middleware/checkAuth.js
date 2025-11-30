// middleware/checkAuth.js
const Admin = require('../models/Admin');

// 管理员权限校验（直接使用 req.admin 中的信息，无需重复查库）
exports.checkAdmin = async (req, res, next) => {
  // 1. 检查 req.admin 是否存在（由 adminAuth 中间件确保）
  if (!req.admin) {
    return res.status(500).json({ code: 500, msg: '管理员信息未挂载' });
  }

  // 2. 检查必要字段（adminId 和 role）
  if (!req.admin.adminId || req.admin.role === undefined) {
    return res.status(500).json({ code: 500, msg: '管理员信息不完整' });
  }

  // 3. 直接通过 req.admin.role 校验权限（无需再次查库）
  if (req.admin.role !== 1) {
    return res.status(403).json({ code: 403, msg: "无管理员权限" });
  }

  next();
};