<template>
  <div class="profile-container">
    <div class="profile-card">
      <h2 class="profile-title">个人信息</h2>
      
      <!-- 加载状态 -->
      <div v-if="loading" class="loading-state">加载中...</div>
      
      <!-- 错误提示 -->
      <div v-if="error" class="error-state">{{ error }}</div>
      
      <!-- 表单（加载成功后显示） -->
      <el-form 
        v-if="!loading && !error" 
        :model="userInfo" 
        label-width="100px"
        :rules="rules"
        ref="formRef"
        class="profile-form"
      >
        <el-form-item label="*用户名" prop="username">
          <el-input v-model="userInfo.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="userInfo.gender" placeholder="请选择">
            <el-option label="保密" value="2" />
            <el-option label="男" value="0" />
            <el-option label="女" value="1" />
          </el-select>
        </el-form-item>
        <el-form-item label="个人介绍" prop="introduction">
          <el-input
            v-model="userInfo.introduction"
            type="textarea"
            :rows="4"
            placeholder="请输入个人介绍"
          />
        </el-form-item>
        <el-form-item label="头像" prop="avatar">
          <div class="avatar-group">
            <el-avatar 
              :size="120" 
              :src="userStore.info.avatar || defaultAvatar" 
              class="user-avatar"
            />
            <el-upload
              class="avatar-uploader"
              action="/api/upload/avatar"  
              :show-file-list="false"
              :on-success="handleAvatarSuccess"
              :before-upload="beforeAvatarUpload"
              :headers="{ Authorization: 'Bearer ' + userStore.token }"  
              name="avatar"
            >
              <el-button size="small" type="primary">更换头像</el-button>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item>
          <el-button 
            type="primary" 
            @click="updateProfile"
            class="update-btn"
          >
            点击更新
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { ElMessage } from 'element-plus';
import { updateUserInfo } from '../../api/index'; // 只导入更新接口
import { useUserStore } from '../../store/user';


const userStore = useUserStore();


// 表单数据（从 Pinia 初始化）
const userInfo = ref({
  username: '',
  gender: '1',
  introduction: '',
  avatar: ''
});

// 状态管理
const loading = ref(true);
const error = ref(null);
const formRef = ref(null);

// 表单验证规则
const rules = reactive({
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }]
});

// 初始化：使用 Pinia 的 fetchUserInfo 获取用户信息
const initUserInfo = async () => {
  try {
    loading.value = true;
    await userStore.fetchUserInfo(); // 调用 Pinia 的方法
    // 同步 Pinia 数据到表单
    userInfo.value = {
      username: userStore.info.username,
      gender: userStore.info.gender?.toString() || '1', // 适配下拉框的字符串值
      introduction: userStore.info.introduction || '',
      avatar: userStore.info.avatar || ''
    };
  } catch (err) {
    error.value = err.message || '获取用户信息失败';
  } finally {
    loading.value = false;
  }
};

// 上传头像成功回调
const handleAvatarSuccess = (response) => {
  if (response.code === 200) {
    const newAvatar = response.data.url;
    userStore.info.avatar = newAvatar; // 同步到 Pinia
    userInfo.value.avatar = newAvatar; // 同步到表单
    ElMessage.success('头像上传成功');
  } else {
    ElMessage.error(response.message || '头像上传失败');
  }
};

// 上传头像前校验
const beforeAvatarUpload = (file) => {
  const isImage = file.type.indexOf('image/') === 0;
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isImage) ElMessage.error('请上传图片格式文件');
  if (!isLt2M) ElMessage.error('上传头像图片大小不能超过 2MB');
  return isImage && isLt2M;
};

// 更新个人信息
const updateProfile = async () => {
  await formRef.value.validate();
  try {
    const submitData = {
      username: userInfo.value.username,
      gender: parseInt(userInfo.value.gender),
      introduction: userInfo.value.introduction,
      avatar: userStore.info.avatar // 使用 Pinia 中的最新头像路径
    };
    await updateUserInfo(submitData);
    ElMessage.success('个人信息更新成功');
    // 更新后重新拉取最新数据，确保同步
    await userStore.fetchUserInfo();
  } catch (err) {
    ElMessage.error(err.message || '更新失败');
  }
};

// 组件挂载时初始化
onMounted(() => {
  initUserInfo();
});
</script>

<style scoped>
.profile-container {
  display: flex;
  justify-content: center;
  padding: 40px 0;
  background-color: #f9fafc;
  min-height: calc(100vh - 60px);
}

.profile-card {
  width: 600px;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  padding: 30px;
}

.profile-title {
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

.profile-form {
  margin-top: 20px;
}

.avatar-group {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 10px;
}

.user-avatar {
  border: 2px solid #eee;
  transition: all 0.3s;
}
.user-avatar:hover {
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.1);
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s;
}
.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.update-btn {
  width: 120px;
}

.loading-state, .error-state {
  text-align: center;
  padding: 40px 0;
  color: #666;
}
.error-state {
  color: #f56c6c;
}
</style>