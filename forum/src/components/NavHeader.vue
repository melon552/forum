<template>
  <div class="header">
    <!-- 左侧Logo -->
    <div class="logo" @click="goToHome">贴吧</div>
    
    <!-- 自定义导航链接（替代el-menu） -->
    <div class="nav-links">
      <a 
        href="/storylist" 
        class="nav-link" 
        :class="{ active: currentPath === '/storylist' }"
      >
        故事
      </a>
      <a 
        href="/postlist" 
        class="nav-link" 
        :class="{ active: currentPath === '/postlist' }"
      >
        帖子
      </a>
    </div>
    
    <!-- 搜索框 -->
    <el-input
      class="search-input"
      placeholder="搜索故事、帖子..."
      suffix-icon="Search"
      
    />
    
    <!-- 右侧头像悬浮弹窗 -->
    <div 
      class="avatar-popup-container"
      @mouseenter="showPopup = true" 
      @mouseleave="showPopup = false"
    >
      <el-avatar :size="40" :src="userStore.info.avatar || defaultAvatar" />
      <!-- 悬浮弹窗-上移10px -->
      <div v-if="showPopup" class="user-popup">
        <div class="popup-header">
          <el-avatar size="large" :src="userStore.info.avatar || defaultAvatar" class="popup-avatar" />
          <div class="popup-info">
            <h3 class="username">{{ userStore.info.username || '用户' }}</h3>
            <div class="user-level">
              <el-tag type="success" class="user-tag">
                {{ userStore.info.role || '普通用户' }}
              </el-tag>
              <span class="level">Lv{{ userStore.info.level || 1 }}</span>
            </div>
          </div>
        </div>
        <div class="popup-stats">
          <div class="stat-item">
            <span class="stat-value">{{ collectCount }}</span>
            <span class="stat-label">收藏</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ storyCount }}</span>
            <span class="stat-label">故事</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ postCount }}</span>
            <span class="stat-label">帖子</span>
          </div>
        </div>
        <el-button class="feedback-btn">意见征集</el-button>
        <div class="menu-list">
          <div class="menu-item" @click="goToProfile">
            个人中心 <i class="arrow-icon el-icon-arrow-right"></i>
          </div>
          <div class="menu-item" @click="changePassword">
            修改密码 <i class="arrow-icon el-icon-arrow-right"></i>
          </div>
          <div class="menu-item" @click="logout">
            退出登录 <i class="arrow-icon el-icon-arrow-right"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../store/user';
import { getCollects } from '../api/'; // 仅引入收藏接口

const router = useRouter();
const activeIndex = ref('story');
const showPopup = ref(false);
const userStore = useUserStore();
const collectData = ref({}); // 存储收藏接口返回的完整数据

// 计算收藏总数、故事数、帖子数
const collectCount = computed(() => collectData.value.totalCollected || 0);
const storyCount = computed(() => (collectData.value.collectedTales || []).length);
const postCount = computed(() => (collectData.value.collectedPosts || []).length);

const goToProfile = () => router.push('/person');
const changePassword = () => router.push('/person/change');
const logout = () => {
  userStore.logout();
  router.push('/login');
};

// 调用收藏接口获取数据
const fetchCollectData = async () => {
  const res = await getCollects();
  collectData.value = res.data.data || {};
};

// 监听头像变化，实时更新
watch(
  () => userStore.info.avatar,
  (newAvatar) => {
    console.log('导航栏头像路径（监听）：', newAvatar);
  },
  { immediate: true, deep: true }
);

// 组件挂载时获取用户信息和收藏数据
onMounted(() => {
  userStore.fetchUserInfo();
  console.log('导航栏初始化头像：', userStore.info.avatar);
  fetchCollectData();
});
</script>

<style scoped>
/* 全局清新风格变量 */
:root {
  --primary: #42b983;
  --primary-light: #e6f7f0;
  --text-primary: #333;
  --text-secondary: #666;
  --border-light: #eee;
  --hover-light: #f5fafe;
}

