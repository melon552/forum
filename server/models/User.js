const { DataTypes } = require('sequelize')
const sequelize = require('../config/db')
const Notification = require('../models/Notification')

const User = sequelize.define('User', {
  //1.id自增,主键
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // 2. username：字符串、非空、唯一
  username: {
    type: DataTypes.STRING(16),
    allowNull: false,
    unique: true
  },
  //3.password:字符串、非空
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  // 4. email：字符串、非空
  email: {
    type: DataTypes.STRING(37),
    allowNull: false
  },
  // 5. introduction：字符串、可选
  introduction: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  // 6. gender：整数、非空
  gender: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // 7. role：整数、非空
  role: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // 8. avatar：字符串、非空
  avatar: {
    type: DataTypes.STRING(500),
    allowNull: false
  },
  // 9. vip：整数、非空
  vip: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // 10. jionTime：日期时间、非空
  jionTime: {
    type: DataTypes.DATE,
    allowNull: false
  },
  // 11. toGood：JSON、可选
  toGood: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // 12. collection：JSON、可选
  collection: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // 13. level：整数、非空
  level: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // 14. power：整数、可选
  power: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  // 15. postNum：整数、非空
  postNum: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // 16. taleNum：整数、非空
  taleNum: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  // 17. marckTime：长整数、非空
  marckTime: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  // 18. toGoodPost：JSON、可选
  toGoodPost: {
    type: DataTypes.JSON,
    allowNull: true
  },
  // 19. collectionPost：JSON、可选
  collectionPost: {
    type: DataTypes.JSON,
    allowNull: true
  },
}, {
  tableName: 'users',
  timestamps: false
})
User.sync({ force: false })
// User.hasMany(Notification, {
//   foreignKey: 'userId',
//   as: 'notifications'
// });
module.exports = User