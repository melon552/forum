import { defineStore } from 'pinia';
import { getUserInfo } from '../api/index';
import { DEFAULT_AVATAR } from '../utils/avatar'; // 引入默认头像

export const useUserStore = defineStore('user', {
  state: () => ({
    info: {
      username: '',
      avatar: DEFAULT_AVATAR, // 强制设置默认头像（关键）
      role: '普通用户',
      level: 1,
      collectionNum: 0,
      storyNum: 0,
      postNum: 0
    },
    token: localStorage.getItem('lt_token') || ''
  }),
  actions: {
    async fetchUserInfo() {


      if (!this.token) {

        return;
      }
      try {

        const res = await getUserInfo();
        if (res.data.code === 200) {
          this.userId = res.data.data.userId;
          // 合并接口返回数据（避免覆盖默认值）
          this.info = {
            ...this.info, // 保留原有默认值（如 role、level 等）
            ...res.data.data // 覆盖后端返回的字段
          };
        }


      } catch (error) {

        // 失败时仍保留默认头像
        this.info.avatar = DEFAULT_AVATAR;
      }
    },
    logout() {
      this.token = '';
      this.info = {
        username: '',
        avatar: DEFAULT_AVATAR,
        role: '普通用户',
        level: 1,
        collectionNum: 0,
        storyNum: 0,
        postNum: 0
      };
      localStorage.removeItem('token');
    }
  }
})