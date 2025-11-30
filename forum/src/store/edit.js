// import { defineStore } from "pinia";
// import { updateTale, getTaleDetail, updatePost, getPostDetail } from "../api";

// export const useEditStore = defineStore('editTale', {
//   state: () => ({
//     taleData: null,
//     loading: false, 
//     submitLoading: false,
//     error: ''
//   }),
//   actions: {
//     async fetchTaleDetail(taleId) {
//       this.loading = true;
//       this.error = '';
//       try {
//         const res = await getTaleDetail(taleId);
//         if (res.data.code === 200) {
//           this.taleData = res.data.data;
//         } else {
//           this.error = res.msg || '获取故事详情失败';
//         }
//       } catch (err) {
//         this.error = err.message || '网络异常，请重试';
//       } finally {
//         this.loading = false;
//       }
//     },

//     async submitTaleUpdate(taleId, formData) {
//       this.submitLoading = true;
//       this.error = '';
//       try {
//         const res = await updateTale(taleId, formData);
//         if (res.data.code === 200) {
//           return true;
//         } else {
//           this.error = res.msg || '编辑失败';
//           return false;
//         }
//       } catch (err) {
//         this.error = err.message || '提交失败，请重试';
//         return false;
//       } finally {
//         this.submitLoading = false;
//       }
//     },

//     resetEditState() {
//       this.taleData = null;
//       this.loading = false;
//       this.submitLoading = false;
//       this.error = '';
//     }
//   }
// });

import { defineStore } from "pinia";
// 导入区分类型的接口（确保 post 相关接口已在 api 中定义）
import { updateTale, getTaleDetail, updatePost, getPostDetail } from "../api";

export const useEditStore = defineStore('edit', { // 优化：Store 命名改为通用的 'edit'（不再绑定 tale）
  state: () => ({
    editData: null, // 优化：数据字段改为通用名 editData（兼容 tale/post）
    loading: false, // 修正原拼写错误（Loading → loading）
    submitLoading: false,
    error: ''
  }),
  actions: {
    /**
     * 获取编辑所需的详情数据（支持故事/帖子）
     * @param {string} id - 故事ID（taleId）或帖子ID（postId）
     * @param {string} type - 类型：'tale'（故事）或 'post'（帖子）
     */
    async fetchEditDetail(id, type) {
      // 校验参数合法性
      if (!id || !['tale', 'post'].includes(type)) {
        this.error = '参数错误：缺少ID或类型不合法';
        return;
      }

      this.loading = true;
      this.error = '';
      try {
        // 根据类型动态选择接口
        const fetchApi = type === 'tale' ? getTaleDetail : getPostDetail;
        const res = await fetchApi(id);

        if (res.data.code === 200) {
          this.editData = res.data.data; // 存储通用编辑数据
        } else {
          this.error = res.msg || `获取${type === 'tale' ? '故事' : '帖子'}详情失败`;
        }
      } catch (err) {
        this.error = err.message || '网络异常，请重试';
      } finally {
        this.loading = false;
      }
    },

    /**
     * 提交编辑更新（支持故事/帖子）
     * @param {string} id - 故事ID（taleId）或帖子ID（postId）
     * @param {string} type - 类型：'tale'（故事）或 'post'（帖子）
     * @param {object} formData - 编辑后的表单数据（两种类型结构需一致或兼容）
     * @returns {boolean} - 提交成功返回 true，失败返回 false
     */
    async submitEditUpdate(id, type, formData) {
      // 校验参数合法性
      if (!id || !['tale', 'post'].includes(type) || !formData) {
        this.error = '参数错误：缺少ID、类型或表单数据';
        return false;
      }

      this.submitLoading = true;
      this.error = '';
      try {
        // 根据类型动态选择更新接口
        const updateApi = type === 'tale' ? updateTale : updatePost;
        const res = await updateApi(id, formData);

        if (res.data.code === 200) {
          return true;
        } else {
          this.error = res.msg || `编辑${type === 'tale' ? '故事' : '帖子'}失败`;
          return false;
        }
      } catch (err) {
        this.error = err.message || '提交失败，请重试';
        return false;
      } finally {
        this.submitLoading = false;
      }
    },

    /**
     * 重置编辑状态（通用重置，兼容两种类型）
     */
    resetEditState() {
      this.editData = null;
      this.loading = false;
      this.submitLoading = false;
      this.error = '';
    }
  }
});