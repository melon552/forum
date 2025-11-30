const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User')

const Post = sequelize.define('Post', {
  postId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  author: {
    type: DataTypes.STRING(60),
    allowNull: false
  },
  time: {
    type: DataTypes.DATE,
    allowNull: false
  },
  whoGood: {
    type: DataTypes.JSON,
    allowNull: false
  },
  whoCollection: {
    type: DataTypes.JSON,
    allowNull: false
  },
  lookNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Comment: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cover: {
    type: DataTypes.STRING(6000),
    allowNull: false
  },
  isPublish: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: '0=草稿,1=已发布' // 新增 0=草稿状态
  },
  content: {
    type: DataTypes.TEXT('medium'),
    allowNull: false
  },
  authorId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  goodNumber: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  isPost: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  tableName: 'post',
  timestamps: false
});
// 建立关联：Post 属于 User（一篇内容对应一个作者）
// Post.belongsTo(User, {
//   foreignKey: 'authorId',  // 帖子表中的 authorId 字段
//   targetKey: 'userId',     // 用户表中的主键 userId
//   as: 'userInfo'           // 别名，查询时用此别名获取作者信息
// });
Post.sync({ force: false });
module.exports = Post;