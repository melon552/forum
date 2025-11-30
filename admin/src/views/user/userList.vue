<template>
  <div class="user-list-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <h1 class="page-title">用户管理</h1>
      <div class="filter-bar">
        <!-- 搜索框 -->
        <el-input
          v-model="searchKeyword"
          placeholder="搜索用户名/邮箱"
          style="width: 240px; margin-right: 10px"
          @keyup.enter="fetchUserList"
        >
          <template #append>
            <el-button icon="search" @click="fetchUserList" />
          </template>
        </el-input>

        <el-button type="primary" @click="fetchUserList">查询</el-button>
      </div>
    </div>

    <!-- 编辑弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑用户信息"
      width="500px"
      @close="resetEditForm"
    >
      <el-form
        :model="editForm"
        :rules="editFormRules"
        ref="editFormRef"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="editForm.username"  />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="editForm.email" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="editForm.gender">
            <el-option label="男" value="1" />
            <el-option label="女" value="0" />
          </el-select>
        </el-form-item>
        <el-form-item label="头像" prop="avatar">
          <el-upload
            :action="uploadUrl"
            :show-file-list="false"
            :data="{ userId: editForm.userId }"
            :on-success="handleAvatarSuccess"
            :before-upload="beforeAvatarUpload"
            name="avatar"
            v-model="editForm.avatar"
            
          >
            <img v-if="editForm.avatar" :src="editForm.avatar" class="avatar"  style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover;"/>
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitEditForm">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 用户列表 -->
    <el-card class="user-card">
      <!-- 加载状态 -->
      <el-skeleton v-if="loading" :rows="8" animated />

      <!-- 空数据状态 -->
      <el-empty v-else-if="userList.length === 0" description="暂无用户数据" />

      <!-- 表格 - 添加确保整体居中，保留class便于样式控制 -->
      <el-table
        v-else
        :data="userList"
        border
        stripe
        hover
        style="width: 100%"
        class="table"
        
      >
        <el-table-column prop="userId" label="用户ID" width="80"  />
        <el-table-column label="头像" width="80" >
          <template #default="scope">
            <el-avatar :src="scope.row.avatar" :size="50" />
          </template>
        </el-table-column>
        <el-table-column prop="username" label="用户名" width="100"  />
        <el-table-column prop="email" label="邮箱" width="180"  />
        <el-table-column prop="gender" label="性别" width="80" >
          <template #default="scope">
            <el-tag :type="scope.row.gender === 1 ? 'primary' : 'success'">
              {{ scope.row.gender === 1 ? '男' : '女' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="vip" label="VIP状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.vip === 1 ? 'warning' : 'default'">
              {{ scope.row.vip === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column> 
        <el-table-column prop="postNum" label="发帖数" width="100"  />
        <el-table-column prop="taleNum" label="发故事数" width="100"  />
        <el-table-column prop="jionTime" label="注册时间" width="180" >
          <template #default="scope">
            {{ formatDate(scope.row.jionTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="162" >
          <template #default="scope">
            <el-button
              type="primary"
              icon="edit"
              size="small"
              @click="handleEdit(scope.row)"
            >编辑</el-button>
            <el-button
              type="danger"
              icon="delete"
              size="small"
              @click="handleDelete(scope.row)"
              style="margin-left: 5px"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
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
import { ref, onMounted, nextTick, reactive, watch } from 'vue';
import { ElMessage, ElMessageBox, ElForm } from 'element-plus';
// 引入已定义的接口
import { getUserInfo, updateUser, deleteUser } from '../../api';

// 查询参数
const searchKeyword = ref('');
const originalUserList=ref('')
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0
});
const uploadUrl = ref('/api/upload/avatar');
//上传成功
const handleAvatarSuccess = (response) => {
  if (response.code === 200) {
    editForm.avatar = response.data.url; // 假设返回 { url: '...' }
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
// 数据状态
const loading = ref(false);
const userList = ref([]);

// 编辑弹窗相关
const editDialogVisible = ref(false);
const editFormRef = ref();
const editForm = reactive({
  userId: '',
  username: '',
  email: '',
  gender: '',
  role: '',
  vip: '',
  level: ''
});

// 编辑表单校验规则 - 适配当前保留的字段（移除vip/level校验）
const editFormRules = reactive({
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  
});

// 格式化日期（适配接口返回的ISO时间）
const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// 获取用户列表
const fetchUserList = async () => {
  try {
    loading.value = true;
    // 拼接查询参数
    const params = {
      page: pagination.value.page,
      limit: pagination.value.limit,
      keyword: searchKeyword.value.trim(),
      
    };

    // 调用已定义的getUserInfo接口
    const res = await getUserInfo(params);
    if (res.data.code === 200) {
      userList.value = res.data.data.list || [];
      originalUserList.value = [...userList.value];
      pagination.value.total = res.data.data.total || 0;
      console.log('用户列表数据:', userList.value);
    } else {
      ElMessage.error('获取用户列表失败：' + res.msg);
    }
  } catch (err) {
    console.error('请求用户列表失败:', err);
    ElMessage.error('网络错误，无法获取用户数据');
  } finally {
    loading.value = false;
  }
};

// 每页条数改变时
const handleSizeChange = (newSize) => {
  pagination.value.limit = newSize; // 更新每页数量
  pagination.value.page = 1;        // 切换分页大小时，重置到第一页
  fetchUserList();                  // 重新请求数据
};

// 当前页码改变时
const handleCurrentChange = (newPage) => {
  pagination.value.page = newPage;
  fetchUserList();
};

// 重置编辑表单
const resetEditForm = () => {
  if (editFormRef.value) {
    editFormRef.value.resetFields();
  }
  Object.assign(editForm, {
    userId: '',
    username: '',
    email: '',
    gender: '',
    role: '',
    vip: '',
    level: ''
  });
};

// 处理编辑用户
const handleEdit = (row) => {
  // 填充编辑表单（适配当前保留的字段）
  Object.assign(editForm, {
    userId: row.userId , // 兼容userId/userId字段名
    username: row.username,
    email: row.email,
    gender: row.gender.toString(),
    role: (row.role || '0').toString(), // 兜底默认值
    vip: '',
    avatar: row.avatar
  });
  // 打开编辑弹窗
  editDialogVisible.value = true;
};

// 提交编辑表单
const submitEditForm = async () => {
  try {
    // 表单校验
    await editFormRef.value.validate();
    console.log('editForm.userId:', editForm.userId);
    console.log('typeof editForm.userId:', typeof editForm.userId);
    // 调用更新接口（适配当前保留的字段）
    const res = await updateUser(editForm.userId,{
      userId: editForm.userId,
      email: editForm.email,
      gender: Number(editForm.gender),
      avatar: editForm.avatar
    });
    
    if (res.data.code === 200) {
      ElMessage.success('用户信息修改成功');
      editDialogVisible.value = false;
      fetchUserList(); // 重新加载列表
    } else {
      ElMessage.error('修改失败：' + res.msg);
    }
  } catch (err) {
    if (err.name !== 'ValidationError') {
      console.error('修改用户信息失败:', err);
      ElMessage.error('网络错误，修改失败');
    }
  }
};

// 处理删除用户
const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm(
      '此操作将永久删除该用户，是否继续？',
      '提示',
      {
        type: 'warning'
      }
    );
    // 调用删除接口（兼容userId/userId字段名）
    const res = await deleteUser(row.userId );
    if (res.data.code === 200) {
      ElMessage.success('删除用户成功');
      fetchUserList(); // 重新加载列表
    } else {
      ElMessage.error('删除失败：' + res.msg);
    }
  } catch (err) {
    if (err !== 'cancel') {
      console.error('删除用户失败:', err);
      ElMessage.error('网络错误，删除失败');
    } else {
      ElMessage.info('已取消删除');
    }
  }
};
watch(searchKeyword,(newVal)=>{
  const keyword=newVal.trim().toLowerCase();
  if (!keyword) {
    // 无关键词，显示原始数据
    userList.value = [...originalUserList.value];
  } else {
    // 在当前页数据中过滤
    userList.value = originalUserList.value.filter(user =>
      user.username.toLowerCase().includes(keyword) ||
      user.email.toLowerCase().includes(keyword)
    );
  }
})
// 页面加载时获取用户列表
onMounted(() => {
  nextTick(() => {
    fetchUserList();
  });
});
</script>

<style lang="sass" scoped>
// 全局变量定义（统一维护样式参数）
$base-padding: 20px
$small-padding: 10px
$border-radius: 8px
$box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05)
$text-color-main: #333
$bg-color-main: #f5f7fa
$font-size-title: 20px
$breakpoint-medium: 1200px

// 页面容器样式
.user-list-page
  padding: $base-padding
  margin-top: $small-padding
  background-color: $bg-color-main
  min-height: 100vh

  // 页面头部
  .page-header
    display: flex
    justify-content: space-between
    align-items: center
    margin-bottom: $base-padding

    // 标题样式
    .page-title
      font-size: $font-size-title
      font-weight: 600
      color: $text-color-main
      margin: 0

    // 筛选栏样式
    .filter-bar
      display: flex
      align-items: center

  // 卡片容器样式
  .user-card
    border-radius: $border-radius
    box-shadow: $box-shadow
  
  // 表格样式 - 强制居中（兜底保障）
  :deep(.table)
    // 表头单元格居中
    .el-table__header-cell
      text-align: center 
      vertical-align: middle 
    
    // 内容单元格居中
    .el-table__cell
      text-align: center 
      vertical-align: middle 
    
    // 头像和按钮垂直居中优化
    .el-avatar
      display: inline-flex
      align-items: center
      justify-content: center
    
    .el-button
      display: inline-flex
      align-items: center
      justify-content: center

  // 分页样式
  .pagination
    margin-top: $base-padding
    text-align: right

// 响应式适配
@media (max-width: $breakpoint-medium)
  .page-header
    flex-direction: column
    align-items: flex-start
    gap: $small-padding

    .filter-bar
      flex-wrap: wrap
      gap: $small-padding
//upload样式
.avatar-uploader
  .el-upload
    border: 1px dashed var(--el-border-color)
    border-radius: 6px
    cursor: pointer
    position: relative
    overflow: hidden
    transition: var(--el-transition-duration-fast)

  .el-upload:hover
    border-color: var(--el-color-primary)

  .avatar-uploader-icon
    font-size: 28px
    color: #8c939d
    width: 100px
    height: 100px
    text-align: center

  .avatar
    width: 100px
    height: 100px
    display: block
// 编辑弹窗样式优化
:deep(.el-dialog__body)
  padding: 20px

:deep(.el-form-item)
  margin-bottom: 15px
</style>