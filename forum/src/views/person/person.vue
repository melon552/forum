<template>
  <div class="profile-container">
    <!-- 左侧导航 -->
    <el-menu
      default-active="home"
      class="profile-menu"
      mode="vertical"
      background-color="transparent"
      text-color="#333"
      active-text-color="#05c46b"
    >
      <el-menu-item index="home" @click="goHome">首页</el-menu-item>
      <el-menu-item index="info" @click="personal">个人信息</el-menu-item>
      <el-menu-item index="change" @click="changePassword">修改密码</el-menu-item>
      <!-- 可根据需求添加更多菜单 -->
    </el-menu>

    <!-- 右侧内容 -->
    <div class="profile-content">
      <router-view/>
      <!-- 内容标签页 -->
      <!-- <el-tabs v-model="activeTab" class="content-tabs">
        <el-tab-pane label="点赞" name="like">
          <div class="item-list">
            <div class="item" v-for="item in likeList" :key="item.id">
              <h4>{{ item.title }}</h4>
              <p>{{ item.desc }}</p>
              <div class="item-meta">
                <span>{{ item.author }}</span>
                <span>👁️ {{ item.view }}</span>
                <span>💚 {{ item.like }}</span>
              </div>
            </div>
          </div>
        </el-tab-pane>
        <el-tab-pane label="收藏" name="collect">
          <div class="empty-tip" v-if="collectList.length === 0">暂无收藏内容</div>
        </el-tab-pane>
      </el-tabs> -->
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
// import { useUserStore } from '../../store/user';
import { useRouter } from 'vue-router';

// const userStore=useUserStore()
const router=useRouter()
const personal=()=>{
  router.push('/person/personList')
}
const goHome = () => {
  router.push('/person');
};
const changePassword=()=>{
  router.push('/person/change');
}
// const fetchUserInfo = async () => {
//   try {
//     const res = await getUserInfo();S
//     user.value = res.data.data;
//   } catch (error) {
//     console.error('获取用户信息失败:', error);
//   }
// };

// onMounted(() => {
//   userStore.fetchUserInfo(); // 页面加载时获取用户信息
// });


const collectList = ref([]);
</script>

<style scoped>
.profile-container {
  display: flex;
  gap: 20px;
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.profile-menu {
  width: 200px;
  border: none;
}

.profile-content {
  flex: 1;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.info-right {
  flex: 1;
}

.user-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.username {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
}

.user-tag {
  height: 24px;
  line-height: 24px;
  padding: 0 8px;
}

.level {
  background-color: #30c27b;
  color: #fff;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.exp-bar {
  height: 8px;
  margin-left: 10px;
  flex: 1;
}

.energy {
  color: #30c27b;
  font-size: 16px;
}

.content-tabs {
  margin-top: 20px;
}

.item-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.item {
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.item-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
  margin-top: 8px;
}

.empty-tip {
  text-align: center;
  padding: 30px;
  color: #999;
}
</style>