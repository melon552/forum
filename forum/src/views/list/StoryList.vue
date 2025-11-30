<template>
  <div class="tale-list-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-button type="primary" @click="gotoCreate" class="create-btn" :icon="Plus">发布新故事</el-button>
      <div class="search-group">
        <el-input 
          v-model="searchKeyword" 
          class="search-input" 
          placeholder="请输入故事标题/内容搜索"
          clearable 
          @clear="clearSearch"
        >
          <template #prefix>
            <Search class="el-input__icon" />
          </template>
        </el-input>
        <el-button 
          type="primary" 
          @click="filterTales" 
          class="search-btn" 
          :icon="Search"
          :loading="searchLoading"
        >
          搜索
        </el-button>
      </div>
    </div>

    <!-- 故事列表 -->
    <div class="tale-list">
      <el-card 
        class="tale-item" 
        v-for="tale in taleList" 
        :key="tale.taleId"
        shadow="hover"
        :class="'tale-card'"
      >
        <!-- 列表内容不变，省略重复代码 -->
        <div class="tale-header">
          <el-avatar 
            :src="tale.cover" 
            :size="80" 
            shape="square" 
            fit="cover" 
            class="tale-cover" 
          />
          <div class="tale-meta">
            <div class="tale-title">{{ tale.title }}</div>
            <div class="tale-info">
              <span class="author">{{ tale.author }}</span>
              <span class="time">{{ formatTime(tale.time) }}</span>
              <el-tag 
                size="small" 
                :type="tale.type | tagTypeFilter" 
                class="type-tag"
              >{{ tale.type | typeFilter }}</el-tag>
            </div>
          </div>
        </div>
        <div class="tale-content">{{ tale.content }}</div>
        <div class="tale-footer">
          <div class="meta-group">
            <span class="meta-item">👁️ {{ tale.lookNumber }}</span>
            <span class="meta-item">❤️ {{ tale.goodNumber }}</span>
          </div>
          <div class="btn-group">
            <el-button type="link" @click="gotoDetail(tale)" class="detail-btn" :icon="View">查看详情</el-button>
            <!-- <el-button 
              type="link" 
              @click="gotoEdit(tale.taleId)" 
              class="edit-btn"
              :icon="Edit"
            >编辑</el-button>
            <el-button 
              type="link" 
              @click="handleDelete(tale.taleId)" 
              class="delete-btn"
              :icon="Delete"
            >删除</el-button> -->
            <el-button 
              type="link" 
              :icon="tale.isCollected ? StarFilled : Star" 
              :class="tale.isCollected ? 'collect-btn collected' : 'collect-btn'"
              @click="handleCollect(tale.taleId)"
            >{{ tale.isCollected ? '已收藏' : '收藏' }}
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 无搜索结果提示 -->
      <div v-if="taleList.length === 0 && !searchLoading" class="no-result">
        未找到匹配的故事 😕
      </div>
    </div>

    <!-- 分页组件（基于本地过滤后的数据分页） -->
    <div class="pagination" v-if="filteredTaleList.length > 0">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.page"
        :page-sizes="[5, 10, 20]"
        :page-size="pagination.limit"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredTaleList.length" 
        class="pagination-component"
      />
    </div>

    <!-- 删除确认弹窗（不变） -->
    <el-dialog
      title="确认删除"
      v-model="deleteDialogVisible"
      width="30%"
      :before-close="handleDialogClose"
    >
      <span>确定要删除这篇故事吗？删除后不可恢复！</span>
      <template #footer>
        <el-button @click="deleteDialogVisible = false" :icon="Close">取消</el-button>
        <el-button type="primary" @click="confirmDelete" :loading="deleteLoading" :icon="Delete">确认删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { getTaleList, deleteTale, collectTale, getUserInfo } from '../../api/index'; 
import { formatTime } from '../../utils/format';
import { Plus, Search, View, Edit, Delete, StarFilled, Star, Close } from '@element-plus/icons-vue';

const router = useRouter();
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0
});
const searchKeyword = ref('');
const searchLoading = ref(false);
const deleteDialogVisible = ref(false);
const deleteLoading = ref(false);
const currentDeleteId = ref('');
const currentUser = ref('');

// 新增：存储全部故事数据（缓存）
const allTaleList = ref([]);
// 新增：存储过滤后的故事数据（未分页）
const filteredTaleList = ref([]);
// 渲染用的故事列表（分页后）
const taleList = ref([]);

