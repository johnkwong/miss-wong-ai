import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/miss-wong-ai/', // 這裡要換成你稍後在 GitHub 建立的專案名稱
})