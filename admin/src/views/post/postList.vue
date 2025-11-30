<template>
  <div class="post-list-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">帖子管理</h1>
      <div class="filter-bar">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索标题/作者"
          style="width: 240px; margin-right: 10px"
          @keyup.enter="handleSearch"
        >
          <template #append>
            <el-button icon="search" @click="handleSearch" />
          </template>
        </el-input>
        <el-button type="primary" @click="handleSearch">查询</el-button>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑帖子"
      width="500px"
      @close="resetEditForm"
    >
      <el-form
        :model="editForm"
        :rules="editFormRules"
        ref="editFormRef"
        label-width="80px"
      >
        <el-form-item label="标题" prop="title">
          <el-input v-model="editForm.title" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="editForm.content"
            type="textarea"
            :rows="5"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="状态" prop="isPublish">
          <el-switch
            v-model="editForm.isPublish"
            :active-value="1"
            :inactive-value="0"
            active-text="已发布"
            inactive-text="草稿"
          />
        </el-form-item>
        <el-form-item label="封面" prop="cover">
          <el-upload
            :action="uploadUrl"
            :show-file-list="false"
            :data="{ userId: editForm.userId }"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            name="avatar"
            
            
          >
            <img v-if="editForm.cover" :src="editForm.cover"   style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;"/>
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditForm">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 帖子列表 -->
    <el-card class="post-card">
      <el-skeleton v-if="loading" :rows="8" animated />
      <el-empty v-else-if="postList.length === 0" description="暂无帖子数据" />

      <el-table
        v-else
        :data="postList"
        border
        stripe
        style="width: 100%"
        class="table"
      >
        <el-table-column prop="postId" label="帖子ID" width="80" />
        <el-table-column label="封面" width="100" >
          <template #default="scope">
            <el-avatar :src="scope.row.cover" :size="60" shape="squre" style="border-radius: 5px;"/>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" width="170" />
        <el-table-column prop="author" label="作者" width="120" />
        <el-table-column prop="content" label="内容摘要" width="250" >
          <template #default="scope">
            <el-tooltip :content="scope.row.content" placement="top">
              <span>{{ scope.row.content.substring(0, 30) }}...</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" >
          <template #default="scope">
            <el-tag :type="scope.row.isPublish === 1 ? 'success' : 'info'">
              {{ scope.row.isPublish === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="发布时间" width="180" >
          <template #default="scope">
            {{ formatDate(scope.row.time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="182" >
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              icon="edit"
              @click="handleEdit(scope.row)"
              style="margin-right: 5px"
            >编辑</el-button>
            <el-button
              type="danger"
              size="small"
              icon="delete"
              @click="handleDelete(scope.row)"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="pagination.total > 0"
        class="pagination"
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.limit"
        :page-sizes="[10, 20, 30]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, watch, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getPostList, updatePost, deletePost } from '../../api';

// 搜索 & 分页
const searchKeyword = ref('');
const pagination = ref({ page: 1, limit: 10, total: 0 });
const originalPostList = ref([]);
const loading = ref(false);
const postList = ref([]);

// 编辑弹窗
const editDialogVisible = ref(false);
const editFormRef = ref();
const editForm = reactive({
  postId: '',
  title: '',
  content: '',
  isPublish: 1,
  cover:''
});
const editFormRules = reactive({
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }],
  isPublish: [{ required: true, message: '请选择状态', trigger: 'change' }]
});

const uploadUrl = ref('/api/upload/avatar');
//上传成功
const handleAvatarSuccess = (response) => {
  if (response.code === 200) {
    editForm.cover = response.data.url; // 假设返回 { url: '...' }
  } else {
    ElMessage.error('上传失败');
  }
};
//上传前校验
const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;
  if (!isJPG) {
    ElMessage.error('头像必须是 JPG/PNG 格式!');
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB!');
  }
  return isJPG && isLt2M;
};

// 工具函数
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

// 获取帖子列表（仅当前页）
const fetchPostList = async () => {
  try {
    loading.value = true;
    const res = await getPostList({
      page: pagination.value.page,
      limit: pagination.value.limit,
      keyword: '' // 不传 keyword，前端搜索
    });
    if (res.data?.code === 200) {
      postList.value = res.data.data.list || [];
      originalPostList.value = [...postList.value];
      pagination.value.total = res.data.data.total || 0;
    } else {
      ElMessage.error('获取失败：' + res.data?.msg);
    }
  } catch (err) {
    ElMessage.error('网络错误');
  } finally {
    loading.value = false;
  }
};

// 前端搜索
const handleSearch = () => {
  const k = searchKeyword.value.trim().toLowerCase();
  postList.value = k
    ? originalPostList.value.filter(p =>
        p.title.toLowerCase().includes(k) ||
        p.author.toLowerCase().includes(k)
      )
    : [...originalPostList.value];
};

// 分页
const handleSizeChange = (val) => {
  pagination.value.limit = val;
  pagination.value.page = 1;
  fetchPostList();
};
const handleCurrentChange = (val) => {
  pagination.value.page = val;
  fetchPostList();
};

// 编辑
const handleEdit = (row) => {
  Object.assign(editForm, {
    postId: row.postId,
    title: row.title,
    content: row.content,
    isPublish: row.isPublish,
    cover:row.cover
  });
  editDialogVisible.value = true;
};

const resetEditForm = () => {
  if (editFormRef.value) editFormRef.value.resetFields();
  Object.assign(editForm, {
    postId: '',
    title: '',
    content: '',
    isPublish:1,
    cover:''
  });
};

const submitEditForm = async () => {
  try {
    await editFormRef.value.validate();
    const res = await updatePost(editForm.postId, {
      title: editForm.title,
      content: editForm.content,
      isPublish: editForm.isPublish,
      cover:editForm.cover
    });
    if (res.data?.code === 200) {
      ElMessage.success('更新成功');
      editDialogVisible.value = false;
      fetchPostList(); // 刷新当前页
    } else {
      ElMessage.error('更新失败：' + res.data?.msg);
    }
  } catch (err) {
    if (err.name !== 'ValidationError') {
      ElMessage.error('提交出错');
    }
  }
};

// 删除
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除帖子 "${row.title}"？`, '提示', { type: 'warning' });
    const res = await deletePost(row.postId);
    if (res.data?.code === 200) {
      ElMessage.success('删除成功');
      fetchPostList();
    } else {
      ElMessage.error('删除失败：' + res.data?.msg);
    }
  } catch (err) {
    if (err !== 'cancel') ElMessage.info('已取消');
  }
};

// 监听搜索
watch(searchKeyword, handleSearch);

// 初始化
onMounted(() => fetchPostList());
</script>

<style lang="sass" scoped>

$base-padding: 20px
$border-radius: 8px
$box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05)
$text-color-main: #333
$bg-color-main: #f5f7fa
$font-size-title: 20px
$small-padding: 10px
.post-list-page
  padding: 10px
  background-color: $bg-color-main
  min-height: 100vh
  margin-top:$small-padding
.page-header
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: $small-padding

.page-title
  font-size: $font-size-title
  font-weight: 600
  color: $text-color-main

.filter-bar
  display: flex
  align-items: center

.post-card
  border-radius: $border-radius
  box-shadow: $box-shadow

.table
  :deep(.el-table__header-cell),
  :deep(.el-table__cell)
    text-align: center
    vertical-align: middle

.pagination
  margin-top: $base-padding
  text-align: right

@media (max-width: 1200px)
  .page-header
    flex-direction: column
    align-items: flex-start
    gap: 10px
    .filter-bar
      flex-wrap: wrap
      gap: 10px

// 弹窗内表单优化
:deep(.el-dialog__body)
  padding: 20px

:deep(.el-form-item)
  margin-bottom: 15px
</style>