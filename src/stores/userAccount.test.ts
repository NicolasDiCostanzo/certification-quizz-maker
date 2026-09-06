import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp, nextTick } from 'vue'
import { useUserAccountStore } from './userAccount'

function createTestPinia() {
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  createApp({ render: () => null }).use(pinia)
  setActivePinia(pinia)
  return pinia
}

beforeEach(() => {
  localStorage.clear()
  createTestPinia()
})

describe('userAccount store', () => {
  it('starts with no account mode chosen', () => {
    expect(useUserAccountStore().accountMode).toBeNull()
  })

  it('persists the chosen account mode into a fresh Pinia instance', async () => {
    useUserAccountStore().accountMode = 'local'
    await nextTick()

    createTestPinia()

    expect(useUserAccountStore().accountMode).toBe('local')
  })
})
