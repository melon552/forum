<template>
  <div class="recommend-container">
    <!-- 标签切换（热门/最新） -->
    <el-tabs v-model="activeType" class="recommend-tabs" @tab-change="handleTabChange">
      <el-tab-pane label="热门推荐" name="hot" />
      <el-tab-pane label="最新发布" name="new" />
    </el-tabs>

    <!-- 内容列表 -->
    <div class="content-list">
      <el-card 
        class="content-item" 
        v-for="item in recList" 
        :key="`${activeType}_${item.id}`"
      >
        <div class="content-header">
          <el-avatar :src="item.author.avatar" :size="48" class="author-avatar" />
          <div class="author-info">
            <div class="username">{{ item.author.username }}</div>
            <div class="create-time">{{ formatTime(item.time) }}</div>
          </div>
          <div class="content-tag">
            <el-tag size="small" :type="item.type === 0 ? 'primary' : 'success'">
              {{ item.type === 0 ? '帖子' : '故事' }}
            </el-tag>
          </div>
        </div>

        <div class="content-body">
          <h3 class="content-title">{{ item.title }}</h3>
          <p class="content-summary">{{ item.content || '暂无摘要' }}</p>
        </div>

        <div class="content-footer">
          <div class="content-meta">
            <span class="meta-item">👁️ {{ formatNumber(item.lookNumber) }}</span>
            <span class="meta-item">❤️ {{ formatNumber(item.goodNumber) }}</span>
          </div>
          <el-button plain  type="text" @click="gotoDetail(item)">查看详情</el-button>
        </div>
      </el-card>
    </div>

    <!-- 分页组件 -->
    <div class="pagination">
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="pagination.page"
        :page-sizes="[5, 10, 20]"
        :page-size="pagination.limit"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
      />
    </div>

    <!-- 加载中状态 -->
    <!-- <el-loading v-if="loading" target=".recommend-container" text="加载中..." /> -->
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { recommendList } from '../../api';
import { formatTime, formatNumber } from '../../utils/format';
import { useDetailStore } from '../../store/detail';
const detailStore=useDetailStore()
const router = useRouter();
const recList = ref([]);
const activeType = ref('hot');
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPage: 0
});
const loading = ref(false);

const handleTabChange = (type) => {
  activeType.value = type;
  pagination.value.page = 1;
  recList.value = []; // 切换前清空列表
  loadRecommendContent();
};

const handleSizeChange = (limit) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  loadRecommendContent();
};

const handleCurrentChange = (page) => {
  pagination.value.page = page; // 切换到第2页时，page=2
  loadRecommendContent();
};

const gotoDetail = (item) => {
  
  const type = item.type === 0 ? 'post' : 'tale';
  // 2. 跳转通用详情页，通过 params 传递 type 和 id（与路由配置匹配）
  router.push({
    path: `/detail/${type}/${item.id}`, // 动态路由路径：/detail/post/123 或 /detail/tale/456
    // 或用 name 跳转（需路由配置 name）：
    // name: 'Detail',
    // params: { type, id: item.id }
  });
};

const loadRecommendContent = async () => {
  console.log('请求参数：', { 
    type: activeType.value, 
    page: pagination.value.page, 
    limit: pagination.value.limit 
  });
  const res = await recommendList({
    type: activeType.value, // 传递当前类型（hot或new）
    page: pagination.value.page,
    limit: pagination.value.limit,
  });
  recList.value = [...res.data.data.list];
  pagination.value.total = res.data.data.pagination.total;
};

onMounted(() => {
  activeType.value = 'hot'; 
  loadRecommendContent();
});
</script>

<style scoped>

.recommend-container {
  padding: 20px;
}

.recommend-tabs {
  margin-bottom: 20px;
}

.content-list {
  display: grid;
  gap: 16px;
}

.content-item {
  transition: box-shadow 0.3s ease;
}

.content-item:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.content-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f5;
}

.author-avatar {
  margin-right: 12px;
}

.author-info {
  flex: 1;
}

.username {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.create-time {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.content-tag {
  margin-left: auto;
}

.content-body {
  margin-bottom: 12px;
}

.content-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.content-summary {
  color: var(--text-primary);
  line-height: 1.7;
  margin: 0 16px 16px;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1; /* 控制显示两行 */
  overflow: hidden;
  text-overflow: ellipsis;
}

.content-footer {
  display: flex;
  align-items: center;
  font-size: 12px;
  color: #999;
}
/* .checkdetail{
  color: #05c46b;
  border: 0px;
} */
.meta-item {
  margin-right: 16px;
}

.pagination {
  margin-top: 24px;
  text-align: center;
}
</style>