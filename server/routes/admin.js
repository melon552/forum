// routes/admin.js
const express = require('express');
const router = express.Router();
const adminCtrl = require('../controllers/adminCtrl');
const adminAuth = require('../middleware/adminAuth'); // 管理员专属认证中间件
const { checkAdmin } = require('../middleware/checkAuth'); // 管理员权限校验
const statsCtrl = require('../controllers/admin/statCtrl')

// 管理员专属接口（需管理员Token）
router.get('/users', adminAuth, checkAdmin, adminCtrl.getAllUsers);
router.delete('/user/:userId', adminAuth, checkAdmin, adminCtrl.deleteUser);
router.put('/user/:userId/info', adminAuth, checkAdmin, adminCtrl.updateAnyUser);


// 管理员个人信息相关（需鉴权）
router.get('/info', adminAuth, adminCtrl.getAdminInfo); // 获取个人信息
router.put('/info', adminAuth, adminCtrl.updateAdminInfo); // 修改个人信息（非密码）
router.put('/password', adminAuth, adminCtrl.updateAdminPassword); // 修改密码

//统计报表接口
router.get('/report', adminAuth, checkAdmin, statsCtrl.getOperationalReport)


//需要携带有效token才能够进行注册
// router.post('/register', adminAuth, checkAdmin, adminCtrl.register);
router.post('/register', adminCtrl.register);
router.post('/login', adminCtrl.login);


module.exports = router;