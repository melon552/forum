const { Sequelize } = require('sequelize')
const sequelize = new Sequelize('forum', 'root', '123456', {
  host: 'localhost',
  dialect: 'mysql',
  timezone: '+08:00'
})
//测试链接
sequelize.authenticate()
  .then(() => console.log('MySQL 连接成功'))
  .catch(err => console.error('连接失败：', err));

module.exports = sequelize;