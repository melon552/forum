import request from "../utils/request"

// //用户登录
export const login = (data) => {
  return request.post('/api/user/login', data)
}

//用户注册
export const register = (data) => {
  return request.post('/api/user/register', data)
}
//推荐列表
// export const recommendList = (params) => {
//   return request.get('/api/content/recommend', params,

//   )
// }
//推荐列表
export const recommendList = (params) => {
  return request({
    url: '/api/content/recommend',
    method: 'get',
    params,

  });
};

//故事列表
export const getTaleList = (params) => {
  return request({
    url: '/api/tale/list',
    method: 'get',
    params,

  });
};

//帖子列表
export const getPostList = (params) => {
  return request.get('/api/post/list', params)
}

//个人信息
export const getUserInfo = (data) => {
  return request.get('/api/user/info', data)
}

//更新个人信息
export const updateUserInfo = (data) => {
  return request.put('/api/user/update', data)
}

//获取点赞信息
export const getLikes = (data) => {
  return request.get('/api/user/likes', data)
}

//获取收藏信息
export const getCollects = (data) => {
  return request.get('/api/user/collects', data)
}

//修改密码
export const updatePassword = (data) => {
  return request.put('/api/user/changepassword', data)
}

//发布故事
export const publishStory = (data) => {
  return request.post('/api/tale', data)
}
//保存草稿
export const saveDraft = (data) => {
  return request.post('/api/tale/draft', data)
}
//草稿详情
export const draftDetail = (taleId) => {
  return request.get(`/api/tale/draft/${taleId}`)
}

//上传图片
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  console.log('传递给后端的 FormData：', formData.get('avatar')); // 验证文件是否在 FormData 中
  return request.post('/api/upload/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
//故事详情
export const getTaleDetail = (taleId) => {
  return request.get(`/api/tale/${taleId}`);
}
//故事点赞
export const likeTale = (taleId) => {
  return request.post(`/api/tale/${taleId}/like`)
}

//删除故事
export const deleteTale = (taleId) => {
  return request.delete(`/api/tale/${taleId}`)
}

//编辑故事
export const updateTale = (taleId, data) => {
  return request.put(`/api/tale/${taleId}`, data)
}

//收藏故事
export const collectTale = (taleId) => {
  return request.post(`/api/tale/${taleId}/collect`)
}

//编辑故事
export const updatePost = (postId, data) => {
  return request.put(`/api/post/${postId}`, data)
}

//收藏帖子
export const collectPost = (postId) => {
  return request.post(`/api/post/${postId}/collect`)
}

//删除帖子
export const deletePost = (postId) => {
  return request.delete(`/api/post/${postId}`)
}

//点赞帖子
export const likePost = (postId) => {
  return request.post(`/api/post/${postId}/like`)
}
//发布故事评论
export const createTaleComment = (taleId, data) => {
  return request.post(`/api/comment/tale/${taleId}`, data)
}

//发布帖子评论
export const createPostComment = (postId, data) => {
  return request.post(`/api/comment/post/${postId}`, data)
}
//查看故事评论
export const getTaleComment = (taleId, data) => {
  return request.get(`/api/comment/tale/${taleId}`, data)
}
//查看帖子评论
export const getPostComment = (postId, data) => {
  return request.get(`/api/comment/post/${postId}`, data)
}
//帖子详情
export const getPostDetail = (postId) => {
  return request.get(`/api/post/${postId}`)
}


//保存草稿
export const savePostDraft = (data) => {
  return request.post('/api/post/draft', data)
}
//草稿详情
export const draftPostDetail = (postId) => {
  return request.get(`/api/post/draft/${postId}`)
}

//发布帖子
export const publishPost = (data) => {
  return request.post('/api/post', data)
}