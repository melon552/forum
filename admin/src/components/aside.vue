<template>
  <div class="sidebar-container" :class="{ 'sidebar-collapsed': isCollapsed }">
    <div class="title">贴吧</div>
    <el-menu
      :default-active="activeMenu"
      class="sidebar-menu"
      text-color="#fff"
      active-text-color="#ffd700"
      :collapse="isCollapsed"
      :collapse-transition="false"
      background-color="#063b78"
      @select="handleMenuSelect" 
    >
      <!-- 首页 -->
      <el-menu-item index="/home" class="menu-level-1">
        <el-icon :size="20"><House /></el-icon>
        <template #title>首页</template>
      </el-menu-item>

      <!-- 用户管理 -->
      <el-sub-menu index="user" class="menu-level-1">
        <template #title>
          <el-icon :size="20"><User /></el-icon>
          <span>用户管理</span>
        </template>
        <el-menu-item index="/user/list" class="menu-level-2">
          <el-icon :size="18"><User /></el-icon>
          <template #title>用户列表</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- 帖子管理 -->
      <el-sub-menu index="post" class="menu-level-1">
        <template #title>
          <el-icon :size="20"><Document /></el-icon>
          <span>帖子管理</span>
        </template>
        <el-menu-item index="/post/list" class="menu-level-2">
          <el-icon :size="18"><Document /></el-icon>
          <template #title>帖子列表</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- 故事管理 -->
      <el-sub-menu index="tale" class="menu-level-1">
        <template #title>
          <el-icon :size="20"><Reading /></el-icon>
          <span>故事管理</span>
        </template>
        <el-menu-item index="/tale/list" class="menu-level-2">
          <el-icon :size="18"><Reading /></el-icon>
          <template #title>故事列表</template>
        </el-menu-item>
      </el-sub-menu>

      <!-- 评论管理 -->
      <el-sub-menu index="comment" class="menu-level-1">
        <template #title>
          <el-icon :size="20"><ChatDotRound /></el-icon>
          <span>评论管理</span>
        </template>
        <el-menu-item index="/comment/list" class="menu-level-2">
          <el-icon :size="18"><ChatDotRound /></el-icon>
          <template #title>评论列表</template>
        </el-menu-item>
      </el-sub-menu>
    </el-menu>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router'; // 导入路由钩子


const router = useRouter();
const route = useRoute();
const isCollapsed = ref(false);
const activeMenu = ref('/home'); // 默认激活首页

// 菜单选择事件：跳转对应路由
const handleMenuSelect = (index) => {
  // 过滤非路由的index（如子菜单父级index）
  if (index.startsWith('/')) {
    router.push(index);
  }
};

// 监听路由变化，更新激活的菜单
watch(
  () => route.path,
  (newPath) => {
    activeMenu.value = newPath;
  },
  { immediate: true } // 初始加载时执行
);

// 从本地存储恢复侧边栏收缩状态
onMounted(() => {
  const savedState = localStorage.getItem('sidebarCollapsed');
  if (savedState !== null) {
    isCollapsed.value = savedState === 'true';
  }
});
</script>

<style scoped lang="sass">
// 保留原有样式，无需修改
.sidebar-container
  width: 100%
  height: 100vh
  background-color: #063b78 
  border-right: 1px solid #1a4d8c
  overflow-x: hidden
  padding: 0
  overflow-y: auto 

.title
  text-align: center
  height: 50px
  line-height: 50px
  font-size: 20px
  font-weight: 600
  color: #fff
  border-bottom: 1px solid #1a4d8c
  background-color: #063b78 
  letter-spacing: 1px

.sidebar-menu
  width: 100%
  border-right: none
  height: auto
  padding-top: 10px
  margin: 0

.menu-level-1
  &.el-menu-item, &.el-sub-menu__title
    height: 48px 
    line-height: 48px 
    padding-left: 20px 
    background-color: #063b78 
    color: #fff 

    &:hover
      background-color: #1a4d8c 

    &.is-active
      background-color: #1a2e4a 
      color: #ffd700 
      font-weight: 500

.menu-level-2
  &.el-menu-item
    height: 44px 
    line-height: 44px 
    padding-left: 40px 
    
    &:hover
      background-color: #1a4d8c 
      color: #fff

    &.is-active
      background-color: #1a2e4a 
      color: #ffd700 

.el-sub-menu .el-menu
  background-color: #084794  
  width: 100% 
  margin: 0 
  padding: 0 
  border-left: 2px solid #ffd700 

.el-icon
  color: #e0efff 
.is-active .el-icon
  color: #ffd700 

.sidebar-collapsed
  .menu-level-1 .el-sub-menu__title span, .menu-level-1 .el-menu-item__content span
    opacity: 0
  .menu-level-2
    display: none 
</style>