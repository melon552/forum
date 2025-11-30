const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')
module.exports = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, msg: '管理员未授权，请携带Token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, 't7k4habp'); // 管理员专属密钥
    const admin = await Admin.findByPk(decoded.sub, {
      attributes: ['adminId', 'role', 'username']
    });
    if (!admin) return res.status(401).json({ code: 401, msg: 'Token无效' });
    req.admin = admin; // 挂载管理员信息到 req.admin
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, msg: 'Token过期' })
    }
    return res.status(401).json({ code: 401, msg: "Token无效" })
  }
}