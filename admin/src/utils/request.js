import axios from "axios";
import { ElMessage } from "element-plus";


const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000
})
// 添加请求拦截器
request.interceptors.request.use((config) => {
  const excludePaths = ['/admin/login'];
  if (!excludePaths.includes(config.url) && config.url) {
    const token = localStorage.getItem('A_token')
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`

    }
  }
  return config;

}, (error) => {
  return Promise.reject(error);
});

// 添加响应拦截器
request.interceptors.response.use((response) => {
  // 2xx 范围内的状态码都会触发该函数。
  // 对响应数据做点什么
  if (!response) {
    let token = response.headers.authorization;
    if (!token && response.data?.data?.token) {
      token = response.data.data.token;
    }
    if (token) {
      localStorage.setItem('A_token', token);
    } else {
      // console.warn('后端未返回 Token，请检查接口');
    }
  }

  const res = response.data;
  if (res.code !== 200) {
    ElMessage.error(res.msg || '请求失败');
    return Promise.reject(new Error(res.msg || '请求失败'));
  }
  return response;
}, (error) => {
  // 超出 2xx 范围的状态码都会触发该函数。
  // 对响应错误做点什么
  if (!error.response) {
    ElMessage.error('网络异常，请检查连接');
    return Promise.reject(error);
  }
  const { status } = error.response;
  if (status === 401) {
    console.log(error.response.data);
    localStorage.removeItem('A_token');
    // 避免重复跳转：当前页面不是登录页时才跳转
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  } else if (status === 403) {
    ElMessage.error('无权限进行此操作');
  } else {
    ElMessage.error('服务器出错，请重试');
  }
  return Promise.reject(error);
});
export default request;