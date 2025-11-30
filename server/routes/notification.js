const express = require('express');
const router = express.Router();
const notificationCtrl = require('../controllers/notificationCtrl');
const userAuth = require('../middleware/userAuth');

router.get('/my', userAuth, notificationCtrl.getMyNotification); // 我的通知
router.put('/:notificationId/read', userAuth, notificationCtrl.markAsRead); // 标记已读

module.exports = router;