/* 头部容器 */
.header {
  display: flex;
  align-items: center;
  padding: 0 40px;
  height: 70px;
  border-bottom: 1px solid var(--border-light);
  background-color: #fff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
  position: sticky;
  top: 0;
  z-index: 999;
}

/* Logo样式 */
.logo {
  font-family: "Microsoft Yahei", sans-serif;
  font-size: 28px;
  font-weight: bold;
  color: var(--primary);
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 40px;
  color: #34a06a
}

.logo:hover {
  transform: scale(1.05);
  color: #34a06a;
}

/* 自定义导航链接（核心替换el-menu） */
.nav-links {
  display: flex;
  gap: 30px;
  margin-right: auto;
  /* color: #05c46b */
}

.nav-link {
  font-size: 17px;
  color: var(--text-secondary);
  text-decoration: none;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.3s ease;
  position: relative;
}

/* 激活状态样式 */
.nav-link.active {
  color: var(--primary);
  font-weight: 500;
}

/* 激活状态下划线 */
.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 12px;
  width: calc(100% - 24px);
  height: 3px;
  background-color: var(--primary);
  border-radius: 3px;
}

/* 悬停效果 */
.nav-link:hover {
  color: var(--primary);
  background-color: var(--primary-light);
}

/* 搜索框样式 */
.search-input {
  width: 280px;
  margin: 0 30px;
  border-radius: 20px;
  border: 1px solid var(--border-light);
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1);
}

/* 头像悬浮容器 */
.avatar-popup-container {
  position: relative;
  display: inline-block;
  padding: 4px;
  cursor: pointer;
}

/* 用户弹窗样式 */
.user-popup {
  position: absolute;
  top: calc(100% - 10px);
  right: 0;
  z-index: 999;
  width: 280px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 20px;
  box-sizing: border-box;
  animation: popupFadeIn 0.3s ease-out;
}

@keyframes popupFadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.popup-header {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

.popup-avatar {
  width: 64px;
  height: 64px;
  border: 2px solid var(--primary-light);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  margin-right: 16px;
}

.popup-info {
  flex: 1;
}

.username {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 6px;
  color: #1d2129;
}

.user-level {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-tag {
  font-size: 12px;
  padding: 2px 8px;
  background: linear-gradient(90deg, #66d9e8 0%, #22c55e 100%);
  color: #fff;
  border: none;
}

.level {
  font-size: 13px;
  color: #666;
}

.popup-stats {
  display: flex;
  justify-content: space-between;
  margin: 16px 0;
  padding: 12px 0;
  border-top: 1px solid #f2f3f5;
  border-bottom: 1px solid #f2f3f5;
}

.stat-item {
  text-align: center;
  flex: 1;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #86909c;
}

.feedback-btn {
  width: 100%;
  margin: 8px 0;
  background: linear-gradient(90deg, #66d9e8 0%, #22c55e 100%);
  border: none;
  color: #fff;
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  transition: all 0.3s;
}

.feedback-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  background: linear-gradient(90deg, #53d1e0 0%, #16a34a 100%);
}

.menu-list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-item {
  padding: 10px 0;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  border-radius: 6px;
  padding-left: 8px;
  width: 100%;
  box-sizing: border-box;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: var(--text-secondary);
}

.arrow-icon {
  color: var(--primary);
  font-size: 16px;
  transition: transform 0.2s ease;
}

.menu-item:hover .arrow-icon {
  transform: translateX(3px);
}

.menu-item:hover {
  background-color: var(--primary-light);
  color: var(--primary);
  padding-left: 12px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .header {
    padding: 0 20px;
    height: 60px;
  }

  .logo {
    font-size: 24px;
    margin-right: 20px;
  }

  .nav-links {
    gap: 15px;
  }

  .nav-link {
    font-size: 14px;
    padding: 6px 8px;
  }

  .search-input {
    width: 180px;
    margin: 0 15px;
  }
}

@media (max-width: 480px) {
  .search-input {
    display: none; /* 移动端隐藏搜索框 */
  }

  .nav-links {
    gap: 10px;
  }
}
</style>