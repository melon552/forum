<template>
  <div class="comment-manager">
    <!-- 顶部操作栏：仅保留搜索和批量删除 -->
    <div class="operation-bar">
      <!-- 关键词搜索（内容/用户） -->
      <el-input 
        v-model="searchKeyword" 
        placeholder="搜索评论内容或用户名" 
        clearable
        style="width: 300px"
        @keyup.enter="handleSearch"
      >
        <template #append>
          <el-button icon="Search" @click="handleSearch" />
        </template>
      </el-input>

      <!-- 批量操作 -->
      <el-button 
        type="danger" 
        @click="handleBatchDelete" 
        :disabled="selectedCommentIds.length === 0"
      >
        批量删除选中
      </el-button>
    </div>

    <!-- 评论列表表格 -->
    <el-table 
      :data="commentList" 
      border 
      stripe 
      @selection-change="handleSelectionChange"
      v-loading="loading"
      class="comment-table"
    >
      <!-- 复选框列 -->
      <el-table-column type="selection" width="50" align="center" />

      <!-- 序号列 -->
      <el-table-column type="index" label="序号" width="80" align="center" />

      <!-- 评论内容（支持预览长文本） -->
      <el-table-column 
        prop="content" 
        label="评论内容" 
        min-width="300"
        align="center"
      >
        <template #default="scope">
          <el-tooltip 
            :content="scope.row.content" 
            effect="dark" 
            placement="top-start"
            :disabled="scope.row.content.length < 20"
          >
            <div class="content-preview">
              {{ scope.row.content.length > 20 
                ? scope.row.content.slice(0, 20) + '...' 
                : scope.row.content 
              }}
            </div>
          </el-tooltip>
        </template>
      </el-table-column>

      <!-- 关联对象（帖子ID/故事ID） -->
      <el-table-column 
        label="关联内容" 
        min-width="200"
        align="center"
      >
        <template #default="scope">
          <!-- 根据postId是否存在判断是帖子/故事 -->
          <a 
            :href="scope.row.postId 
              ? `/admin/post/${scope.row.postId}` 
              : `/admin/tale/${scope.row.taleId}`" 
            target="_blank"
            class="custom-link"
          >
            {{ scope.row.postId ? `帖子ID: ${scope.row.postId}` : `故事ID: ${scope.row.taleId}` }}
          </a>
        </template>
      </el-table-column>

      <!-- 评论者信息 -->
      <el-table-column 
        label="评论者" 
        min-width="150"
        align="center"
      >
        <template #default="scope">
          <div class="user-info">
            <img 
              :src="scope.row.userAvatar" 
              alt="用户头像" 
              class="user-avatar"
              @error="handleImgError(scope.row)"
            >
            <span>{{ scope.row.userName }}</span>
          </div>
        </template>
      </el-table-column>

      <!-- 来源类型 -->
      <el-table-column 
        label="来源" 
        width="100"
        align="center"
      >
        <template #default="scope">
          <el-tag 
            :type="scope.row.postId ? 'primary' : 'success'"
          >
            {{ scope.row.postId ? '帖子' : '故事' }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 发布时间 -->
      <el-table-column 
        prop="time" 
        label="发布时间" 
        width="180"
        align="center"
      >
        <template #default="scope">
          {{ scope.row.time ? scope.row.time.replace('T', ' ').split('.')[0] : '未知时间' }}
        </template>
      </el-table-column>

      <!-- 操作列 -->
      <el-table-column 
        label="操作" 
        width="180"
        align="center"
      >
        <template #default="scope">
          <div class="operate-btn-group">
            <el-button 
              text 
              type="danger" 
              @click="handleDelete(scope.row.commentId)"
            >
              删除
            </el-button>
            <el-button 
              text 
              @click="handleViewDetail(scope.row)"
            >
              详情
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination 
      :current-page="pagination.currentPage"
      :page-size="pagination.pageSize"
      :total="pagination.total"
      :page-sizes="[10, 20, 50]"
      layout="total, sizes, prev, pager, next, jumper"
      @size-change="handlePageSizeChange"
      @current-change="handlePageChange"
      style="margin-top: 16px; text-align: right"
    />

    <!-- 详情弹窗 -->
    <el-dialog 
      title="评论详情" 
      v-model="detailVisible" 
      width="600px"
    >
      <div class="detail-content">
        <div class="detail-item">
          <span class="label">评论内容：</span>
          <p class="content-text">{{ currentComment?.content || '' }}</p>
        </div>
        <div class="detail-item">
          <span class="label">评论者：</span>
          <div class="user-info">
            <img 
              :src="currentComment?.userAvatar || defaultAvatar" 
              alt="用户头像" 
              class="user-avatar"
              @error="() => currentComment.userAvatar = defaultAvatar"
            >
            <span>{{ currentComment?.userName || '' }}</span>
          </div>
        </div>
        <div class="detail-item">
          <span class="label">关联内容：</span>
          <a 
            :href="currentComment?.postId 
              ? `/admin/post/${currentComment.postId}` 
              : `/admin/tale/${currentComment.textId}`" 
            target="_blank"
            class="custom-link"
          >
            {{ currentComment?.postId ? `帖子ID: ${currentComment.postId}` : `故事ID: ${currentComment.textId}` }}
          </a>
        </div>
        <div class="detail-item">
          <span class="label">发布时间：</span>
          <span>{{ currentComment?.time ? currentComment.time.replace('T', ' ').split('.')[0] : '未知时间' }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getAdminCommentList, deleteComment } from '../../api/index'; 

// 筛选条件（仅保留搜索关键词）
const searchKeyword = ref('');

// 表格数据
const commentList = ref([]);
const loading = ref(false);
const selectedCommentIds = ref([]); // 选中的评论ID

// 分页配置
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
});
const defaultAvatar = ref('https://picsum.photos/200'); 

