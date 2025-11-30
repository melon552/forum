<template>
  <div class="dashboard">
    <!-- 基础统计卡片 -->
    <el-row :gutter="20" style="margin-bottom: 24px">
      <el-col :xs="12" :sm="6" v-for="(item, index) in baseStats" :key="index">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-value">{{ formatNumber(item.value) }}</div>
            <div class="stat-label">{{ item.label }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <!-- 热门分类占比（饼图） -->
      <el-col :xs="24" :md="14">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-title">内容类型占比</div>
          </template>
          <div ref="categoryChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 活跃用户 -->
      <el-col :xs="24" :md="10">
        <el-card class="chart-card">
          <template #header>
            <div class="chart-title">活跃用户 Top 10</div>
          </template>
          <el-table
            :data="activeUsers"
            size="small"
            style="width: 100%"
            :show-header="false"
          >
            <el-table-column width="40">
              <template #default="scope">
                <span class="rank" :class="{ 'top3': scope.$index < 3 }">{{ scope.$index + 1 }}</span>
              </template>
            </el-table-column>
            <el-table-column>
              <template #default="scope">
                <div class="user-info">
                  <el-avatar :src="scope.row.avatar || defaultAvatar" size="small" />
                  <span class="username">{{ scope.row.username }}</span>
                </div>
              </template>
            </el-table-column>
            <el-table-column align="right" width="80">
              <template #default="scope">
                <span class="activity-count">{{ scope.row.totalActive }}</span>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
import * as echarts from 'echarts';
import { getOperationalReport } from '../../api/index'; // 请确保该 API 已定义
// import defaultAvatar from '@/assets/default-avatar.png';

const baseStats = ref([]);
const hotCategories = ref([]); // 接收原始 [{type, count}]
const activeUsers = ref([]);

const categoryChartRef = ref(null);
let categoryChart = null;

// 格式化大数字
const formatNumber = (num) => {
  if (num >= 10000) return (num / 10000).toFixed(1) + 'w';
  return num.toLocaleString();
};

// 类型映射
const getCategoryName = (type) => {
  return type === 0 ? '帖子' : type === 1 ? '故事' : `未知(${type})`;
};

// 获取数据
const fetchData = async () => {
  try {
    const res = await getOperationalReport();
    if (res.data?.code === 200) {
      const data = res.data.data;

      // 基础统计
      baseStats.value = [
        { label: '用户总数', value: data.baseStats.userCount },
        { label: '内容总数', value: data.baseStats.contentCount },
        { label: '评论总数', value: data.baseStats.commentCount },
        { label: '总点赞数', value: data.baseStats.totalLike }
      ];

      // 热门分类（实际是类型分布）
      hotCategories.value = data.hotCategories; // [{type:0,count:16}, {type:1,count:10}]

      // 活跃用户（转数字）
      activeUsers.value = data.activeUsers.map(user => ({
        ...user,
        contentCount: parseInt(user.contentCount) || 0,
        commentCount: parseInt(user.commentCount) || 0,
        totalActive: parseInt(user.totalActive) || 0
      }));

      await nextTick();
      renderCategoryChart();
    }
  } catch (err) {
    console.error('获取运营数据失败:', err);
  }
};

// 渲染饼图：帖子 vs 故事 占比
const renderCategoryChart = () => {
  if (!categoryChartRef.value) return;

  if (categoryChart) {
    categoryChart.dispose();
  }

  // 构建饼图数据
  const pieData = hotCategories.value.map(item => ({
    name: getCategoryName(item.type),
    value: item.count
  }));

  // 如果只有一种类型，补全另一种为 0（避免图表异常）
  const hasPost = pieData.some(item => item.name === '帖子');
  const hasTale = pieData.some(item => item.name === '故事');

  if (!hasPost) pieData.push({ name: '帖子', value: 0 });
  if (!hasTale) pieData.push({ name: '故事', value: 0 });

  categoryChart = echarts.init(categoryChartRef.value);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: '0%',
      left: 'center'
    },
    series: [
      {
        name: '内容类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}\n{d}% ({c})'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '16',
            fontWeight: 'bold'
          }
        },
        data: pieData
      }
    ]
  };

  categoryChart.setOption(option);
  window.addEventListener('resize', () => categoryChart.resize());
};

onMounted(() => {
  fetchData();
});
</script>

<style scoped lang="scss">
.dashboard {
  padding: 20px;
}

.stat-card {
  text-align: center;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #606266;
}

.chart-card {
  height: 100%;
}

.chart-title {
  font-weight: 600;
  color: #303133;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rank {
  display: inline-block;
  width: 24px;
  height: 24px;
  line-height: 24px;
  text-align: center;
  background: #ebeef5;
  border-radius: 50%;
  font-size: 12px;
  color: #606266;
}

.rank.top3 {
  background: #f56565;
  color: white;
}

.username {
  font-size: 14px;
  color: #303133;
}

.activity-count {
  font-weight: bold;
  color: #409eff;
}
</style>