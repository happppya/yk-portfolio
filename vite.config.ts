import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Bind every interface so the dev server is reachable from other devices on
  // the same network, not only from this machine's localhost. The hostnames
  // below are the names another device may use to reach it: the mDNS name
  // "yujin.local" (matched by the ".local" suffix) and the bare "yujin".
  server: {
    host: true,
    allowedHosts: ['.local', 'yujin'],
  },
})