// 处理头像加载失败
const handleImgError = (row) => {
  row.userAvatar = defaultAvatar.value; // 强制替换为默认头像，避免反复请求
};
// 详情弹窗
const detailVisible = ref(false);
const currentComment = ref(null);

// 加载评论列表（匹配后端返回格式）
const loadCommentList = async () => {
  loading.value = true;
  try {
    const params = {
      keyword: searchKeyword.value,
      page: pagination.currentPage,
      limit: pagination.pageSize // 后端接收的是limit，删除冗余的pageSize
    };
    const res = await getAdminCommentList(params);
    // 后端返回格式是res.data.list（不是res.data.data.list）
    commentList.value = res.data.data.list;
    pagination.total = res.data.data.total;
  } catch (err) {
    ElMessage.error('加载评论失败');
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 搜索
const handleSearch = () => {
  pagination.currentPage = 1;
  loadCommentList();
};

// 分页变化
const handlePageSizeChange = (size) => {
  pagination.pageSize = size;
  pagination.currentPage = 1;
  loadCommentList();
};

const handlePageChange = (page) => {
  pagination.currentPage = page;
  loadCommentList();
};

// 选中评论变化（匹配后端的commentId）
const handleSelectionChange = (selection) => {
  selectedCommentIds.value = selection.map(item => item.commentId);
};

// 单个删除（匹配后端路由）
const handleDelete = async (commentId) => {
  try {
    await ElMessageBox.confirm('确定要删除这条评论吗？', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    });
    
    await deleteComment(commentId); // 调用单个删除接口
    ElMessage.success('删除成功');
    loadCommentList();
  } catch (err) {
    if (err !== 'cancel') {
      ElMessage.error('删除失败：' + (err.response?.data?.msg || '网络错误'));
    }
  }
};

// 批量删除
const handleBatchDelete = async () => {
  if (selectedCommentIds.value.length === 0) return;

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的${selectedCommentIds.value.length}条评论吗？`, 
      '警告', 
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );

    // 循环调用单个删除接口（按顺序执行，避免并发压力）
    for (const id of selectedCommentIds.value) {
      await deleteComment(id); // 每次删除一个
    }

    ElMessage.success('批量删除成功');
    selectedCommentIds.value = []; // 清空选中
    loadCommentList(); // 刷新列表
  } catch (err) {
    if (err !== 'cancel') {
      // 显示具体错误信息（如某条删除失败）
      ElMessage.error('批量删除失败：' + (err.response?.data?.msg || err.message || '网络错误'));
    }
  }
};

// 查看详情
const handleViewDetail = (comment) => {
  currentComment.value = comment;
  detailVisible.value = true;
};

// 初始化加载
onMounted(() => {
  loadCommentList();
});
</script>

<style scoped lang="sass">
.operation-bar
  display: flex
  gap: 16px
  align-items: center
  margin-bottom: 16px
  flex-wrap: wrap
  margin-top: 10px

.comment-table
  // 表格单元格垂直居中（无需!important）
  .el-table__cell
    vertical-align: middle

.content-preview
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis
  // 内容水平居中
  text-align: center

.user-info
  display: flex
  align-items: center
  gap: 8px
  // 整体水平居中
  justify-content: center

  .user-avatar
    width: 24px
    height: 24px
    border-radius: 50%
    object-fit: cover
    border: 1px solid #eee

// 自定义a标签样式（去掉默认样式）
.custom-link
  // 去掉下划线
  text-decoration: none
  // 重置文字颜色（可自定义）
  color: #666
  // 可选：添加 hover 效果
  &:hover
    color: #165dff
    text-decoration: none

// 操作按钮组居中
.operate-btn-group
  display: flex
  justify-content: center
  gap: 8px

.detail-content
  padding: 10px 0

  .detail-item
    margin-bottom: 20px
    display: flex
    align-items: flex-start
    gap: 12px

    .label
      display: inline-block
      width: 80px
      font-weight: 500
      color: #666
      line-height: 24px
      // 固定标签位置，避免内容换行错位
      flex-shrink: 0

    /* 评论内容样式 */
    .content-text
      line-height: 24px
      color: #333
      padding: 8px 12px
      background-color: #fff
      border-radius: 4px
      border: 1px solid #eee
      flex: 1
      min-height: 60px

    /* 评论者信息 */
    .user-info
      display: flex
      align-items: center
      gap: 8px
      line-height: 24px

      .user-avatar
        width: 32px
        height: 32px
        border-radius: 50%
        object-fit: cover
        border: 1px solid #eee

      .username
        color: #333
        font-weight: 500
</style>