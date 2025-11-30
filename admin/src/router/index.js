import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/login/login.vue';
import Home from '../views/home/home.vue'
import Main from '../views/main.vue';
import UserList from '../views/user/userList.vue';
import PostList from '../views/post/postList.vue';
import TaleList from '../views/tale/taleList.vue';
import Person from '../views/person/person.vue';
import ChangePwd from '../views/person/changePwd.vue';
const routes = [
  { path: '/login', component: Login, meta: { type: 'login' } },
  { path: '/register', component: Login, meta: { type: 'register' } },
  {
    path: '/', component: Main, meta: { type: 'layout', requiresAuth: true },
    redirect: '/home',
    children: [
      { path: 'home', component: Home, meta: { type: 'home', title: '首页' } }, // 简化路径（去掉前置 /）
      { path: 'user/list', component: UserList, meta: { type: 'user', title: '用户管理' } }, // 规范路径命名
      { path: 'post/list', component: PostList, meta: { type: 'post', title: '帖子管理' } },
      { path: 'tale/list', component: TaleList, meta: { type: 'tale', title: '故事管理' } },
      { path: '/person', component: Person, meta: { type: 'person' } },
      { path: '/changepassword', component: ChangePwd, meta: { type: 'changePwd' } }
    ]
  },


]



const router = createRouter({
  routes,
  history: createWebHistory()
})

// router.beforeEach((to, from, next) => {
//   // 示例：未登录时跳转到登录页（需配合登录状态存储）
//   const isLogin = localStorage.getItem('token') // 假设登录后存储token
//   if (to.meta.requiresAuth && !isLogin) {
//     next('/login')
//   } else {
//     next()
//   }
// })

export default router;