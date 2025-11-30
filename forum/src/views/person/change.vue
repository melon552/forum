<template>
  <div class="password-reset-container">
    

    <!-- 右侧表单区域 -->
    <div class="form-section">
      <div class="form-card">
        <div class="form-header">
          <h2 class="form-title">修改密码</h2>
          <p class="form-subtitle">请设置新密码以保障账户安全</p>
        </div>

        <el-form 
          ref="passwordForm" 
          :model="form" 
          :rules="rules" 
          class="password-form"
          label-position="top"
        >
          <!-- 原密码 -->
          <el-form-item label="原密码" prop="oldPassword">
            <el-input 
              v-model="form.oldPassword" 
              type="password" 
              placeholder="请输入原密码"
              :prefix-icon="Lock"
              @input="checkPasswordStrength"
            />
          </el-form-item>

          <!-- 新密码 -->
          <el-form-item label="新密码" prop="newPassword">
            <el-input 
              v-model="form.newPassword" 
              type="password" 
              placeholder="请输入新密码（至少8位，包含字母和数字）"
              :prefix-icon="Key"
              @input="checkPasswordStrength"
            />
            
            <!-- 密码强度指示器 -->
            <div class="password-strength" v-if="form.newPassword">
              <div class="strength-labels">
                <span>弱</span>
                <span>中</span>
                <span>强</span>
              </div>
              <div class="strength-bar">
                <div 
                  class="strength-indicator"
                  :class="strengthClass"
                  :style="{ width: strengthWidth }"
                ></div>
              </div>
            </div>
          </el-form-item>

          <!-- 确认新密码 -->
          <el-form-item label="确认新密码" prop="confirmPassword">
            <el-input 
              v-model="form.confirmPassword" 
              type="password" 
              placeholder="请再次输入新密码"
              :prefix-icon="Check"
            />
          </el-form-item>

          <!-- 提交按钮 -->
          <el-form-item class="form-actions">
            <el-button 
              type="primary" 
              class="submit-btn"
              @click="handleSubmit"
              :loading="loading"
            >
              确认修改
            </el-button>
            <el-button 
              type="text" 
              class="cancel-btn"
              @click="$router.back()"
            >
              取消
            </el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage, ElForm, ElFormItem, ElInput, ElButton } from 'element-plus';
import { Lock, Key, Check } from '@element-plus/icons-vue';
import { updatePassword } from '../../api/index'; 

// 表单状态
const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 加载状态
const loading = ref(false);

// 表单引用
const passwordForm = ref(null);

// 路由实例
const router = useRouter();

// 密码强度状态
const passwordStrength = ref(0); // 0-未设置 1-弱 2-中 3-强

// 表单验证规则
const rules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
    { min: 6, message: '原密码长度不能少于6位', trigger: 'blur' }
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 8, message: '新密码长度不能少于8位', trigger: 'blur' },
    { 
      pattern: /^(?=.*[A-Za-z])(?=.*\d).+$/, 
      message: '新密码必须包含字母和数字', 
      trigger: 'blur' 
    },
    { 
      validator: (rule, value, callback) => {
        if (value === form.oldPassword) {
          callback(new Error('新密码不能与原密码相同'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { 
      validator: (rule, value, callback) => {
        if (value !== form.newPassword) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

// 检查密码强度
const checkPasswordStrength = (value) => {
  if (!value) {
    passwordStrength.value = 0;
    return;
  }
  
  let strength = 0;
  // 长度检查
  if (value.length >= 10) strength++;
  // 包含小写字母
  if (/[a-z]/.test(value)) strength++;
  // 包含大写字母
  if (/[A-Z]/.test(value)) strength++;
  // 包含数字
  if (/[0-9]/.test(value)) strength++;
  // 包含特殊字符
  if (/[^A-Za-z0-9]/.test(value)) strength++;
  
  // 映射到1-3级强度
  passwordStrength.value = Math.min(Math.ceil(strength / 2), 3);
};

// 密码强度样式计算
const strengthClass = computed(() => {
  const classes = ['weak', 'medium', 'strong'];
  return classes[passwordStrength.value - 1] || '';
});

const strengthWidth = computed(() => {
  return `${(passwordStrength.value / 3) * 100}%`;
});

// 提交表单
const handleSubmit = async () => {
  // 表单验证
  const valid = await passwordForm.value.validate();
  if (!valid) return;

  loading.value = true;
  try {
    // 调用修改密码接口
    const res = await updatePassword({
      oldPassword: form.oldPassword,
      newPassword: form.newPassword
    });
    
    if (res.data.code === 200) {
      ElMessage.success('密码修改成功，请重新登录');
      // 跳转登录页
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } else {
      ElMessage.error(res.data.msg || '修改密码失败');
    }
  } catch (err) {
    ElMessage.error(err.message || '网络异常，请重试');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>


/* 右侧表单区域 */
.form-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background-color: #f9fafc;
}

.form-card {
  width: 100%;
  max-width: 450px;
  background-color: #fff;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  padding: 40px;
}

.form-header {
  margin-bottom: 30px;
  text-align: center;
}

.form-title {
  font-size: 24px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 8px;
}

.form-subtitle {
  color: #86909c;
  font-size: 14px;
}

.password-form {
  width: 100%;
}

.el-form-item {
  margin-bottom: 20px;
}

.el-form-item__label {
  font-size: 14px;
  color: #4e5969;
  margin-bottom: 8px;
}

.el-input {
  --el-input-border-radius: 8px;
  --el-input-height: 44px;
}

/* 密码强度指示器 */
.password-strength {
  margin-top: 10px;
}

.strength-labels {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  font-size: 12px;
  color: #86909c;
}

.strength-bar {
  height: 6px;
  background-color: #f2f3f5;
  border-radius: 3px;
  overflow: hidden;
}

.strength-indicator {
  height: 100%;
  transition: width 0.3s ease;
}

.strength-indicator.weak {
  background-color: #f56c6c;
}

.strength-indicator.medium {
  background-color: #e6a23c;
}

.strength-indicator.strong {
  background-color: #52c41a;
}

/* 按钮样式 */
.form-actions {
  margin-top: 30px;
}

.submit-btn {
  width: 100%;
  height: 44px;
  font-size: 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  
}

.cancel-btn {
  width: 100%;
  color: #86909c;
}

/* 动画效果 */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
  100% { transform: translateY(0px); }
}

/* 响应式调整 */
@media (max-width: 992px) {
  .password-reset-container {
    flex-direction: column;
  }
  
  .brand-section {
    padding: 30px;
    text-align: center;
  }
  
  .brand-illustration {
    display: none;
  }
  
  .form-card {
    padding: 30px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  }
}

@media (max-width: 576px) {
  .form-card {
    padding: 20px;
    margin: 0 15px;
  }
  
  .form-title {
    font-size: 20px;
  }
}
</style>