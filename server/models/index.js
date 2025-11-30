// models/index.js
const sequelize = require('../config/db');
const User = require('./User');
const Notification = require('./Notification');
const Post = require('./Post')
const Comment = require('./Comment')
const Tale = require('./Tale')

// 在这里集中定义所有模型的关联
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Notification.belongsTo(User, { foreignKey: 'formUserId', as: 'formUser' });
///
Post.belongsTo(User, {
  foreignKey: 'authorId',  // 帖子表中的 authorId 字段
  targetKey: 'userId',     // 用户表中的主键 userId
  as: 'userInfo'           // 别名，查询时用此别名获取作者信息
});
User.hasMany(Post, { foreignKey: 'authorId', as: 'posts' });
Post.hasMany(Comment, {
  foreignKey: 'postId', // Comment 表中关联 Post 的字段
  as: 'comments'        // 别名，查询时用此别名获取评论列表
});
Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });

Tale.belongsTo(User, {
  foreignKey: 'authorId',
  as: 'authorInfo'
});
Tale.hasMany(Comment, {
  foreignKey: 'postId',
  as: 'comments'
});
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// 导出所有模型
module.exports = {
  sequelize,
  User,
  Notification,
  Post,
  Comment,
  Tale
  // 其他模型...
};