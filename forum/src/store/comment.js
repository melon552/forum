

import { defineStore } from "pinia";
// 导入区分类型的评论接口（替换为你的实际接口路径）
import { createTaleComment, getTaleComment, createPostComment, getPostComment } from "../api/index";

export const useCommentStore = defineStore('comment', {
  state: () => ({
    commentList: { list: [], total: 0 }, // 评论列表（通用存储，不分类型）
    loading: false,
    error: ''
  }),
  actions: {
    /**
     * 获取评论列表（支持故事/帖子）
     * @param {string} id - 故事ID（taleId）或帖子ID（postId）
     * @param {string} type - 类型：'tale'（故事）或 'post'（帖子）
     */
    async fetchComments(id, type) {
      // 校验参数
      if (!id || !['tale', 'post'].includes(type)) {
        this.error = '参数错误：缺少ID或类型不合法';
        return;
      }

      this.loading = true;
      try {
        // 根据类型动态选择接口
        const fetchApi = type === 'tale' ? getTaleComment : getPostComment;
        const res = await fetchApi(id); // 两个接口参数格式保持一致（仅传ID）

        // 假设接口返回格式统一：{ data: { list: [...], total: 数字 } }
        this.commentList = res.data.data || { list: [], total: 0 };
        this.error = '';
      } catch (err) {
        this.error = err.message || `加载${type === 'tale' ? '故事' : '帖子'}评论失败`;
        this.commentList = { list: [], total: 0 }; // 异常时重置列表
      } finally {
        this.loading = false;
      }
    },

    /**
     * 提交评论（支持故事/帖子）
     * @param {string} id - 故事ID（taleId）或帖子ID（postId）
     * @param {string} type - 类型：'tale'（故事）或 'post'（帖子）
     * @param {string} content - 评论内容
     * @returns {boolean} - 提交成功返回true，失败返回false
     */
    async submitComment(id, type, content) {
      // 校验参数
      if (!id || !['tale', 'post'].includes(type) || !content.trim()) {
        this.error = '参数错误：缺少ID、类型或评论内容为空';
        return false;
      }

      this.loading = true;
      try {
        // 根据类型动态选择接口
        const createApi = type === 'tale' ? createTaleComment : createPostComment;
        // 假设两个接口参数格式一致：(id, { content })
        await createApi(id, { content });

        // 提交成功后，重新加载该类型的评论列表（刷新最新数据）
        await this.fetchComments(id, type);
        this.error = '';
        return true;
      } catch (err) {
        this.error = err.message || `发表${type === 'tale' ? '故事' : '帖子'}评论失败`;
        return false;
      } finally {
        this.loading = false;
      }
    }
  }
});