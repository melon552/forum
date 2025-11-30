const express = require('express')
require('dotenv').config();
const app = express()
const port = 3000
const path = require('path')
const adminRouter = require('./routes/admin');//管理员路由
const userRouter = require('./routes/user')//用户路由
const postRouter = require('./routes/post')
const commentRouter = require('./routes/comment')
const taleRouter = require('./routes/tale')
const notificationRouter = require('./routes/notification')
const contentRouter = require('./routes/content')
const uploadRouter = require('./routes/upload')
//配置基础中间件
//解析JSON格式请求体
app.use(express.json())
//解决跨域问题
app.use(require('cors')())
//托管上传文件
// app.use('/static', express.static(path.join(__dirname, '../forum/public/static')));
// app.use('/static/images', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, '..', 'forum', 'public')));
// 先挂载token验证
// app.use(jwtAuth);

// app.use(auth);

//挂载路由入口
app.use('/api/user', userRouter)
app.use('/api/post', postRouter)
app.use('/api/comment', commentRouter)
app.use('/api/admin', adminRouter);
app.use('/api/tale', taleRouter)
app.use('/api/notification', notificationRouter)
app.use('/api/content', contentRouter)
app.use('/api/upload', uploadRouter);
//错误处理中间件
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    code: err.status || 500,
    msg: err.msg || '服务器内部错误',
    detail: err.message
  })
})



//监听端口
app.listen(port, () => {
  console.log('The server is running at port 3000')
})