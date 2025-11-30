const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userCtrl');  // 导入控制器
// const { jwtAuth: auth } = require('../middleware/auth');11111

const userAuth = require('../middleware/userAuth'); // 仅导入鉴权中间件



// 注册接口：POST /api/user/register
router.post('/register', userCtrl.register);

// 登录接口：POST /api/user/login
router.post('/login', userCtrl.login);

//需要鉴权的接口
//获取用户信息
router.get('/info', userAuth, userCtrl.getUserInfo)
//修改用户信息
router.put('/update', userAuth, userCtrl.updateUser)
//修改密码
router.put('/changepassword', userAuth, userCtrl.changePassword)

//个人点赞作品信息
router.get('/likes', userAuth, userCtrl.getUserLikedInfo)
//个人收藏作品信息
router.get('/collects', userAuth, userCtrl.getUserCollectedInfo)



module.exports = router;