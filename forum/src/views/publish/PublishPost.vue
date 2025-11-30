<template>
  <div class="publish-story-container">
    <div class="page-header">
      <!-- <h1 class="title">发布帖子</h1> -->
      <div class="btn-group">
        <el-button type="default" @click="goBack">取消</el-button>
        <el-button type="info" @click="handleSaveDraft" :loading="isSavingDraft">保存草稿</el-button>
        <el-button type="primary" @click="submitForm" :loading="isSubmitting">发布</el-button>
      </div>
    </div>

    <el-form :model="form" :rules="rules" ref="formRef" label-width="80px" class="publish-form">
      <!-- 帖子标题 -->
      <el-form-item label="帖子标题" prop="title">
        <el-input 
          v-model="form.title" 
          placeholder="请输入帖子标题（不超过60字）" 
          maxlength="60"
          show-word-limit
          class="input-item"
        />
      </el-form-item>

      <!-- 帖子分类 -->
      <el-form-item label="帖子分类" prop="type">
        <el-select 
          v-model="form.type" 
          placeholder="请选择帖子分类" 
          class="input-item"
        >
          <el-option label="爱情" value="1">爱情</el-option>
          <el-option label="科幻" value="2">科幻</el-option>
          <el-option label="悬疑" value="3">悬疑</el-option>
          <el-option label="校园" value="4">校园</el-option>
          <el-option label="职场" value="5">职场</el-option>
          <el-option label="奇幻" value="6">奇幻</el-option>
        </el-select>
      </el-form-item>

      <!-- 封面上传 -->
      <el-form-item label="帖子封面" prop="cover">
        <el-upload
          class="upload-cover"
          :http-request="customUpload"
          :headers="{ Authorization: `Bearer ${token}` }"
          :on-success="handleCoverUpload"
          :on-error="handleUploadError"
          :before-upload="beforeCoverUpload"
          :file-list="coverFileList"
          list-type="picture-card"
          :limit="1"
          :on-remove="handleFileRemove"
          name="avatar"
        >
          <i class="el-icon-plus"></i>
        </el-upload>
        <div class="upload-tip">支持JPG、PNG格式，建议尺寸16:9，不超过5MB</div>
      </el-form-item>

      <!-- 帖子内容（富文本） -->
      <el-form-item label="帖子内容" prop="content">
        <div class="editor-container">
          <quill-editor
            v-model:content="form.content"
            :options="editorOptions"
            placeholder="请详细描述你的帖子内容"
            class="quill-editor"
            
          />
        </div>
      </el-form-item>

      <!-- 发布设置 -->
      <el-form-item label="发布设置">
        <el-switch 
          v-model="form.isPublish" 
          active-text="立即发布" 
          inactive-text="保存草稿"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted,nextTick,watch } from 'vue';
import { useRouter,useRoute } from 'vue-router';
import { ElMessage, ElMessageBox } from 'element-plus';
import { QuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { publishPost,savePostDraft,draftPostDetail } from '../../api/index'; // 导入发布故事接口
import {QuillDeltaToHtmlConverter} from 'quill-delta-to-html';
import Quill from 'quill';
import { useUploadStore } from '../../store/upload';

const uploadStore=useUploadStore()
const isSavingDraft = ref(false);
const router = useRouter();
const formRef = ref(null);
const isSubmitting = ref(false);
const token = localStorage.getItem('lt_token');
const coverFileList = ref([]);
// 封面上传接口地址（替换为你的实际上传接口）


//记录上次保存草稿的id
const LAST_DRAFT_KEY = 'last_post_draft_postId'
// 表单数据
const form = reactive({
  title: '',
  type: '',
  cover: '', // 封面图片URL
  content: '',
  isPublish: true // 默认立即发布
});

// 表单校验规则
const rules = reactive({
  title: [
    { required: true, message: '请输入故事标题', trigger: 'blur' },
    { max: 60, message: '标题长度不能超过60字', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择故事分类', trigger: 'change' }
  ],
  cover: [
    { required: true, message: '请上传故事封面', trigger: 'change' }
  ],
  content: [
    { 
      validator: (rule, value, callback) => {
        const converter = new QuillDeltaToHtmlConverter(value.ops, {});
        const html = converter.convert();
        const text = html.replace(/<[^>]+>/g, '').trim();
        if (text.length === 0) {
          callback(new Error('请输入故事内容'));
        } else {
          callback();
        }
      },
      trigger: 'change'
    }
  ]
  
  
});

// 富文本编辑器配置
const editorOptions = reactive({
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'], // 加粗、斜体、下划线、删除线
      ['blockquote', 'code-block'], // 引用、代码块
      [{ 'header': 1 }, { 'header': 2 }], // 标题1、标题2
      [{ 'list': 'ordered' }, { 'list': 'bullet' }], // 有序列表、无序列表
      [{ 'align': [] }], // 对齐方式
      [{ 'color': [] }, { 'background': [] }], // 文字颜色、背景颜色
      ['link', 'image'], // 链接、图片
      ['clean'] // 清除格式
    ]
  }
});

