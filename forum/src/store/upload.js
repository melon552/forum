// store/upload.js（通用上传逻辑，不绑定具体业务）
import { defineStore } from "pinia";
import { uploadFile } from "../api";
import { ElMessage } from "element-plus";
export const useUploadStore = defineStore('upload', {
  state: () => ({
    uploadLoading: false,
    uploadUrl: ''
  }),
  actions: {
    // store/upload.js
    async uploadFileAction(file) {
      this.uploadLoading = true;
      try {
        console.log('上传到 API 的文件：', file);
        const formData = new FormData();
        formData.append('avatar', file);
        const res = await uploadFile(file); // 调用 API 上传
        console.log('API 返回结果：', res);
        if (res.data.code === 200) {
          this.uploadSuccess = true
          this.uploadUrl = res.data.data.url;
          ElMessage.success('上传成功');
          return this.uploadUrl; // 确保返回新 URL
        } else {
          ElMessage.error(res.data.msg);
          return null;
        }
      } catch (err) {
        ElMessage.error('上传失败');
        return null;
      } finally {
        this.uploadLoading = false;
      }
    },
    resetUploadState() {
      this.uploadUrl = '';
      this.uploadLoading = false;
    }
  },
  // store/upload.js
  // async uploadFileAction(file) {
  //   try {
  //     this.uploadLoading = true;
  //     this.uploadError = '';
  //     console.log('Pinia：开始调用上传接口，文件信息：', file); // 新增日志

  //     const formData = new FormData();
  //     formData.append('avatar', file);

  //     console.log('Pinia：formData构造完成，字段：', formData.get('avatar')); // 新增日志
  //     const res = await uploadFile(file)

  //     console.log('Pinia：接口返回结果：', res); // 新增日志（关键）
  //     if (res.data.code === 200) {
  //       this.uploadSuccess = true;
  //       this.uploadUrl = res.data.data.url;
  //       ElMessage.success('图片上传成功');
  //       console.log('Pinia：上传成功，返回URL：', this.uploadUrl); // 新增日志
  //       return this.uploadUrl;
  //     } else {
  //       this.uploadError = res.data.msg || '图片上传失败';
  //       ElMessage.error(this.uploadError);
  //       console.log('Pinia：接口返回失败：', this.uploadError); // 新增日志
  //       return null;
  //     }
  //   } catch (err) {
  //     this.uploadError = err.message || '上传接口调用失败';
  //     ElMessage.error(this.uploadError);
  //     console.log('Pinia：上传报错：', err); // 新增日志（关键）
  //     return null;
  //   } finally {
  //     this.uploadLoading = false;
  //   }
  // }

});