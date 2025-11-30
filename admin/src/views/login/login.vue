<template>
  <div class="userLogin">
    <el-card class="loginCard">
      <h2 class="loginTitle">{{ isRegister ? '管理员注册' : '管理员登录' }}</h2>
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef" 
        label-width="80px"
        class="login-form"
      >
        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名"></el-input>
        </el-form-item>

        <!-- 邮箱（仅注册显示） -->
        <el-form-item v-if="isRegister" label="邮箱" prop="email">
          <el-input v-model="form.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>

        <!-- 密码 -->
        <el-form-item label="密码" prop="password">
          <el-input v-model="form.password" type="password" placeholder="请输入密码"></el-input>
        </el-form-item>

        <!-- 确认密码（仅注册显示） -->
        <el-form-item v-if="isRegister" label="确认密码" prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" placeholder="请确认密码"></el-input>
        </el-form-item>

        <!-- 记住我（仅登录显示） -->
        <el-form-item label=" " prop="remember" class="remember" v-if="!isRegister">
          <el-checkbox v-model="form.remember">记住我</el-checkbox>
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item class="btn-group">
          <el-button type="primary" @click="handleSubmit" class="login-btn" :loading="submitLoading">
            {{ isRegister ? '注册' : '登录' }}
          </el-button>
          <el-button type="text" @click="gotoOtherPage" class="switch-btn">
            {{ isRegister ? '已有账号，去登录' : '没有账号，去注册' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { adminRegister, adminLogin } from '../../api';
import { ElMessage } from 'element-plus';

// 路由实例化
const route = useRoute();
const router = useRouter();

// 表单引用
const formRef = ref(null);
// 提交加载状态
const submitLoading = ref(false);

// 表单数据（包含邮箱字段）
const form = ref({
  username: '',
  password: '',
  email: '', // 新增邮箱字段
  remember: false,
  confirmPassword: ''
});

// 区分登录/注册（响应式）
const isRegister = computed(() => route.meta?.type === 'register');

// 表单校验规则（动态适配登录/注册）
const rules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不少于 6 位', trigger: 'blur' }
  ],
  // 注册时校验邮箱
  email: isRegister.value
    ? [
        { required: true, message: '请输入邮箱', trigger: 'blur' },
        { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
      ]
    : [],
  // 注册时校验确认密码
  confirmPassword: isRegister.value
    ? [
        { required: true, message: '请确认密码', trigger: 'blur' },
        {
          validator: (rule, value, callback) => {
            if (!value) return callback(new Error('请确认密码'));
            if (value !== form.value.password) {
              callback(new Error('两次输入的密码不一致'));
            } else {
              callback();
            }
          },
          trigger: 'blur'
        }
      ]
    : [],
  remember: []
}));

// 提交注册/登录逻辑
const handleSubmit = async () => {
  // 1. 触发表单校验
  if (!formRef.value) return;
  try {
    await formRef.value.validate();
  } catch (err) {
    // 表单校验失败直接返回
    return ElMessage.warning('请完善表单信息');
  }

  // 2. 提交请求
  submitLoading.value = true;
  try {
    let res;
    if (isRegister.value) {
      // 注册逻辑：传递用户名、密码、邮箱
      res = await adminRegister({
        username: form.value.username,
        password: form.value.password,
        email: form.value.email
      });
      ElMessage.success('注册成功，请登录');
      router.push('/login');
    } else {
      // 登录逻辑
      res = await adminLogin({
        username: form.value.username,
        password: form.value.password
      });
      if (res.data?.code === 200) {
        // 存储Token和记住我状态
        localStorage.setItem('A_token', res.data.data.token);
        if (form.value.remember) {
          localStorage.setItem('admin_username', form.value.username);
        } else {
          localStorage.removeItem('admin_username');
        }
        ElMessage.success('登录成功');
        router.push('/home');
      } else {
        ElMessage.error(res.data?.msg || '登录失败');
      }
    }
  } catch (err) {
    // 错误处理：兼容不同的错误返回格式
    const errorMsg = err.response?.data?.msg || err.message || (isRegister.value ? '注册失败' : '登录失败');
    ElMessage.error(errorMsg);
  } finally {
    submitLoading.value = false;
  }
};

// 切换登录/注册页面
const gotoOtherPage = () => {
  router.push(isRegister.value ? '/login' : '/register');
};

// 页面初始化：如果记住我，填充用户名
const initForm = () => {
  const savedUsername = localStorage.getItem('admin_username');
  if (savedUsername) {
    form.value.username = savedUsername;
    form.value.remember = true;
  }
};
initForm();
</script>

<style scoped lang="sass">
.userLogin
  width: 100vw
  height: 100vh
  background: linear-gradient(135deg, #e8f4f8 0%, #f0f8fb 100%)
  display: flex
  justify-content: center
  align-items: center
  padding: 20px

.loginCard
  width: 100%
  max-width: 420px
  border-radius: 12px
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05)
  border: none
  padding: 32px 24px

.loginTitle
  text-align: center
  color: #42b983
  font-size: 24px
  font-weight: 600
  margin-bottom: 28px
  letter-spacing: 1px

.login-form
  .el-form-item
    margin-bottom: 20px

  .el-input__inner
    border-radius: 20px
    border-color: #e5e7eb
    transition: all 0.3s
    height: 44px

  .el-input__inner:focus
    border-color: #42b983
    box-shadow: 0 0 0 2px rgba(66, 185, 131, 0.1)

.btn-group
  display: flex
  justify-content: center
  gap: 20px
  margin-top: 16px

.login-btn
  background-color: #42b983
  border-color: #42b983
  border-radius: 20px
  padding: 8px 40px
  font-size: 16px

.login-btn:hover
  background-color: #34a06a
  border-color: #34a06a
  box-shadow: 0 4px 8px rgba(66, 185, 131, 0.2)

.switch-btn
  color: #42b983
  font-size: 14px

.switch-btn:hover
  color: #34a06a
  text-decoration: underline

.remember
  display: flex
  justify-content: flex-end
  .el-checkbox__label
    color: #666
    font-size: 14px

// 响应式调整
@media (max-width: 768px)
  .loginCard
    padding: 24px 16px

  .loginTitle
    font-size: 20px

  .btn-group
    flex-direction: column
    gap: 12px

  .login-btn
    width: 100%
</style>