// 封面上传前校验
const beforeCoverUpload = (file) => {
  const isImage = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt5M = file.size / 1024 / 1024 < 5;
  if (!isImage) {
    ElMessage.error('请上传JPG或PNG格式的图片');
    return false;
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过5MB');
    return false;
  }
  return true;
};

// 封面上传成功处理
const handleCoverUpload = (response) => {
  if (response.code === 200) {
    form.cover = response.data.url; // 存储封面URL
    ElMessage.success('封面上传成功');
  } else {
    ElMessage.error('封面上传失败，请重试');
  }
};


//上传封面逻辑
const customUpload=async(options)=>{
  const file = options.file; // 获取上传的文件
  if (!file) {
    ElMessage.error('未选择文件');
    options.onError(); 
    return;
  }

  // 调用 Pinia 的上传方法
  const resultUrl = await uploadStore.uploadFileAction(file);

  if (resultUrl) {
    // 上传成功：同步表单和文件列表
    form.cover = resultUrl;
    coverFileList.value = [{ 
      url: resultUrl, 
      name: '封面', 
      status: 'success' 
    }];
    options.onSuccess(); // 通知 el-upload 上传成功
  } else {
    // 上传失败：清空状态
    form.cover = '';
    coverFileList.value = [];
    options.onError(); // 通知 el-upload 上传失败
  }
}
// 上传失败处理
const handleUploadError = () => {
  ElMessage.error('上传失败，请检查网络或联系管理员');
};

// 保存草稿（兼容新建/编辑）
const handleSaveDraft = async () => {
  try {
    isSavingDraft.value = true;
    
    // 1. 富文本 Delta 转 HTML（后端存储 HTML）
    const converter = new QuillDeltaToHtmlConverter(
      form.content.ops || [], 
      {}
    );
    const htmlContent = converter.convert();

    // 2. 构造请求参数（核心：携带 form.taleId，有则编辑，无则新建）
    const draftParams = {
      taleId: form.taleId, // 新建时为 ''/undefined，编辑时为具体ID
      title: form.title || '未命名草稿',
      type: form.type || '',
      cover: form.cover || '/default-cover.png',
      content: htmlContent || '',
      isPublish: 0 // 固定标记为草稿
    };

    // 3. 校验必填项（标题、分类、封面）
    await formRef.value.validateField(['title', 'type', 'cover']);

    // 4. 调用后端接口（新建/编辑统一用这个接口）
    const res = await savePostDraft(draftParams);
    console.log('保存草稿返回:', res);

    // 5. 处理返回结果（获取 taleId）
    if (res.data?.code === 200 && res.data.data?.taleId) {
      const postId=res.data.data?.postId
      localStorage.setItem(LAST_DRAFT_KEY,postId)
      form.postId = res.data.data.postId; // 存储草稿ID（新建时赋值，编辑时更新）
      form.title = draftParams.title;
      form.type = draftParams.type;
      form.cover = draftParams.cover;
      ElMessage.success(res.data.msg || '草稿保存成功');
      // 跳转并携带 postId，下次进入自动加载
      router.push({ 
        path: '/publishpost', 
        query: { postId: form.postId } 
      });
    } else {
      ElMessage.warning('草稿保存成功，但未获取到草稿ID');
    }
  } catch (err) {
    console.error('保存草稿失败:', err);
    ElMessage.error(err.message || '草稿保存失败，请重试');
  } finally {
    isSavingDraft.value = false;
  }
};

