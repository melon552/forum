<template>
  <div class="header-container">
    <!-- 左侧：Logo + 标题 -->
    <div class="header-left">
      <div class="header-logo">
        <el-icon :size="30"><Grid /></el-icon>
        <span class="header-title">贴吧后台管理中心</span>
      </div>
    </div>

    <!-- 右侧：用户头像 + 下拉菜单 -->
    <div class="header-right">
      <!-- 下拉菜单容器：click触发，点击外部自动关闭 -->
      <el-dropdown trigger="click" @command="handleMenuClick">
        <el-avatar 
          :size="45" 
          class="user-avatar" 
          :src="userAvatar"
          @error="handleAvatarError"
          role="button"
        >
          <template #default>
            <el-icon :size="20"><User /></el-icon>
          </template>
        </el-avatar>

        <!-- 下拉菜单内容（新增退出登录选项） -->
        <template #dropdown>
          <el-dropdown-menu class="avatar-dropdown-menu">
            <el-dropdown-item command="personal">
              <el-icon><User /></el-icon>
              <span>个人中心</span>
            </el-dropdown-item>
            <el-dropdown-item command="password">
              <el-icon><Lock /></el-icon>
              <span>修改密码</span>
            </el-dropdown-item>
            <!-- 新增：退出登录分隔线 + 选项 -->
            <el-dropdown-divider />
            <el-dropdown-item command="logout" style="color: #f56c6c">
              <el-icon><SwitchButton /></el-icon>
              <span>退出登录</span>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
// 新增：导入退出登录相关图标和弹窗组件
import { Grid, User, Lock, SwitchButton } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

// 引入获取管理员信息的接口
import { getAdminInfo } from '../api/index';

// 初始化路由实例
const router = useRouter();

// 用户头像（默认占位图）
const userAvatar = ref('https://picsum.photos/id/64/200');
// 加载状态（避免重复请求）
const loading = ref(false);

// 处理菜单点击事件（新增退出登录逻辑）
const handleMenuClick = (command) => {
  switch (command) {
    case 'personal':
      router.push('/person').catch(err => {
        if (!err.message.includes('Avoided redundant navigation')) {
          console.error('跳转个人中心失败：', err);
        }
      });
      break;
    case 'password':
      router.push('/changepassword').catch(err => {
        if (!err.message.includes('Avoided redundant navigation')) {
          console.error('跳转修改密码失败：', err);
        }
      });
      break;
    // 新增：退出登录逻辑
    case 'logout':
      handleLogout();
      break;
    default:
      break;
  }
};

// 新增：退出登录核心方法
const handleLogout = async () => {
  try {
    // 弹出确认弹窗
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '退出确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    );

    // 1. 清除本地登录态（Token等）
    localStorage.removeItem('A_token');
    localStorage.removeItem('admin_username'); // 清除记住的用户名（如有）
    
    // 2. 重置头像（可选）
    userAvatar.value = 'https://picsum.photos/id/64/200';
    
    // 3. 跳转登录页
    ElMessage.success('已成功退出登录');
    router.push('/login').catch(err => {
      console.error('跳转登录页失败：', err);
    });
  } catch (err) {
    // 取消退出时的提示（可选）
    if (err !== 'cancel') {
      ElMessage.error('退出登录失败，请重试');
      console.error('退出登录异常：', err);
    }
  }
};

// 从后端获取最新管理员信息（核心：直接调用接口）
const fetchAdminInfo = async () => {
  // 避免重复请求
  if (loading.value) return;
  
  try {
    // 获取管理员Token（登录时存储的Token，仅用于鉴权，不存头像）
    const token = localStorage.getItem('A_token');
    if (!token) {
      ElMessage.warning('请先登录');
      router.push('/login');
      return;
    }

    loading.value = true;
    // 调用接口获取最新用户信息
    const res = await getAdminInfo();
    
    if (res.data?.code === 200 && res.data?.data) {
      // 直接更新头像（从接口返回值中取）
      userAvatar.value = res.data.data.avatar || userAvatar.value;
    } else {
      ElMessage.error('获取用户信息失败：' + (res.data?.msg || '接口返回异常'));
    }
  } catch (err) {
    console.error('获取管理员信息异常：', err);
    ElMessage.error('网络错误，无法获取用户信息');
  } finally {
    loading.value = false;
  }
};

// 头像加载失败兜底
const handleAvatarError = () => {
  userAvatar.value = 'https://picsum.photos/id/64/200'; // 替换为你的默认头像
};

// 监听路由变化（从个人中心/修改密码返回时，重新拉取头像）
watch(
  () => router.currentRoute.path,
  (newPath) => {
    // 匹配个人中心/修改密码/后台首页路由，触发刷新
    if (['/person', '/changepassword', '/admin'].includes(newPath)) {
      fetchAdminInfo();
    }
  },
  { immediate: true } // 初始化时立即执行一次
);

// 页面挂载时强制刷新一次
onMounted(() => {
  fetchAdminInfo();
});
</script>

<style scoped lang="sass">
// 基础布局样式（保留原有）
.header-container
  height: 60px
  background-color: #fff 
  display: flex
  justify-content: space-between
  align-items: center
  padding: 0  
  margin: 0
  color: #063b78
  width: 100%
  border-bottom: 1px solid #ccc

// 左侧Logo+标题样式
.header-left
  padding: 0
  margin: 0
  .header-logo
    display: flex
    align-items: center
    gap: 8px
    padding: 0 10px
    margin: 0

    .el-icon
      color: #063b78

    .header-title
      font-size: 18px
      font-weight: 500
      color: #063b78

// 右侧头像+下拉菜单样式
.header-right
  padding: 0
  margin: 0
  position: relative

  .user-avatar
    cursor: pointer
    border: 2px solid #a0cfff
    transition: transform 0.2s ease
    margin-right: 20px

    &:hover
      transform: scale(1.05)

  // 自定义下拉菜单样式
  :deep(.avatar-dropdown-menu)
    width: 160px
    border-radius: 8px
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08)
    border: 1px solid #e8f4ff

    .el-dropdown-item
      display: flex
      align-items: center
      gap: 8px
      padding: 10px 16px
      font-size: 14px
      color: #333

      &:hover
        background-color: #e8f4ff
        color: #063b78

      .el-icon
        font-size: 16px
        color: #063b78

    // 新增：退出登录选项样式
    .el-dropdown-item[command="logout"]
      &:hover
        background-color: #fef0f0
        color: #f56c6c

      .el-icon
        color: #f56c6c

  // 分隔线样式优化
  :deep(.el-dropdown-divider)
    margin: 4px 0
    background-color: #e8f4ff
</style>