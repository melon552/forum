<template>
  <div class="detail-container">
    
    
    <!-- 2. 直接判断 currentItem 是否存在 -->
    <div v-if="currentItem" class="content-layout">
      
      <!-- 左侧：因为只渲染 currentItem，所以这里只会显示这一个 -->
      <aside class="left-sidebar">
        <div class="action-item">
          <div class="icon-circle share">❤️</div>
          <span class="badge">{{ currentItem.goodNumber }}</span>
        </div>
        <div class="action-item">
          <div class="icon-circle comment">💬</div>
          <span class="badge">{{currentItem.Comment}}</span>
        </div>
        <div class="action-item">
          <div class="icon-circle like">⭐</div>
          <!-- 这里的 currentItem 是单数，直接取值 -->
          <span class="badge">{{ currentItem.whoCollection.length }}</span>
        </div>
      </aside>

      <!-- 中间内容 -->
      <main class="center-content">
        <!-- 直接使用 currentItem.title -->
        <h1 class="title">{{ currentItem.title }}</h1>
        
        <div class="meta-info">
          <span>{{ currentItem.author?.username }}</span>
          <span>{{ currentItem.time }}</span>
          <span>👁 {{ currentItem.lookNumber }}</span>
        </div>

        <div class="divider"></div>

        <div class="article-body">
          {{ currentItem.content }}
        </div>
      </main>

      <!-- 右侧作者 -->
      <aside class="right-sidebar">
        <div class="author-card">
           <img :src="currentItem.author?.avatar" class="avatar" />
           <div class="author-text">
             <div class="username">{{ currentItem.author?.username }}</div>
           </div>
        </div>
      </aside>

    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      暂无内容
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {useRoute} from 'vue-router'
import { recommendList } from '../api/index'; 

// 接收父组件传来的当前激活的 Tab
// 'tale' 对应 type=1 (故事), 'post' 对应 type=0 (帖子)
const props = defineProps({
  activeTab: {
    type: String,
    required: true,
    default: 'tale' 
  }
});
const route=useRoute()
const listData = ref([]);
const loading = ref(false);

// 核心逻辑：根据 activeTab 自动计算出需要展示的那一条数据
const currentItem = computed(() => {
  if (!listData.value || listData.value.length === 0) return null;

  // 1. 获取 URL 上的参数，如果没有，默认 'tale'
  const typeParam = route.params.type || 'tale';

  // 2. 转换成对应的数字 (tale->1, post->0)
  const targetType = typeParam === 'tale' ? 1 : 0;

  console.log(`当前路由参数: ${typeParam}, 寻找 type: ${targetType}`);

  // 3. 筛选数据
  return listData.value.find(item => item.type === targetType);
});
// 获取数据
const fetchData = async () => {
  loading.value = true;
  try {
    // 调用你提供的 API
    const res = await recommendList({});
    // 根据图2截图，数据结构是 res.data.list 或 res.list，请根据实际响应调整
    // 这里假设拦截器处理后直接返回数据，或者结构为 res.data.list
    if (res.data && res.data.data.list) {
        listData.value = res.data.data.list;
    } else if (res.list) {
        listData.value = res.list;
    }
  } catch (error) {
    console.error("获取推荐列表失败", error);
  } finally {
    loading.value = false;
  }
};

// 工具：日期格式化
const formatDate = (isoStr) => {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
};

// 工具：头像加载失败处理（可选）
const handleImgError = (e) => {
  e.target.src = 'https://via.placeholder.com/100'; // 默认头像
};

// 组件挂载时请求数据
onMounted(() => {
  fetchData();
});
</script>

<style scoped>
/* 布局容器 */
.detail-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 20px;
}

.content-layout {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

/* --- 左侧边栏 --- */
.left-sidebar {
  width: 60px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-top: 10px;
}

.action-item {
  position: relative;
  cursor: pointer;
  display: flex;
  justify-content: center;
}

.icon-circle {
  width: 45px;
  height: 45px;
  background: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  color: #666;
  transition: all 0.3s;
}

.icon-circle:hover {
  color: #409eff;
  transform: translateY(-2px);
}

.badge {
  position: absolute;
  top: -5px;
  right: 0;
  background-color: #909399;
  color: #fff;
  font-size: 10px;
  padding: 2px 5px;
  border-radius: 10px;
  line-height: 1;
}

/* --- 中间内容区 --- */
.center-content {
  flex: 1;
  background: #fff;
  border-radius: 4px;
  padding: 30px 40px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
  min-height: 400px;
}

.title {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin-bottom: 15px;
}

.meta-info {
  display: flex;
  align-items: center;
  font-size: 13px;
  color: #999;
  margin-bottom: 15px;
}

.meta-info span {
  margin-right: 20px;
}

.author-link {
  color: #666;
}

.divider {
  height: 1px;
  background: #ebeef5;
  margin-bottom: 25px;
}

.article-body {
  font-size: 15px;
  line-height: 1.8;
  color: #333;
  white-space: pre-wrap; /* 保持后端返回的换行格式 */
  text-align: justify;
}

/* --- 右侧作者栏 --- */
.right-sidebar {
  width: 260px;
  flex-shrink: 0;
}

.author-card {
  background: #fff;
  border-radius: 4px;
  padding: 15px;
  display: flex;
  align-items: center;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 12px;
  border: 1px solid #eee;
}

.author-text {
  flex: 1;
  overflow: hidden;
}

.username {
  font-size: 14px;
  font-weight: bold;
  color: #67c23a; /* 图1中的绿色名字 */
  margin-bottom: 4px;
}

.intro {
  font-size: 12px;
  color: #999;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 响应式适配 */
@media (max-width: 900px) {
  .content-layout {
    flex-direction: column;
  }
  .left-sidebar {
    flex-direction: row;
    width: 100%;
    justify-content: flex-start;
  }
  .right-sidebar {
    width: 100%;
  }
}
</style>