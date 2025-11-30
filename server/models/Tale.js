const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User')
const Comment = require('./Comment')
const Tale = sequelize.define('Tale', {
  taleId: {
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
    allowNull: true
  },
  whoCollection: {
    type: DataTypes.JSON,
    allowNull: true
  },
  lookNumber: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  Comment: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '评论'
  },
  type: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  cover: {
    type: DataTypes.STRING(1000),
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
  tableName: 'tale',
  timestamps: false
});

Tale.sync({ force: false });
// Tale.belongsTo(User, {
//   foreignKey: 'authorId',
//   as: 'authorInfo' // 别名，便于查询时关联用户信息
// });
// Tale.hasMany(Comment, {
//   foreignKey: 'postId',
//   as: 'comments' // 别名，便于查询时获取评论列表
// });
module.exports = Tale;