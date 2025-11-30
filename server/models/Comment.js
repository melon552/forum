const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const User = require('./User')
const Post = require('./Post')
const Comment = sequelize.define('Comment', {
  commentId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  textId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  content: {
    type: DataTypes.STRING(400),
    allowNull: false
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  userName: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  userAvatar: {
    type: DataTypes.STRING(400),
    allowNull: false
  },
  postId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  taleId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  time: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'comment',
  timestamps: false,
  validate: {
    checkRelatedId() {
      if ((this.taleId === null && this.postId === null) ||
        (this.taleId !== null && this.postId !== null)) {
        throw new Error('评论必须关联故事（taleId）或帖子（postId）中的一个');
      }
    }
  }
}

);

Comment.sync({ force: false });
// Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });
// Comment.belongsTo(Post, { foreignKey: 'postId', as: 'post' });
module.exports = Comment;