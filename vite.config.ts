import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const useFakeAuth = process.env.VITE_E2E_FAKE_AUTH === 'true'
const fakeAuthPath = fileURLToPath(new URL('./src/services/auth.fake.ts', import.meta.url))

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: useFakeAuth
      ? [
          { find: './services/auth', replacement: fakeAuthPath },
          { find: '../services/auth', replacement: fakeAuthPath },
        ]
      : [],
  },
  test: {
    environment: 'jsdom',
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
  },
})
