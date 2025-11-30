import request from "../utils/request"
//管理员注册
export const adminRegister = (data) => {
  return request.post('/api/admin/register', data)
}

//管理员登录
export const adminLogin = (data) => {
  return request.post('/api/admin/login', data)
}


//获取所有用户列表
export const getUserInfo = (params) => {
  return request.get('/api/admin/users', { params })
}

//编辑用户
export const updateUser = (userId, data) => {
  return request.put(`/api/admin/user/${userId}/info`, data)
}

//删除用户
export const deleteUser = (userId, data) => {
  return request.delete(`/api/admin/user/${userId}`, data)
}

//上传图片
export const uploadFile = (data) => {
  return request.post('/api/upload/avatar', data)
}



//获取帖子数据
export const getPostList = (params) => {
  return request.get('/api/post/list', { params })
}

//获取帖子详情
export const getPostDetail = (postId, data) => {
  return request.get(`/api/post/${postId}`, data)
}


//更新tiez
export const updatePost = (postId, data) => {
  return request.put(`/api/post/${postId}`, data)
}



//删除帖子
export const deletePost = (postId, data) => {
  return request.delete(`/api/post/${postId}`, data)
}


//获取故事列表

export const getTaleList = (params) => {
  return request.get('/api/tale/list', { params })
}

//获取帖子详情
export const getTaleDetail = (taleId, data) => {
  return request.get(`/api/tale/${taleId}`, data)
}


//更新tiez
export const updateTale = (taleId, data) => {
  return request.put(`/api/tale/${taleId}`, data)
}



//删除帖子
export const deleteTale = (taleId, data) => {
  return request.delete(`/api/tale/${taleId}`, data)
}

//报表
export const getOperationalReport = () => request.get('/api/admin/report');

//管理员个人信息
export const getAdminInfo = (data) => {
  return request.get('/api/admin/info', data)
}


//更新个人信息
export const updateAdminInfo = (data) => {
  return request.put('/api/admin/info', data)
}

//修改密码
export const updateAdminPassword = (data) => {
  return request.put('/api/admin/password', data)
}
