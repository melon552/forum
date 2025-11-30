// const { expressjwt: jwt } = require('express-jwt');

// // 第一步：token验证中间件
// const jwtAuth = jwt({
//   secret: 't7k4habp',
//   algorithms: ['HS256'],
//   credentialsRequired: true,
//   requestProperty: 'user', // 直接将解析结果挂载到 req.user
//   payloadProperty: 'sub'   // 匹配 Token 中生成的 sub 字段
// }).unless({ path: ['/api/user/register', '/api/user/login'] });



// //鉴权逻辑，将token挂载到req.user自定义
// module.exports = async (req, res, next) => {
//   try {
//     //从请求头获取token
//     const authHeader = req.headers.authorization
//     if (!authHeader || !authHeader.startsWith('Bearer ')) {
//       return res.status(401).json({ code: 401, msg: "未授权,请先登录" })
//     }

//     //提取token
//     const token = authHeader.split(' ')[1]
//     //解析token
//     const decoded = jwt.verify(token, 't7k4habp')
//     const userId = decoded.userId
//     //验证token对应的用户是否存在
//     const user = req.body.userId
//     if (!user) {
//       return res.status(401).json({ code: 401, msg: "用户已被删除,Token无效" })
//     }
//     //将用户信息挂载到req.user上
//     req.user = user
//     next()
//   } catch (err) {
//     if (err.name === 'TokenExpiredError') {
//       return res.status(401).json({ code: 401, msg: "Token过期,请重新登录" })
//     }
//     return res.status(401).json({ code: 401, msg: "Token无效" })
//   }
// }

// 导出两个中间件（按顺序使用）
// module.exports = { jwtAuth };


///////
const jwt = require('jsonwebtoken');
//鉴权
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ code: 401, msg: '未授权,请携带Token' });
    }
    const token = authHeader.split(' ')[1];
    //解析后的token载荷，即生成token时存入的用户信息，如{ sub: 123, role: 'user' }，sub通常表示用户ID
    const decoded = jwt.verify(token, 't7k4habp');
    req.user = { userId: decoded.sub }; // 将用户ID挂载到req.user
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ code: 401, msg: 'Token过期' });
    }
    return res.status(401).json({ code: 401, msg: 'Token无效' });
  }
};

