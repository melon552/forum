<template>
  <div class="detail-container">
    <!-- 顶部导航栏 -->
    <nav class="detail-nav">
      <button @click="$router.back()" class="back-btn">
        <i class="el-icon-arrow-left"></i> 返回列表
      </button>
    </nav>

    <!-- 加载状态 -->
    <div v-if="detailStore.loading" class="loading-wrapper">
      <div class="loading-spinner"></div>
      <p class="loading-text">内容加载中...</p>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="detailStore.error" class="error-card">
      <i class="el-icon-error-circle error-icon"></i>
      <p class="error-message">{{ detailStore.error }}</p>
      <button @click="retryLoad" class="retry-btn">重试</button>
    </div>

    <!-- 内容主体 -->
    <div v-else-if="detailStore.data" class="content-card animate-fade-in">
      <!-- 标题区域 -->
      <div class="title-section">
        <h1 class="main-title">{{ detailStore.data.data.title }}</h1>
        <div class="meta-info">
          <span class="meta-item">
            <i class="el-icon-user"></i> {{ detailStore.data.data.author }}
          </span>
          <span class="meta-item">
            <i class="el-icon-time"></i> {{ formatTime(detailStore.data.data.time) }}
          </span>
          <span class="meta-item type-tag">
            {{ getTypeName(detailStore.data.data.type) }}
          </span>
        </div>
      </div>

      <!-- 内容区域 -->
      <div class="content-section">
        <div class="content-html" v-html="detailStore.data.data.content"></div>
      </div>

      <!-- 互动区域 -->
      <div class="interaction-bar">
        <button 
          @click="handleLike" 
          :loading="isLoading"
          :class="{ 'like-button': true, 'liked': detailStore.isLiked }"
        >
          <i :class="detailStore.isLiked ? 'el-icon-thumbs-up-filled' : 'el-icon-thumbs-up'"></i>
          <span>{{ detailStore.isLiked ? '取消点赞' : '点赞' }}</span>
        </button>
        
        <button 
          @click="toggleComment" 
          class="comment-button"
          :class="{ active: showComment }"
        >
          <i class="el-icon-comment"></i>
          <span>评论</span>
          <span class="comment-count">{{ commentStore.commentList.list ? commentStore.commentList.list.length : 0 }}</span>
        </button>
      </div>

      <!-- 评论区域 -->
      <div v-if="showComment" class="comment-section animate-slide-up">
        <!-- 评论输入框 -->
        <div class="comment-input-area">
          <el-input
            v-model="commentContent"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
            class="comment-input"
            @keyup.enter="handleCommentSubmit"
          />
          <button 
            @click="handleCommentSubmit" 
            :disabled="!commentContent.trim()"
            class="submit-comment-btn"
          >
            发表评论
          </button>
        </div>

        <!-- 评论列表 -->
        <div class="comment-list">
          <h3 class="comment-title">评论 ({{ commentStore.commentList.total || 0 }})</h3>
          
          <div v-if="commentStore.loading" class="loading-comments">
            <div class="loading-spinner"></div>
            <p>加载评论中...</p>
          </div>
          
          <div v-else-if="commentStore.commentList.list && commentStore.commentList.list.length === 0" class="no-comment">
            <i class="el-icon-comment-empty"></i>
            <p>还没有评论，快来抢沙发~</p>
          </div>
          
          <div v-else v-for="(comment, index) in commentStore.commentList.list" :key="comment.id || index" class="comment-item">
            <div class="comment-avatar">
              <el-avatar :src="comment.userAvatar" class="el-icon-user-circle"></el-avatar>
            </div>
            <div class="comment-content">
              <div class="comment-header">
                <span class="comment-author">{{ comment.userName }}</span>
                <span class="comment-time">{{ formatTime(comment.time) }}</span>
              </div>
              <p class="comment-text">{{ comment.content }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useDetailStore } from '../../store/detail';
import { useCommentStore } from '../../store/comment';
import { ElMessage } from 'element-plus';

const route = useRoute();
const router = useRouter();
const detailStore = useDetailStore();
const isLoading = ref(false); 
const commentStore = useCommentStore(); 
const commentContent = ref(''); 
const showComment = ref(true); 

// 新增：存储当前类型（tale/post）和ID
const currentType = ref('');
const currentId = ref('');

