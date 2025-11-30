const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Admin = sequelize.define('Admin', {
  adminId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  username: {
    type: DataTypes.STRING(16),
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  gender: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  avatar: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '/default-avatar.png'
  },
  introduction: {
    type: DataTypes.TEXT,
    allowNull: false,
    defaultValue: '该管理员暂未填写简介'
  },
  role: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  vip: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  jionTime: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  account: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'admin',
  timestamps: false
});

Admin.sync({ force: false });
module.exports = Admin;