// 提交表单
const submitForm = async () => {
  try {
    isSubmitting.value = true;
    
    // 1. 富文本 Delta 转 HTML
    const converter = new QuillDeltaToHtmlConverter(
      form.content.ops || [], 
      {}
    );
    const htmlContent = converter.convert();

    // 2. 校验纯文本长度
    const textLength = htmlContent.replace(/<[^>]+>/g, '').trim().length;
    if (textLength === 0) {
      throw new Error('请输入有效故事内容');
    }

    // 3. 全表单校验
    await formRef.value.validate();

    // 4. 构造请求参数（携带 taleId：编辑草稿后发布，不携带：新建直接发布）
    const params = {
      postId: form.postId, // 草稿编辑后发布时携带，新建发布时为空
      title: form.title,
      type: form.type,
      cover: form.cover,
      content: htmlContent,
      isPublish: form.isPublish ? 1 : 0, // 1=发布，0=保存草稿
      isPost: 1
    };

    // 5. 调用发布接口
    const res = await publishPost(params);
    console.log('发布返回:', res);

    if (res.data?.code === 200) {
      ElMessage.success('发布成功');
      router.push('/postlist');
    }
  } catch (error) {
    console.error('发布失败:', error);
    ElMessage.error('发布失败，请重试');
  } finally {
    isSubmitting.value = false;
  }
};
const fetchDraft=async ()=>{
  console.log(route);
  
  const postId=route.query.postId

  if(!postId) return
  try {
    const res= await draftPostDetail(postId)
    if(res.data?.code===200){
      const draft=res.data.data
      form.title=draft.title
      form.type = draft.type;
      form.cover = draft.cover;
      form.postId = postId;
      // 将HTML转换为Quill Delta
      // const htmlToDelta = new QuillHtmlToDelta();
      // form.content = htmlToDelta.convert(draft.content);
      // const tempQuill = new Quill(document.createElement('div'), { theme: 'snow' });
      // tempQuill.root.innerHTML = draft.content || '';
      // form.content = tempQuill.getContents();
      coverFileList.value = form.cover ? [{ url: form.cover, name: '封面' }] : [];
      console.log('信息回显成功',form);
      
    }
  } catch (err) {
    ElMessage.error(err.message||'获取草稿失败')
  }
}
watch(() => form.content, (newVal) => {
  console.log('富文本内容变化:', newVal);
}, { deep: true });
// 取消返回
const goBack = () => {
  if (form.title || form.content || form.cover) {
    ElMessageBox.confirm(
      '当前内容尚未保存，是否确定离开？',
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      router.back();
    }).catch(() => {});
  } else {
    router.back();
  }
};

const route=useRoute()
onMounted(async() => {
  await nextTick(); // 等待DOM渲染完成
  form.content = '<p>测试初始化内容</p>';
  console.log('初始化富文本内容:', form.content);
  // 检查登录状态
  if (!token) {
    ElMessage.warning('请先登录');
    router.push('/login');
  }
  const postId = route.query.postId;
  if (postId) {
    form.postId = postId; // 赋值给 form，后续保存时会携带
    await fetchDraft(); // 加载草稿内容
  }
});
</script>

<style scoped>
.publish-story-container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
  background-color: #f9fafc;
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

.btn-group {
  display: flex;
  gap: 12px;
}

.publish-form {
  background-color: #fff;
  padding: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.input-item {
  width: 100%;
  max-width: 800px;
}

.upload-cover {
  margin-bottom: 8px;
}

.upload-tip {
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}

.editor-container {
  max-width: 100%;
  margin-top: 8px;
}

.quill-editor {
  min-height: 400px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .publish-story-container {
    padding: 16px;
  }

  .publish-form {
    padding: 16px;
  }

  .quill-editor {
    min-height: 300px;
  }
}



</style>