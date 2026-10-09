import { fileURLToPath, URL } from 'node:url'

import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // 代理目标可用环境变量覆盖，便于把前端指向别的后端实例：
  //   VITE_PROXY_TARGET=http://127.0.0.1:8001 npm run dev
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_PROXY_TARGET || 'http://127.0.0.1:8000'

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      // 5180：避开已有的 main-vue(:5173) / sub-vue(:5174) / sub-react(:5175)
      port: 5180,
      host: '127.0.0.1',
      proxy: {
        // 开发期走代理，浏览器视角下同源，彻底绕开跨域与预检
        '/api': {
          target: apiTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