// 格式化时间
const formatTime = (time) => {
  const date = new Date(time);
  if (isNaN(date.getTime())) return '未知时间';
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// 分类映射（兼容故事和帖子的类型）
const getTypeName = (typeId) => {
  const typeMap = {
    1: '爱情', 2: '科幻', 3: '悬疑',
    4: '校园', 5: '职场', 6: '奇幻'
  };
  // 如果帖子类型是字符串（如之前的 'love'），可新增映射：
  // const strTypeMap = { 'love': '爱情', 'sci-fi': '科幻', 'mystery': '悬疑' };
  // return strTypeMap[typeId] || typeMap[typeId] || '未知分类';
  return typeMap[typeId] || '未知分类';
};

// 处理点赞点击
const handleLike = async () => {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    await detailStore.toggleLike();
    ElMessage.success(detailStore.isLiked ? '点赞成功' : '取消点赞成功');
  } catch (err) {
    ElMessage.error(err.message || '操作失败，请重试');
  } finally {
    isLoading.value = false;
  }
};

// 重试加载详情
const retryLoad = () => {
  detailStore.fetchDetail(currentType.value, currentId.value);
};

// 页面加载时初始化
onMounted(async () => {
  const { type, id } = route.params;
  // 校验路由参数
  if (!['tale', 'post'].includes(type) || !id) {
    ElMessage.error('参数错误，无法加载内容');
    router.back();
    return;
  }
  currentType.value = type;
  currentId.value = id;
  await detailStore.fetchDetail(type, id); 
});

// 页面离开时重置状态
onUnmounted(() => {
  detailStore.resetDetail();
  commentStore.commentList = { list: [], total: 0 }; // 重置评论列表
  commentContent.value = '';
});

// 监听路由参数变化，重新加载内容和评论
watch(() => [route.params.type, route.params.id], ([newType, newId]) => {
  if (!newType || !newId) return;
  currentType.value = newType;
  currentId.value = newId;
  // 重新加载详情
  detailStore.fetchDetail(newType, newId);
  // 重新加载对应类型的评论
  commentStore.fetchComments(newId, newType);
}, { immediate: true });

// 切换评论区显示/隐藏
const toggleComment = () => {
  showComment.value = !showComment.value;
  if (showComment.value && currentId.value && currentType.value) {
    commentStore.fetchComments(currentId.value, currentType.value);
  }
};

// 提交评论（关键修改：传递 type 参数）
const handleCommentSubmit = async () => {
  const content = commentContent.value.trim();
  if (!content || !currentId.value || !currentType.value) return;

  // 调用评论Store的submitComment，传入 ID + 类型 + 内容
  const success = await commentStore.submitComment(currentId.value, currentType.value, content);
  if (success) {
    ElMessage.success('评论发布成功');
    commentContent.value = '';
  } else {
    ElMessage.error(commentStore.error || '评论发布失败');
  }
};
</script>

<style scoped>
/* 全局容器 */
.detail-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding-bottom: 60px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* 导航栏样式 */
.detail-nav {
  padding: 16px 24px;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: #f0f7ff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #409eff;
  font-size: 14px;
  transition: all 0.2s ease;
}

.back-btn:hover {
  background-color: #e6f4ff;
  color: #3086e8;
}

/* 加载状态样式 */
.loading-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120px 0;
}

.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e6f4ff;
  border-top-color: #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  margin-top: 20px;
  color: #86909c;
  font-size: 16px;
}

/* 错误提示样式 */
.error-card {
  max-width: 800px;
  margin: 60px auto;
  padding: 48px 24px;
  background-color: #fff;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
}

