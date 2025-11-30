<template>
  <div class="edit-tale-container">
    <div class="page-header">
      <h1 class="title">{{ currentType === 'tale' ? '编辑故事' : '编辑帖子' }}</h1>
      <el-button type="text" @click="gotoBack">返回列表</el-button>
    </div>

    <!-- 加载状态 -->
    <el-loading v-if="editStore.loading" fullscreen text="加载中..." />

    <!-- 错误提示 -->
    <el-alert 
      v-if="editStore.error" 
      type="error" 
      :message="editStore.error" 
      show-icon 
      class="error-alert"
    />

    <!-- 编辑表单 -->
    <el-form 
      :model="form" 
      :rules="formRules" 
      ref="formRef" 
      label-width="80px" 
      class="edit-form"
      v-if="editStore.editData"
    >
      <el-form-item label="故事标题" prop="title">
        <el-input 
          v-model="form.title" 
          placeholder="请输入故事标题" 
          class="input-item"
          maxlength="50"
        />
      </el-form-item>

      <el-form-item label="故事类型" prop="type">
        <el-select 
          v-model="form.type" 
          placeholder="请选择故事类型" 
          class="input-item"
        >
          <el-option label="爱情" value="love">爱情</el-option>
          <el-option label="科幻" value="sci-fi">科幻</el-option>
          <el-option label="悬疑" value="mystery">悬疑</el-option>
        </el-select>
      </el-form-item>

      <el-form-item label="故事内容" prop="content">
        <el-input 
          v-model="form.content" 
          placeholder="请输入故事内容" 
          class="input-item"
          type="textarea"
          :rows="10"
          maxlength="2000"
        />
      </el-form-item>

      <el-form-item label="封面图" prop="cover">
      <el-upload
        class="avatar-uploader"
        :file-list="form.cover ? [{ url: form.cover }] : []"
        :http-request="customUpload" 
        
        :loading="uploadStore.uploadLoading" 
        list-type="picture-card"
        accept="image/*" 
      >
        <i class="el-icon-plus avatar-uploader-icon"></i>
      </el-upload>
      
    </el-form-item>
      <el-form-item>
        <el-button 
          type="primary" 
          @click="submitEdit" 
          :loading="editStore.submitLoading"
        >
          提交修改
        </el-button>
        <el-button @click="resetForm" class="cancel-btn">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useEditStore } from '../../store/edit';
import { ElLoading } from 'element-plus';
import { useUploadStore } from '../../store/upload'; 
const router = useRouter();
const route = useRoute();
const editStore = useEditStore();
const formRef = ref(null); // 表单引用
const uploadStore = useUploadStore();
// 表单数据（与接口返回字段对应）
const form = ref({
  title: '',
  type: '',
  content: '',
  cover: '' // 封面图URL
});

// 上传文件列表
const fileList = ref([]);
//区分type
const currentType=ref('')
const currentId=ref('')
//上传
const customUpload = async (options) => {
  const file = options.file;
  console.log('上传的文件信息：', file); 
  if (!file) {
    ElMessage.error('未选择文件');
    return;
  }
  const resultUrl = await uploadStore.uploadFileAction(file); 
  console.log('url的值',resultUrl);
  
  if (resultUrl) {
    form.value.cover = resultUrl; 
    console.log('表单 cover 已更新为：', form.value.cover); // 现在应打印新 URL
  }
};
// 表单校验规则
const formRules = ref({
  title: [
    { required: true, message: '请输入故事标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度在 2-50 字之间', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择故事类型', trigger: 'change' }
  ],
  content: [
    { required: true, message: '请输入故事内容', trigger: 'blur' },
    { min: 10, max: 2000, message: '内容长度在 10-2000 字之间', trigger: 'blur' }
  ]
});

// 从URL获取 taleId，加载故事详情并回显表单
onMounted(() => {
  const { id,type} = route.params; // 从 params 中读取 id
  if (!id || !['tale', 'post'].includes(type)) {
    ElMessage.error('参数错误，无法编辑');
    gotoBack();
    return;
  }
  currentType.value=type
  currentId.value=id
  // 调用Pinia方法获取故事详情
 editStore.fetchEditDetail(id,type).then(() => {
    if (editStore.editData) {
      form.value = { ...editStore.editData };
      fileList.cover=form.value.cover?[{url:form.value.cover}]:[]
    }
  });
});

// 离开页面时重置Pinia状态
onUnmounted(() => {
  editStore.resetEditState();
});

// 提交编辑：将cover字段传给后端，更新表
const submitEdit = async () => {
  await formRef.value.validate();
  
  
  const submitData = {
    title: form.value.title,
    type: form.value.type,
    content: form.value.content,
    cover: form.value.cover  
  };
  const success = await editStore.submitEditUpdate(currentId.value, currentType.value, submitData);
  if (success) {
    ElMessage.success(`${currentType.value === 'tale' ? '故事' : '帖子'}编辑成功`);
    router.back();
  }
};

// 重置表单
const resetForm = () => {
  formRef.value.resetFields();
  form.value = { ...editStore.editData }; 
  fileList.value = form.value.cover ? [{ url: form.value.cover }] : [];
};

// 返回列表页
const gotoBack = () => {
  router.back() 
};

// 封面图上传成功回调
// const handleUploadSuccess = (response, file) => {//
//   if (response.data.code === 200) {
//     form.value.cover = response.data.data.url; // 存储上传后的图片URL
//     fileList.value = [{ url: response.data.data.url }];
//   } else {
//     ElMessage.error('图片上传失败');
//   }
// };

// 上传前校验图片格式和大小
// const beforeUpload = (file) => {
//   const isImage = file.type.startsWith('image/');
//   const isLt2M = file.size / 1024 / 1024 < 2; // 统一变量名（原 isLt5M 是笔误）
//   if (!isImage) {
//     ElMessage.error('请上传图片格式文件');
//   }
//   if (!isLt2M) {
//     ElMessage.error('图片大小不能超过 2MB');
//   }
//   return isImage && isLt2M; // 修复：原返回 isImage && isLt2M（之前变量名不一致）
// };
</script>

<style scoped>
.edit-tale-container {
  padding: 24px;
  max-width: 1000px;
  margin: 0 auto;
  background-color: #fff;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #eee;
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
}

.error-alert {
  margin-bottom: 24px;
}

.edit-form {
  background-color: #f9fafc;
  padding: 24px;
  border-radius: 8px;
}

.input-item {
  width: 100%;
  margin-bottom: 0;
}

.avatar-uploader {
  margin-bottom: 16px;
}

.preview-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 4px;
}

.cancel-btn {
  margin-left: 12px;
}

@media (max-width: 768px) {
  .edit-tale-container {
    padding: 16px;
  }

  .edit-form {
    padding: 16px;
  }
}
</style>