// 获取当前用户信息（不变）
const fetchCurrentUser = async () => {
  const res = await getUserInfo();
  currentUser.value = res.data.data;
};

// 第一步：加载全部故事数据（首次加载时执行）
const fetchAllTales = async () => {
  searchLoading.value = true;
  await fetchCurrentUser();
  try {
    // 关键点：不传递 page/limit，获取全部数据（需后端支持返回全部数据，或传递一个极大的 limit）
    const res = await getTaleList({ limit: 9999 }); // 假设 9999 足够容纳所有故事
    allTaleList.value = [...(res.data.data.list || [])].map(item => ({
      ...item,
      isCollected: item.whoCollection && item.whoCollection.includes(currentUser.value.userId)
    }));
    // 初始过滤（无关键词时显示全部）
    filterTales();
  } catch (err) {
    ElMessage.error('加载故事失败：' + err.message);
  } finally {
    searchLoading.value = false;
  }
};

// 第二步：根据关键词过滤本地数据
const filterTales = () => {
  const keyword = searchKeyword.value.trim().toLowerCase();
  if (!keyword) {
    // 无关键词：显示全部数据
    filteredTaleList.value = [...allTaleList.value];
  } else {
    // 有关键词：模糊匹配 标题/内容/作者
    filteredTaleList.value = allTaleList.value.filter(tale => {
      const titleMatch = tale.title.toLowerCase().includes(keyword);
      const contentMatch = tale.content.toLowerCase().includes(keyword);
      const authorMatch = tale.author.toLowerCase().includes(keyword);
      return titleMatch || contentMatch || authorMatch;
    });
  }
  // 过滤后重置分页到第1页
  pagination.value.page = 1;
  // 执行分页
  paginateTales();
};

// 第三步：对过滤后的数据进行本地分页
const paginateTales = () => {
  const { page, limit } = pagination.value;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  // 截取当前页数据
  taleList.value = filteredTaleList.value.slice(startIndex, endIndex);
};

// 分页大小改变（本地处理）
const handleSizeChange = (limit) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  paginateTales();
};

// 分页页码改变（本地处理）
const handleCurrentChange = (page) => {
  pagination.value.page = page;
  paginateTales();
};

// 清空搜索关键词
const clearSearch = () => {
  searchKeyword.value = '';
  filterTales();
};

// 监听关键词变化，实时过滤（无需防抖，本地过滤速度快）
watch(searchKeyword, filterTales);

// 其他方法（跳转、收藏、删除等，不变）
const gotoDetail = (tale) => {
  router.push({ name: 'Detail', params: { type: 'tale', id: tale.taleId } });
};
const gotoCreate = () => {
  router.push('/publishstory');
};
const gotoEdit = (taleId) => {
  router.push({ name: 'Edit', params: { type: 'tale', id: taleId } });
};
const handleCollect = async (taleId) => {
  try {
    const res = await collectTale(taleId);
    // 更新本地缓存的收藏状态
    const targetTale = allTaleList.value.find(item => item.taleId === taleId);
    if (targetTale) {
      targetTale.isCollected = res.data.data.isCollected;
      // 重新过滤和分页（保持搜索状态）
      filterTales();
    }
    ElMessage.success(res.data.data.isCollected ? '收藏成功' : '取消收藏成功');
  } catch (err) {
    ElMessage.error(err.message || '操作失败');
  }
};
const handleDelete = (taleId) => {
  currentDeleteId.value = taleId;
  deleteDialogVisible.value = true;
};
const handleDialogClose = () => {
  currentDeleteId.value = '';
  deleteLoading.value = false;
};
const confirmDelete = async () => {
  if (!currentDeleteId.value) return;
  deleteLoading.value = true;
  try {
    await deleteTale(currentDeleteId.value);
    // 删除本地缓存中的故事
    allTaleList.value = allTaleList.value.filter(item => item.taleId !== currentDeleteId.value);
    // 重新过滤和分页
    filterTales();
    ElMessage.success('删除成功');
    deleteDialogVisible.value = false;
  } catch (err) {
    ElMessage.error(err.message || '删除失败，请重试');
  } finally {
    deleteLoading.value = false;
    currentDeleteId.value = '';
  }
};

// 类型过滤器（不变）
const typeFilter = (type) => {
  const typeMap = { 'love': '爱情', 'sci-fi': '科幻', 'mystery': '悬疑' };
  return typeMap[type] || type;
};
const tagTypeFilter = (type) => {
  const typeMap = { 'love': 'danger', 'sci-fi': 'info', 'mystery': 'warning' };
  return typeMap[type] || 'info';
};