.error-icon {
  font-size: 64px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.error-message {
  color: #4e5969;
  font-size: 18px;
  margin-bottom: 32px;
  line-height: 1.5;
}

.retry-btn {
  padding: 10px 32px;
  background-color: #409eff;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s ease;
}

.retry-btn:hover {
  background-color: #3086e8;
}

/* 内容卡片样式 */
.content-card {
  max-width: 860px;
  margin: 32px auto;
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* 标题区域样式 */
.title-section {
  padding: 40px 48px 0;
}

.main-title {
  font-size: 32px;
  font-weight: 700;
  color: #1d2129;
  line-height: 1.4;
  margin-bottom: 20px;
  letter-spacing: -0.5px;
}

.meta-info {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: #86909c;
  font-size: 14px;
  padding-bottom: 32px;
  border-bottom: 1px solid #f2f3f5;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.type-tag {
  background-color: #f0f7ff;
  color: #409eff;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

/* 内容区域样式 */
.content-section {
  padding: 0 48px 48px;
}

.content-html {
  color: #4e5969;
  font-size: 18px;
  line-height: 1.8;
}

.content-html p {
  margin-bottom: 24px;
  text-align: justify;
}

.content-html img {
  max-width: 100%;
  height: auto;
  margin: 24px auto;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  display: block;
}

.content-html h2,
.content-html h3 {
  color: #1d2129;
  margin: 40px 0 20px;
  font-weight: 600;
}

.content-html h2 {
  font-size: 24px;
}

.content-html h3 {
  font-size: 20px;
}

/* 互动区域样式 */
.interaction-bar {
  display: flex;
  gap: 16px;
  padding: 20px 48px;
  border-top: 1px solid #f2f3f5;
  background-color: #fafafa;
}

.like-button,
.comment-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 15px;
  border: none;
  outline: none;
  font-weight: 500;
}

.like-button {
  background-color: #f5f7fa;
  color: #4e5969;
}

.like-button:hover {
  background-color: #eef2f7;
  color: #409eff;
}

.like-button.liked {
  background-color: #e6f4ff;
  color: #409eff;
}

.like-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.comment-button {
  background-color: #fff;
  color: #4e5969;
  border: 1px solid #e5e6eb;
  margin-left: auto;
}

.comment-button:hover,
.comment-button.active {
  border-color: #409eff;
  color: #409eff;
  background-color: #f0f7ff;
}

.like-count,
.comment-count {
  min-width: 24px;
  text-align: center;
  font-size: 14px;
}

/* 评论区域样式 */
.comment-section {
  padding: 32px 48px;
  border-top: 1px solid #f2f3f5;
}

.comment-input-area {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
  align-items: flex-end; /* 新增：使按钮与输入框底部对齐 */
}

.comment-input {
  flex: 1;
  border-radius: 12px !important;
  border: 1px solid #e5e6eb !important;
  padding: 16px !important;
  font-size: 15px !important;
  resize: none;
}

.comment-input:focus {
  border-color: #409eff !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.1) !important;
}

/* 缩小发表评论按钮样式 */
.submit-comment-btn {
  padding: 8px 20px; /* 原：12px 24px */
  background-color: #409eff;
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px; /* 原：15px */
  font-weight: 500;
  transition: background-color 0.2s ease;
  white-space: nowrap;
  height: 40px; /* 新增：固定按钮高度 */
  line-height: 1; /* 新增：保证文字垂直居中 */
}

.submit-comment-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.submit-comment-btn:hover:not(:disabled) {
  background-color: #3086e8;
}

.comment-list {
  margin-top: 24px;
}

.comment-title {
  font-size: 18px;
  color: #1d2129;
  font-weight: 600;
  margin-bottom: 24px;
}

.comment-item {
  display: flex;
  gap: 16px;
  padding: 20px 0;
  border-bottom: 1px solid #f2f3f5;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #f0f7ff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.comment-avatar i {
  font-size: 20px;
  color: #409eff;
}

.comment-content {
  flex: 1;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.comment-author {
  font-size: 15px;
  color: #1d2129;
  font-weight: 500;
}

.comment-time {
  font-size: 13px;
  color: #86909c;
}

.comment-text {
  font-size: 15px;
  color: #4e5969;
  line-height: 1.6;
}

.no-comment {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #86909c;
  text-align: center;
}

.no-comment i {
  font-size: 48px;
  margin-bottom: 16px;
}

.no-comment p {
  font-size: 16px;
}

/* 动画效果 */
@keyframes spin {
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out forwards;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .detail-container {
    padding-bottom: 40px;
  }

  .detail-nav {
    padding: 12px 16px;
  }

  .content-card {
    margin: 16px;
    border-radius: 12px;
  }

  .title-section {
    padding: 24px 16px 0;
  }

  .main-title {
    font-size: 24px;
    margin-bottom: 16px;
  }

  .meta-info {
    gap: 12px;
    padding-bottom: 20px;
    font-size: 13px;
  }

  .cover-wrapper,
  .content-section,
  .interaction-bar,
  .comment-section {
    padding-left: 16px;
    padding-right: 16px;
  }

  .cover-wrapper {
    padding: 20px 16px;
  }

  .content-section {
    padding-bottom: 24px;
  }

  .content-html {
    font-size: 16px;
    line-height: 1.7;
  }

  .content-html p {
    margin-bottom: 20px;
  }

  .interaction-bar {
    padding: 16px;
  }

  .like-button,
  .comment-button {
    padding: 8px 16px;
    font-size: 14px;
  }

  .comment-section {
    padding: 24px 16px;
  }

  .comment-input-area {
    flex-direction: column;
    gap: 12px;
    align-items: stretch; /* 移动端恢复默认拉伸 */
  }

  /* 移动端按钮样式调整 */
  .submit-comment-btn {
    padding: 10px;
    width: 100%;
    height: auto;
    font-size: 15px;
  }

  .comment-item {
    padding: 16px 0;
  }
}

@media (max-width: 480px) {
  .type-tag {
    margin-top: 8px;
  }

  .comment-input {
    padding: 12px ;
    font-size: 14px ;
  }
}
</style>