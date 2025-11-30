// const User = require('../models/User')
// const Notification = require('../models/Notification')
const { User, Notification } = require('../models/index');
//获取通知信息
exports.getMyNotification = async (req, res, next) => {
  try {
    const userId = req.user.userId
    const { page = 1, limit = 20 } = req.query
    const { count, rows } = await Notification.findAndCountAll({
      where: { userId },
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      order: [['createTime', 'DESC']],
      include: [{
        model: User,
        as: 'formUser',
        attributes: ['userId', 'username', 'avatar']
      }]
    })
    res.json({
      code: 200,
      data: { total: count, list: rows, page: parseInt(page), limit: parseInt(limit) }
    });
  } catch (err) {
    next(err)
  }
}

//标记已读
exports.markAsRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params
    const userId = req.user.userId
    const notification = await Notification.findOne({ where: { notificationId, userId } })
    if (!notification) { return res.status(404).json({ code: 404, msg: '通知不存在或无权限操作' }) }
    await notification.update({ isRead: 1 })
    res.json({ code: 200, msg: '已标记为已读' })
  } catch (err) {
    next(err)
  }
}