import { createRouter, createWebHistory } from 'vue-router'

import Layout from '../views/Main.vue';
import Login from '../views/login/Login.vue'

import Home from '../views/home/Home.vue'
import StoryList from '../views/list/StoryList.vue';
import PostList from '../views/list/PostList.vue';
import PublishPost from '../views/publish/PublishPost.vue';
import PublishStory from '../views/publish/PublishStory.vue';
import Person from '../views/person/person.vue';
import PersonList from '../views/person/personList.vue';
import PersonHome from '../views/person/personHome.vue';
import PostDetail from '../views/detail/postDetail.vue';
import TaleDetail from '../views/detail/taleDetail.vue';
import Edit from '../views/edit/edit.vue';
import Change from '../views/person/change.vue';
//定义路由
const routes = [
  { path: '/login', component: Login, meta: { type: 'login' } },
  { path: '/register', component: Login, meta: { type: 'register' } },
  {
    path: '/',
    component: Layout,
    meta: { requiresAuth: true },
    children: [
      { path: '', component: Home },
      { path: 'storylist', component: StoryList, meta: { title: '故事列表' } },
      { path: 'postlist', component: PostList, meta: { title: '帖子列表' } },
      { path: 'publishpost', component: PublishPost, meta: { title: '发布帖子' } },
      { path: 'publishstory', component: PublishStory, meta: { title: '发布故事' } },
      {
        path: 'person', component: Person, meta: { title: '个人中心' },
        children: [
          { path: '', component: PersonHome, meta: { title: '个人中心首页' } }, // 默认子路由
          { path: 'personList', component: PersonList, meta: { title: '个人信息' } },
          { path: 'change', component: Change, meta: { title: '修改密码' } }
        ]
      },
      { path: '/detail/:type/:id', name: 'Detail', component: TaleDetail, meta: { title: '详情页' } },
      { path: '/edit/:type/:id/', name: 'Edit', component: Edit, meta: { title: '编辑页' } }
    ]
  },
]

// //路由守卫，验证用户登陆状态
// router.beforeEach((to, from, next) => {
//   if (to.meta.requiresAuth) {
//     // 假设用 localStorage 存储登录令牌
//     const token = localStorage.getItem('token')
//     if (token) {
//       next() // 已登录，放行
//     } else {
//       next('/login') // 未登录，跳转到登录页
//     }
//   } else {
//     next() // 不需要登录的页面（登录/注册）直接放行
//   }
// })





const router = createRouter({
  //路由数据

  // routes: [
  //   {
  //     path: '/taledetail/:taleId', // 必须与跳转路径格式完全一致
  //     name: 'TaleDetail',
  //     component: TaleDetail
  //   }
  // ],

  routes,
  //路由匹配模式
  history: createWebHistory(),
})


router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth) {
    // 读取存储的 Token（与请求拦截器一致，是 lt_token）
    const token = localStorage.getItem('lt_token');
    if (token) {
      next(); // 已登录，放行
    } else {
      // 未登录，跳转到登录页，避免循环
      if (to.path !== '/login') {
        next('/login');
      } else {
        next();
      }
    }
  } else {
    next(); // 不需要登录的页面（登录/注册）直接放行
  }
});
export default router