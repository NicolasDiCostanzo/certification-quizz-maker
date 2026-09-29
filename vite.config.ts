import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'
import { appName } from './src/brand.ts'

const useFakeAuth = process.env.VITE_E2E_FAKE_AUTH === 'true'
const fakeAuthPath = fileURLToPath(new URL('./src/services/auth.fake.ts', import.meta.url))

function appNamePlugin(): Plugin {
  return {
    name: 'app-name',
    transformIndexHtml: (html) => html.replaceAll('%APP_NAME%', appName),
  }
}

export default defineConfig({
  plugins: [vue(), appNamePlugin()],
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
