import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 환경변수 로드
  const env = loadEnv(mode, process.cwd(), '')
  const BACKEND_URL = env.VITE_API_URL || 'http://localhost:8080';

  return {
  plugins: [react()],
  base: './',
  build: {
    outDir: 'dist',
  },
  define: {
    global: 'window',
  },
  // 프론트에서 /api로 시작하는 요청 들어올 시 백엔드로 전달
  server: {
    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        secure: false,
      },
      '/gs-guide-websocket': {
        target: BACKEND_URL,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/dnf': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
      '/riot': {
        target: BACKEND_URL,
        changeOrigin: true,
      },
      '/agora':{
        target: BACKEND_URL,
        changeOrigin: true,
      },
      
      '/upload':{
        target: BACKEND_URL,
        changeOrigin: true,
      },
      '/lostark' : {
        target: BACKEND_URL,
        changeOrigin: true,
      }


    }
  }
  }
})
