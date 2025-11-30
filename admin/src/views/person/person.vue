<template>
  <div class="admin-info-page">
    <el-card class="info-card" shadow="hover">
      <!-- 页面标题 -->
      <div class="page-title">
        <el-icon size="20"><UserFilled /></el-icon>
        <span>个人信息管理</span>
      </div>

      <!-- 信息表单 -->
      <el-form
        ref="infoFormRef"
        :model="infoForm"
        :rules="infoFormRules"
        label-width="100px"
        class="info-form"
      >
        <!-- 头像上传 -->
        <el-form-item label="头像">
          <div class="avatar-upload">
            <el-avatar :size="100" :src="infoForm.avatar" class="avatar-preview">
              <UserFilled v-if="!infoForm.avatar" />
            </el-avatar>
            <el-upload
              class="avatar-uploader"
              :action="uploadUrl"  
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              name="avatar"
              
            >
              <el-button size="small" type="primary" class="upload-btn">
                <el-icon><Upload /></el-icon>
                更换头像
              </el-button>
            </el-upload>
          </div>
        </el-form-item>

        <!-- 管理员ID（只读） -->
        <el-form-item label="管理员ID">
          <el-input v-model="infoForm.adminId" disabled />
        </el-form-item>

        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="infoForm.username" placeholder="请输入用户名" />
        </el-form-item>

        <!-- 邮箱 -->
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="infoForm.email" placeholder="请输入邮箱" />
        </el-form-item>

        <!-- 新增：性别选择 -->
        <el-form-item label="性别" prop="gender">
          <el-select v-model="infoForm.gender" placeholder="请选择性别">
            <el-option label="男" value="1" />
            <el-option label="女" value="0" />
          </el-select>
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item class="btn-group">
          <el-button type="primary" @click="submitInfoForm" :loading="submitLoading">
            保存修改
          </el-button>
          <el-button @click="resetInfoForm">重置</el-button>
          <el-button type="text" @click="$router.push('/changepassword')">
            <el-icon><Lock /></el-icon>
            修改密码
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
// 补充图标导入（避免图标丢失）
import { UserFilled, Upload, Lock } from '@element-plus/icons-vue';

import { getAdminInfo, updateAdminInfo } from '../../api/index'; // 引入后端接口

// 路由实例
const router = useRouter();
//上传头像地址
const uploadUrl = ref('/api/upload/avatar');
// 状态管理
const submitLoading = ref(false);
const infoFormRef = ref(null);
// 从本地存储获取管理员Token（登录时已存储）
const token = ref(localStorage.getItem('A_token') || '');

// 表单数据（新增gender字段，删除role相关）
const infoForm = reactive({
  adminId: '',
  username: '',
  email: '',
  avatar: '',
  gender: '', // 新增性别字段（1=男，0=女）
  createdAt: ''
});

// 表单校验规则（新增gender校验）
const infoFormRules = reactive({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  gender: [ // 新增性别校验
    { required: true, message: '请选择性别', trigger: 'change' }
  ]
});

// 初始化获取管理员信息
const initAdminInfo = async () => {
  try {
    const res = await getAdminInfo();
    if (res.data.code === 200) {
      Object.assign(infoForm, res.data.data);
      // 兼容性别字段类型（确保为字符串，匹配下拉框value）
      if (infoForm.gender !== undefined) {
        infoForm.gender = infoForm.gender.toString();
      }
    } else {
      ElMessage.error('获取个人信息失败：' + res.data.msg); // 修复res.msg为res.data.msg
    }
  } catch (err) {
    console.error('获取个人信息异常：', err);
    ElMessage.error('网络错误，无法获取个人信息');
  }
};

// 头像上传成功处理
const handleAvatarSuccess = (response) => {
  if (response.code === 200) {
    infoForm.avatar = response.data.url; // 适配后端返回的头像URL字段
    ElMessage.success('头像上传成功');
  } else {
    ElMessage.error('头像上传失败：' + response.msg);
  }
};

// 头像上传前校验
const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/');
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) {
    ElMessage.error('只能上传图片格式！');
    return false;
  }
  if (!isLt2M) {
    ElMessage.error('头像大小不能超过 2MB！');
    return false;
  }
  return true;
};

// 提交信息修改（新增gender字段传递）
const submitInfoForm = async () => {
  try {
    await infoFormRef.value.validate();
    submitLoading.value = true;

    const res = await updateAdminInfo({
      username: infoForm.username,
      email: infoForm.email,
      avatar: infoForm.avatar,
      gender: Number(infoForm.gender) // 转换为数字传递给后端
    });

    // 修复res.code判断（适配后端返回格式）
    const code = res.code || res.data.code;
    const msg = res.msg || res.data.msg;
    if (code === 200) {
      ElMessage.success('个人信息修改成功');
      // 刷新本地存储的管理员信息（如有）
      const adminInfo = JSON.parse(localStorage.getItem('adminInfo') || '{}');
      localStorage.setItem('adminInfo', JSON.stringify({ ...adminInfo, ...infoForm }));
    } else {
      ElMessage.error('修改失败：' + msg);
    }
  } catch (err) {
    if (err.name !== 'ValidationError') {
      console.error('修改信息异常：', err);
      ElMessage.error('网络错误，修改失败');
    }
  } finally {
    submitLoading.value = false;
  }
};

// 重置表单
const resetInfoForm = () => {
  if (infoFormRef.value) { // 增加判空，避免报错
    infoFormRef.value.resetFields();
    // 恢复原始数据
    initAdminInfo();
    ElMessage.info('表单已重置');
  }
};

// 页面加载时初始化
onMounted(() => {
  // 未登录跳转登录页
  if (!token.value) {
    ElMessage.warning('请先登录');
    router.push('/login');
    return;
  }
  initAdminInfo();
});
</script>

<style scoped lang="sass">
// 页面容器样式
.admin-info-page
  padding: 20px
  background-color: #f5f7fa
  min-height: calc(100vh - 60px)  // 适配顶部导航高度
  margin-top:10px
// 卡片样式
.info-card
  max-width: 800px
  margin: 0 auto
  padding: 20px
  border-radius: 12px
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05)

// 页面标题
.page-title
  display: flex
  align-items: center
  gap: 8px
  font-size: 18px
  font-weight: 600
  color: #1f2937
  margin-bottom: 24px
  padding-bottom: 12px
  border-bottom: 1px solid #e5e7eb

// 表单样式
.info-form
  padding-top: 10px

// 头像上传区域
.avatar-upload
  display: flex
  align-items: center
  gap: 20px

.avatar-preview
  border: 2px solid #e8f4ff
  cursor: pointer

.upload-btn
  margin-top: 10px

// 按钮组
.btn-group
  display: flex
  gap: 12px
  padding-left: 100px  // 对齐表单标签宽度
  margin-top: 20px

// 响应式适配
@media (max-width: 768px)
  .info-card
    max-width: 100%
    padding: 15px

  .avatar-upload
    flex-direction: column
    align-items: flex-start

  .btn-group
    padding-left: 0
    flex-wrap: wrap
</style>