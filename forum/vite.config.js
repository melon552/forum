import { defineConfig } from 'vite'
//vite官方的vue插件，用来解析.vue单文件组件
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
//配置跨域代理，解决本地跨域开发问题
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
