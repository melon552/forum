import { defineStore } from 'pinia'
import { getPostDetail, getTaleDetail } from '../api'
import { likeTale, likePost } from '../api'
import { useUserStore } from './user' // 引入用户Store获取当前用户ID

export const useDetailStore = defineStore('detail', {
  state: () => ({
    data: null,
    loading: false,
    error: '',
    currentType: '', // 记录当前类型：'tale' 或 'post'
    currentId: '', // 记录当前ID（无论是taleId还是postId）
    isLiked: false // 点赞状态（响应式）
  }),
  getters: {
    isLoaded: (state) => !!state.data
  },
  actions: {
    // 加载详情数据（核心修复：通过whoGood数组判断点赞状态）
    async fetchDetail(type, id) {
      // 若已加载同一数据，直接返回
      if (this.currentType === type && this.currentId === id && this.data) {
        return
      }

      // 1. 重置所有状态（包括点赞状态，关键修复点）
      this.loading = true
      this.currentType = type
      this.currentId = id
      this.error = ''
      this.isLiked = false // 加载新数据时强制重置点赞状态

      // 获取当前登录用户ID（从userStore中取）
      const userStore = useUserStore()
      const currentUserId = userStore.userId || userStore.info.userId // 适配你的用户ID字段名

      try {
        let res;
        if (type === 'tale') {
          res = await getTaleDetail(id);
        } else if (type === 'post') {
          res = await getPostDetail(id);
        } else {
          throw new Error(`未知内容类型: ${type}`);
        }

        if (res.data.code === 200) {
          this.data = res.data;
          // 2. 核心逻辑：通过whoGood数组判断是否点赞
          const whoGoodList = this.data.data.whoGood || [] // 后端返回的点赞用户ID数组
          // 判断当前用户ID是否在点赞数组中（注意类型统一，比如都是字符串/数字）
          this.isLiked = whoGoodList.some(userId => String(userId) === String(currentUserId))
          console.log('详情数据加载成功:', this.data, '当前点赞状态:', this.isLiked);
        } else {
          this.error = res.msg || '加载失败';
        }
      } catch (err) {
        this.error = err.message || '网络异常，请重试';
        console.error('详情加载失败:', err);
      } finally {
        this.loading = false;
      }
    },

    // 重置详情状态（包含点赞状态）
    resetDetail() {
      this.data = null
      this.currentType = ''
      this.currentId = ''
      this.error = ''
      this.isLiked = false // 明确重置点赞状态
    },

    // 点赞/取消点赞切换（同步更新whoGood数组和isLiked状态）
    async toggleLike() {
      if (!this.data || !this.currentId) return;

      // 获取当前登录用户ID
      const userStore = useUserStore()
      const currentUserId = userStore.userId || userStore.info.userId
      if (!currentUserId) {
        throw new Error('请先登录再进行点赞操作');
      }

      try {
        // 根据类型动态选择调用的接口
        const likeApi = this.currentType === 'post' ? likePost : likeTale;
        // 调用对应点赞接口（传递ID）
        const res = await likeApi(this.currentId);

        if (res.data.code === 200) {
          // 1. 更新点赞状态（取反）
          this.isLiked = !this.isLiked
          // 2. 同步更新data中的whoGood数组（保证页面显示一致）
          const whoGoodList = this.data.data.whoGood || []
          if (this.isLiked) {
            // 点赞：添加当前用户ID到数组
            if (!whoGoodList.some(userId => String(userId) === String(currentUserId))) {
              this.data.data.whoGood = [...whoGoodList, currentUserId]
            }
          } else {
            // 取消点赞：从数组中移除当前用户ID
            this.data.data.whoGood = whoGoodList.filter(userId => String(userId) !== String(currentUserId))
          }
          // 3. 同步点赞数（如果接口返回）
          if (res.data.data?.goodNumber) {
            this.data.data.goodNumber = res.data.data.goodNumber
          }
          console.log(`${this.currentType === 'post' ? '帖子' : '故事'}点赞状态更新:`, this.isLiked);
        } else {
          throw new Error(res.data.msg || '点赞操作失败');
        }
      } catch (err) {
        console.error(`${this.currentType === 'post' ? '帖子' : '故事'}点赞操作失败:`, err);
        throw new Error('点赞操作失败，请重试');
      }
    },

  },

  persist: {
    enabled: true,
    // 持久化包含isLiked（保证刷新后状态正确）
    paths: ['data', 'currentType', 'currentId', 'isLiked']
  }
})