// 首次加载全部故事数据
onMounted(() => {
  fetchAllTales();
});
</script>



<style scoped>
/* 全局清新风格基础配置 */
:root {
  --primary-light: #e6f7f0; /* 浅绿主色调，清新感 */
  --primary: #40c9a2; /* 主色：柔和绿色 */
  --text-primary: #333;
  --text-secondary: #666;
  --border-light: #e5e7eb;
  --hover-light: #f3faf7;
}

.tale-list-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #fff; /* 白色背景更清新 */
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-light);
  border-bottom: 1px solid #eee;
}

/* 发布按钮样式 */
.create-btn {
  background: linear-gradient(90deg, #94e8d1 0%, #40c9a2 100%);
  border: 0;
  color: #fff;
  border-radius: 20px; /* 圆角更柔和 */
  padding: 8px 20px;
  transition: all 0.3s;
}

.create-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(64, 201, 162, 0.2);
  background: linear-gradient(90deg, #a8f0d9 0%, #48d1ab 100%);
}

/* 搜索区域样式 */
.search-group {
  display: flex;
  align-items: center;
}

.search-input {
  width: 300px;
  margin: 0 12px;
  border-radius: 20px; /* 搜索框圆角 */
  border: 1px solid var(--border-light);
  transition: border-color 0.3s;
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(64, 201, 162, 0.1);
}

.search-btn {
  background: linear-gradient(90deg, #94e8d1 0%, #40c9a2 100%);
  border: 0;
  color: #fff;
  border-radius: 20px;
  padding: 8px 20px;
  transition: all 0.3s;
}

.search-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(64, 201, 162, 0.2);
  background: linear-gradient(90deg, #a8f0d9 0%, #48d1ab 100%);
}

/* 故事列表样式 */
.tale-list {
  display: grid;
  gap: 24px;
}

.tale-card {
  border-radius: 10px; /* 大圆角更柔和 */
  overflow: hidden;
  border: 1px solid var(--border-light);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: #fff;
  box-shadow: 0 8px 8px rgba(0, 0.2, 0, 0.05);
}

.tale-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.05);
  border-color: var(--primary-light);
}

/* 故事封面样式 */
.tale-cover {
  border: 3px solid #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  transition: all 0.3s ease;
  overflow: hidden;
}

.tale-cover:hover {
  transform: scale(1.03);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

/* 故事元信息样式 */
.tale-header {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: var(--primary-light);
  gap: 16px;
  border-bottom: 1px solid #eee;
}

.tale-meta {
  flex: 1;
  margin-left: 12px;
}

.tale-title {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tale-info {
  display: flex;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 14px;
  flex-wrap: wrap;
}

.type-tag {
  margin-left: 8px;
  border-radius: 12px; /* 标签圆角 */
}

/* 故事内容样式 */
.tale-content {
  color: var(--text-primary);
  line-height: 1.7;
  margin: 0 16px 16px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2; /* 控制显示两行 */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 故事页脚样式 */
.tale-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
  background-color: #fff;
}

.meta-group {
  display: flex;
  gap: 16px;
  color: var(--text-secondary);
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
}

/* 按钮组样式 */
.btn-group {
  display: flex;
  gap: 12px;
}

.detail-btn {
  color: var(--primary);
  transition: color 0.3s;
}

.detail-btn:hover {
  color: #38b89c;
}

/* 收藏按钮样式 */
.collect-btn {
  color: var(--text-secondary);
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.collect-btn:hover {
  color: #30c27b;
}

.collect-btn.collected {
  color: #30c27b;
}

.collect-btn i {
  font-size: 16px;
}

/* 分页样式 */
.pagination {
  margin-top: 32px;
  text-align: center;
}

.pagination-component {
  --el-pagination-font-size: 14px;
  --el-pagination-button-size: 32px;
  --el-pagination-border-radius: 8px;
  --el-pagination-button-bg-color: var(--primary-light);
  --el-pagination-button-hover-bg-color: #d6f5e9;
  --el-pagination-button-active-bg-color: var(--primary);
  --el-pagination-button-active-color: #fff;
}

/* 无结果提示样式 */
.no-result {
  text-align: center;
  padding: 48px;
  color: var(--text-secondary);
  font-size: 16px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .search-input {
    width: 100%;
    margin: 0;
  }

  .tale-info {
    flex-direction: column;
    gap: 8px;
  }

  .btn-group {
    gap: 8px;
  }
}
</style>