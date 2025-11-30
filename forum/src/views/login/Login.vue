<template>
  <div class="userLogin">
    <el-card class="loginCard">
      <!-- 标题：绿色文字，居中 -->
      <h2 class="loginTitle">{{ isRegister ? '用户注册' : '用户登录' }}</h2>
      <el-form 
        :model="form" 
        :rules="rules" 
        ref="formRef" 
        label-width="80px"
        class="login-form"
      >
        <!-- 用户名 -->
        <el-form-item label="用户名" prop="username" class="form-item">
          <span class="required-mark">*</span>
          <el-input 
            v-model="form.username" 
            placeholder="请输入用户名"
            class="form-input"
            :style="{ width: inputWidth }"
          ></el-input>
        </el-form-item>

        <!-- 密码 -->
        <el-form-item label="密码" prop="password" class="form-item">
          <span class="required-mark">*</span>
          <el-input 
            v-model="form.password" 
            type="password" 
            placeholder="请输入密码"
            class="form-input"
            :style="{ width: inputWidth }"  
          ></el-input>
        </el-form-item>

        <!-- 确认密码（仅注册） -->
        <el-form-item v-if="isRegister" label="确认密码" prop="confirmPassword" class="form-item">
          <span class="required-mark">*</span>
          <el-input 
            v-model="form.confirmPassword" 
            type="password" 
            placeholder="请确认密码"
            class="form-input"
            :style="{ width: inputWidth }" 
          ></el-input>
        </el-form-item>

        <!-- 记住我（仅登录） -->
        <el-form-item label=" " prop="remember" class="remember-item" v-if="!isRegister">
          <el-checkbox v-model="form.remember" class="remember-checkbox">记住我</el-checkbox>
        </el-form-item>

        <!-- 操作按钮 -->
        <el-form-item class="btn-group">
          <el-button 
            type="primary" 
            @click="handleSubmit" 
            class="login-btn"
            :loading="submitLoading"
          >
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
import { computed, ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { login, register } from '../../api/index';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();

// 区分登录/注册场景
const isRegister = computed(() => route.meta.type === 'register');
// 表单引用
const formRef = ref(null);
// 提交加载状态
const submitLoading = ref(false);
// 表单数据
const form = ref({
  username: '',
  password: '',
  remember: false,
  confirmPassword: ''
});
// 输入框宽度（可根据需求调整，示例为200px）
const inputWidth = ref('260px');

// 表单校验规则（动态适配）
const rules = computed(() => ({
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ],
  confirmPassword: isRegister.value 
    ? [
        { required: true, message: '请确认密码', trigger: 'blur' }, 
        { 
          validator: (rule, value, callback) => {
            if (value !== form.value.password) {
              callback(new Error('两次密码输入不一致'));
            } else {
              callback();
            }
          }, 
          trigger: 'blur' 
        }
      ] 
    : []
}));

// 提交逻辑
const handleSubmit = async () => {
  try {
    // 触发表单校验
    await formRef.value.validate();
    submitLoading.value = true;

    let res;
    if (isRegister.value) {
      res = await register(form.value);
      ElMessage.success('注册成功，请登录');
      router.push('/login');
    } else {
      res = await login(form.value);
      if (res.data.code === 200) {
        // 存储Token（根据实际需求调整）
        localStorage.setItem('A_token', res.data.data.token);
        ElMessage.success('登录成功');
        router.push('/');
      }
    }
  } catch (err) {
    ElMessage.error(err.response?.data?.msg || '操作失败');
  } finally {
    submitLoading.value = false;
  }
};

// 切换登录/注册页面
const gotoOtherPage = () => {
  router.push(isRegister.value ? '/login' : '/register');
};
</script>

<style scoped>
/* 页面整体样式：浅色背景+居中 */
.userLogin {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f0f8fb; /* 与示例图一致的浅蓝背景 */
  padding: 20px;
}

/* 登录卡片：白色背景+圆角 */
.loginCard {
  width: 100%;
  max-width: 400px; /* 缩小卡片宽度，适配输入框 */
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  padding: 32px 24px;
  border: none;
}

/* 标题样式：绿色文字+居中 */
.loginTitle {
  text-align: center;
  font-size: 24px;
  font-weight: 600;
  color: #42b983; /* 示例图中的绿色 */
  margin-bottom: 28px;
}

/* 表单整体样式 */
.login-form {
  width: 100%;
}

/* 表单项布局：标签+输入框对齐 */
.form-item {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}

/* 必选标记：红色星号 */
.required-mark {
  color: #f56c6c;
  margin-right: 4px;
}

/* 输入框样式：红色边框（未填时）+圆角 */
.form-input {
  border-radius: 4px;
  width: 300px;
  border: 1px solid #f56c6c; /* 示例图中的红色边框 */
  --el-input-focus-border-color: #f56c6c;
}

/* 记住我选项布局 */
.remember-item {
  display: flex;
  justify-content: flex-start;
  margin-left: 10px;
  margin-bottom: 16px;
  
}
.remember-checkbox {
  font-size: 14px;
  color: #666;
}

/* 按钮组布局 */
.btn-group {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 8px;
}

/* 登录/注册按钮样式：绿色背景 */
.login-btn {
  background-color: #42b983;
  border-color: #42b983;
  border-radius: 4px;
  padding: 8px 32px;
  --el-button-hover-bg-color: #34a06a;
  --el-button-hover-border-color: #34a06a;
}

/* 切换按钮样式：绿色文字 */
.switch-btn {
  color: #42b983;
  font-size: 14px;
  padding: 0;
}
.switch-btn:hover {
  color: #34a06a;
  text-decoration: underline;
}

/* 表单校验提示样式：红色文字（与示例图一致） */
:deep(.el-form-item__error) {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
  margin-left: 84px; /* 对齐标签宽度 */
}
</style>