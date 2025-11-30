<template>
  <div class="change-pwd-page">
    <el-card class="pwd-card" shadow="hover">
      <!-- 页面标题 -->
      <div class="page-title">
        <el-icon size="20"><Lock /></el-icon>
        <span>修改密码</span>
      </div>

      <!-- 密码修改表单 -->
      <el-form
        ref="pwdFormRef"
        :model="pwdForm"
        :rules="pwdFormRules"
        label-width="120px"
        class="pwd-form"
      >
        <!-- 原密码 -->
        <el-form-item label="原密码" prop="oldPassword">
          <el-input
            v-model="pwdForm.oldPassword"
            type="password"
            placeholder="请输入原密码"
            show-password
            @keyup.enter="submitPwdForm"
          />
        </el-form-item>

        <!-- 新密码 -->
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="pwdForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
            @keyup.enter="submitPwdForm"
          />
          <div class="pwd-tip">
            <el-icon size="14"><InfoFilled /></el-icon>
            <span>密码长度不少于6位，建议包含字母和数字</span>
          </div>
        </el-form-item>

        <!-- 确认新密码 -->
        <el-form-item label="确认新密码" prop="confirmPassword">
          <el-input
            v-model="pwdForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
            @keyup.enter="submitPwdForm"
          />
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item class="btn-group">
          <el-button type="primary" @click="submitPwdForm" :loading="submitLoading">
            确认修改
          </el-button>
          <el-button @click="resetPwdForm">重置</el-button>
          <el-button type="text" @click="$router.push('/person')">
            <el-icon><ArrowLeft /></el-icon>
            返回个人中心
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

// 引入修改密码接口
import { updateAdminPassword } from '../../api/index';

// 路由实例
const router = useRouter();
// 状态管理
const submitLoading = ref(false);
const pwdFormRef = ref(null);
// 从本地存储获取管理员Token
const token = ref(localStorage.getItem('A_token') || '');

// 表单数据
const pwdForm = reactive({
  oldPassword: '', // 原密码
  newPassword: '', // 新密码
  confirmPassword: '' // 确认新密码
});

// 表单校验规则
const pwdFormRules = reactive({
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '新密码长度不少于6位', trigger: 'blur' },
    // 可选：添加密码强度校验（字母+数字）
    { 
      pattern: /^(?=.*[a-zA-Z])(?=.*\d).+$/, 
      message: '密码需包含字母和数字', 
      trigger: 'blur' 
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      }, 
      trigger: 'blur' 
    }
  ]
});

// 提交密码修改
const submitPwdForm = async () => {
  try {
    // 表单校验
    await pwdFormRef.value.validate();
    submitLoading.value = true;

    // 调用修改密码接口
    const res = await updateAdminPassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.newPassword
    });

    // 适配后端返回格式
    const code = res.code || res.data.code;
    const msg = res.msg || res.data.msg;
    
    if (code === 200) {
      ElMessage.success('密码修改成功，请重新登录');
      // 清除本地Token，跳转登录页
      localStorage.removeItem('A_token');
      
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } else {
      ElMessage.error('修改失败：' + msg);
    }
  } catch (err) {
    if (err.name !== 'ValidationError') {
      console.error('修改密码异常：', err);
      ElMessage.error('网络错误，修改失败');
    }
  } finally {
    submitLoading.value = false;
  }
};

// 重置表单
const resetPwdForm = () => {
  if (pwdFormRef.value) {
    pwdFormRef.value.resetFields();
    ElMessage.info('表单已重置');
  }
};

// 页面加载时校验登录状态
onMounted(() => {
  if (!token.value) {
    ElMessage.warning('请先登录');
    router.push('/login');
    return;
  }
});
</script>

<style scoped lang="sass">
// 页面容器样式
.change-pwd-page
  padding: 20px
  background-color: #f5f7fa
  min-height: calc(100vh - 60px)  // 适配顶部导航高度
  margin-top:10px
// 卡片样式
.pwd-card
  max-width: 600px
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
.pwd-form
  padding-top: 10px

// 密码提示
.pwd-tip
  margin-top: 8px
  font-size: 12px
  color: #666
  display: flex
  align-items: center
  gap: 4px

  .el-icon
    color: #409eff

// 按钮组
.btn-group
  display: flex
  gap: 12px
  padding-left: 120px  // 对齐表单标签宽度
  margin-top: 20px

// 响应式适配
@media (max-width: 768px)
  .pwd-card
    max-width: 100%
    padding: 15px

  .btn-group
    padding-left: 0
    flex-wrap: wrap
</style>