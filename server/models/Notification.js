const { DataTypes } = require('sequelize');
const sequelize = require('../config/db')
const User = require('../models/User')
const Notification = sequelize.define('Notification', {
  notificationId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  //接收通知的用户
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  //触发通知的用户
  formUserId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  //1帖子2故事
  targetType: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  targetId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  notifyType: {
    //1点赞2评论3收藏
    type: DataTypes.INTEGER,
    allowNull: false
  },
  content: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  isRead: {
    //0未读1已读
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  createTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }

}, {
  tableName: 'notification',
  timestamps: false,
  indexes: [
    { fields: ['userId'] },
    { fields: ['isRead'] }
  ]
})
Notification.sync({ force: false });
// Notification.belongsTo(User, {
//   foreignKey: 'userId',
//   as: 'user'
// });
// Notification.belongsTo(User, {
//   foreignKey: 'formUserId',
//   as: 'formUser'
// });
module.exports = Notification;