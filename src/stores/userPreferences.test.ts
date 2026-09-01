import { createApp, nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it } from 'vitest'
import { useUserPreferencesStore } from './userPreferences'

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

describe('userPreferences store', () => {
  it('defaults to dark mode', () => {
    expect(useUserPreferencesStore().dark).toBe(true)
  })

  it('toggles between dark and light', () => {
    const store = useUserPreferencesStore()

    store.toggleTheme()
    expect(store.dark).toBe(false)

    store.toggleTheme()
    expect(store.dark).toBe(true)
  })

  it('restores the persisted theme into a fresh Pinia instance', async () => {
    useUserPreferencesStore().toggleTheme()
    expect(useUserPreferencesStore().dark).toBe(false)
    await nextTick()

    createTestPinia()

    expect(useUserPreferencesStore().dark).toBe(false)
  })
})
