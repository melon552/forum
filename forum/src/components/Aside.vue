<!-- Aside.vue -->
<template>
  <div class="aside">
    <el-menu
      :default-active="$route.path"  
      class="el-menu-vertical-demo"
      router  
      @open="handleOpen"
      @close="handleClose"
    >
      <el-menu-item index="/">  
        <span>首页</span>
      </el-menu-item>
      <el-menu-item index="/storylist">  
        <span>故事列表</span>
      </el-menu-item>
      <el-menu-item index="/postlist">  
        <span>帖子列表</span>
      </el-menu-item>
      <el-sub-menu index="publish">
        <template #title>
          <span>即兴创作</span>
        </template>
        <el-menu-item index="/publishpost">发布帖子</el-menu-item>
        <el-menu-item index="/publishstory">发布故事</el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<script setup>
import { useRoute } from 'vue-router';
const $route = useRoute();  // 引入当前路由实例，用于菜单激活匹配

const handleOpen = (key, keyPath) => {
  console.log(key, keyPath);
};
const handleClose = (key, keyPath) => {
  console.log(key, keyPath);
};
</script>

<style scoped>
.aside {
  height: 100%; /* 继承父元素高度 */
}
.el-menu-vertical-demo {
  border-right: none;
  height: 100%;
}
</style>