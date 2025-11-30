const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Token = sequelize.define('Token', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  idcode: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createtime: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(60),
    allowNull: false
  }
}, {
  tableName: 'token',
  timestamps: false
});

Token.sync({ force: false });
module.exports = Token;