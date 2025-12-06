<template>
  <div class="layout">
    <el-container class="root-container">
      <el-header class="header-container">
        <Header />
      </el-header>
      <el-container class="body-container"> 
        <!-- 侧边栏：添加过渡动画 + 固定宽度不挤压 -->
        <el-aside 
          width="200px" 
          v-if="!hideSidebar"
          class="aside-container"
          transition="width 0.3s ease"
        >
          <Aside />
        </el-aside>
        <!-- 主内容区：添加隔离容器 + 溢出滚动 -->
        <el-main class="main-container">
          <div class="main-content-wrapper"> <!-- 新增：主内容隔离层 -->
            <!-- <ContentList :activeTab="route.params.type || 'tale'" /> -->
            <router-view :key="$route.fullPath"/>
          </div>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import Header from '../components/NavHeader.vue'
import Aside from '../components/Aside.vue'
import ContentList from '../components/ContentList.vue';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute()
const hideSidebar = computed(() => {
  return route.meta.hideSidebar || false;
});
</script>

<style scoped lang="less">
// 根布局：重置默认样式 + 固定视口高度
.layout {
  width: 100%;
  height: 100%; // 改为100vh，确保占满整个视口（之前是100%可能继承父级高度异常）
  margin: 0;
  padding: 0;
  overflow: hidden; 
  box-sizing: border-box; 
}

// 根容器：强制flex垂直布局，避免塌陷
.root-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column; 
  box-sizing: border-box;
}

// 头部容器：固定高度 + 不压缩 + 边界隔离
.header-container {
  padding: 0 !important; 
  height: 70px; 
  flex-shrink: 0; 
  width: 100%;
  box-sizing: border-box;
  border-bottom: 1px solid #f0f0f0; 
}

// 主体容器：flex水平布局 + 准确计算高度
.body-container {
  display: flex; 
  height: calc(100vh - 70px); 
  flex: 1; 
  width: 100%;
  box-sizing: border-box;
  // 移除overflow: hidden，避免主内容区滚动被截断
}

// 侧边栏：固定宽度 + 不挤压 + 自适应高度（核心修复）
.aside-container {
  width: 200px !important; 
  flex-shrink: 0; 
  background-color: #fff;
  box-sizing: border-box;
  padding: 0; 
  overflow-y: auto; 
  border-right: 1px solid #f0f0f0; 
  // 移除height: 100%，让侧边栏高度随内容自适应，避免空白冗余
}

// 主内容区：自适应宽度 + 溢出滚动 + 边界隔离
.main-container {
  flex: 1; 
  height: 100%;
  padding: 0 !important; 
  margin: 0 !important;
  box-sizing: border-box;
  background-color: #fff; // 改为和侧边栏一致的背景，消除视觉割裂
}

// 主内容隔离层
.main-content-wrapper {
  width: 100%;
  height: 100%;
  padding: 16px 20px; 
  box-sizing: border-box;
  overflow-y: auto; 
  overflow-x: hidden; 
}

// 覆盖element-ui默认样式
:deep(.el-container) {
  width: 100%;
  height: 100%;
  box-sizing: border-box;
}

:deep(.el-header) {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
}

:deep(.el-aside) {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  height: auto !important; // 强制侧边栏高度随内容自适应
}

:deep(.el-main) {
  padding: 0;
  margin: 0;
  box-sizing: border-box;
  height: 100%;
}
</style>