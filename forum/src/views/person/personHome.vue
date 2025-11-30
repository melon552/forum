<template>
  <div>
    <!-- 用户信息区域 -->
    <div class="user-info" v-if="userStore.info.username">
      <el-avatar :src="userStore.info.avatar" size="large" class="avatar" />
      <div class="info-right">
        <div class="user-meta">
          <h3 class="username">{{ userStore.info.username }}</h3>
          <el-tag type="success" class="user-tag">{{ userStore.info.role || '普通用户' }}</el-tag>
          <span class="level">Lv{{ userStore.info.level || 1 }}</span>
          <el-progress :percentage="35" :show-text="false" class="exp-bar" />
        </div>
        <div class="energy">能量: {{ userStore.info.energy || 137 }}</div>
      </div>
    </div>
    <div class="empty-tip" v-else>加载中...</div>

    <!-- 内容标签页 -->
    <el-tabs v-model="activeTab" class="content-tabs">
      <el-tab-pane label="点赞" name="like">
        <div v-if="likes.length > 0" class="item-list">
          <div 
            v-for="item in likes" 
            :key="item.postId || item.taleId" 
            class="item"
            @click="goToDetail(item.targetType, item.postId || item.taleId)"
          >
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta">
              <span>作者: {{ item.userInfo?.username || item.authorInfo?.username || '未知作者' }}</span>
              <span>点赞数: {{ item.goodNumber }}</span>
              <span>发布时间: {{ formatTime(item.time) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-tip">暂无点赞内容</div>
      </el-tab-pane>
      <el-tab-pane label="收藏" name="collect">
        <div v-if="collects.length > 0" class="item-list">
          <div 
            v-for="item in collects" 
            :key="item.postId || item.taleId" 
            class="item"
            @click="goToDetail(item.targetType, item.postId || item.taleId)"
          >
            <div class="item-title">{{ item.title }}</div>
            <div class="item-meta">
              <span>作者: {{ item.userInfo?.username || item.authorInfo?.username || '未知作者' }}</span>
              <span>收藏数: {{ item.collectionNumber || 0 }}</span>
              <span>发布时间: {{ formatTime(item.time) }}</span>
            </div>
          </div>
        </div>
        <div v-else class="empty-tip">暂无收藏内容</div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {useRouter} from 'vue-router'
import { useUserStore } from '../../store/user';
import { getLikes, getCollects } from '../../api/'; 
import { formatTime } from '../../utils/format'; 

const userStore = useUserStore();
const activeTab = ref('like');
const likes = ref([]);
const collects = ref([]);
const router=useRouter()
// 获取点赞列表
const fetchLikes = async () => {
  const res = await getLikes();
  const likedPosts = (res.data.data.likedPosts || []).map(item => ({
    ...item,
    userInfo: item.userInfo || {}, // 兜底处理
    targetType: 0
  }));
  const likedTales = (res.data.data.likedTales || []).map(item => ({
    ...item,
    authorInfo: item.authorInfo || {}, // 兜底处理
    targetType: 1
  }));
  likes.value = [...likedPosts, ...likedTales];
};

// 获取收藏列表
const fetchCollects = async () => {
  const res = await getCollects();
  const collectedPosts = (res.data.data.collectedPosts || []).map(item => ({
    ...item,
    userInfo: item.userInfo || {}, // 兜底处理
    targetType: 0
  }));
  const collectedTales = (res.data.data.collectedTales || []).map(item => ({
    ...item,
    authorInfo: item.authorInfo || {}, // 兜底处理
    targetType: 1
  }));
  collects.value = [...collectedPosts, ...collectedTales];
};

// 跳转到内容详情页
const goToDetail = (targetType, id) => {
  const type = targetType === 0 ? 'post' : 'tale'; // 0=帖子→post，1=故事→tale
  router.push({ name: 'Detail', params: { type, id } });
};

onMounted(() => {
  userStore.fetchUserInfo();
  fetchLikes();
  fetchCollects();
});
</script>

<style scoped>
/* 原有样式保持不变 */
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
  cursor: pointer;
  transition: background-color 0.2s;
}

.item:hover {
  background-color: #f9f9f9;
}

.item-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
}

.item-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #999;
}

.empty-tip {
  text-align: center;
  padding: 30px;
  color: #999;
}
</style>