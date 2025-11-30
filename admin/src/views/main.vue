<template>
  <div class="layout">
    <el-container>
      <el-aside class="aside">
        <Aside />
      </el-aside>
      <el-container>
      <el-header class="header">
        <NavHead />
      </el-header>
      <el-main>
        <div class="breadcrumb-wrapper" v-if="route.path !== '/home'">
          <el-breadcrumb separator="/" >
            <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
            <!-- 动态渲染面包屑（根据当前路由） -->
            <template v-for="(item, index) in breadcrumbList" :key="index">
              <el-breadcrumb-item v-if="!item.link">
                {{ item.name }}
              </el-breadcrumb-item>
              <el-breadcrumb-item v-else>
                <a :href="item.link">{{ item.name }}</a>
              </el-breadcrumb-item>
            </template>
          </el-breadcrumb>
        </div>
        <RouterView />
      </el-main>
    </el-container>
    </el-container>
    
  </div>

</template>
<script setup>
import NavHead from '../components/navHead.vue';
import Aside from '../components/aside.vue';

import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const breadcrumbList = ref([]);

// 监听路由变化，动态生成面包屑
watch(
  () => route.path,
  (newPath) => {
    // 根据路由路径匹配面包屑（示例：适配你的路由）
    switch (newPath) {
      case '/user/list':
        breadcrumbList.value = [{ name: '用户列表', link: '/user/list' }];
        break;
      case '/post/list':
        breadcrumbList.value = [{ name: '帖子列表', link: '/post/list' }];
        break;
      case '/tale/list':
        breadcrumbList.value = [{ name: '故事列表', link: '/tale/list' }];
        break;
      case '/person':
        breadcrumbList.value = [{ name: '个人中心', link: '/person' }];
        break;
      case '/changepassword':
        breadcrumbList.value = [{ name: '修改密码', link: '/changepassword' }];
        break;
      default:
        breadcrumbList.value = [];
    }
  },
  { immediate: true }
);
</script>
<style scoped lang="sass">
.aside
  width: 220px 
  background-color: #fff
  border:0px
  overflow-x: hidden

.header
  width:100%
  padding:0

  
</style>