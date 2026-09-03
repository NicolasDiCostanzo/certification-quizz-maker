import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import App from './App.vue'
import { router } from './router'
import { useUserPreferencesStore } from './stores/userPreferences'

beforeEach(() => {
  setActivePinia(createPinia())
})

let wrapper!: ReturnType<typeof mount>

afterEach(() => { wrapper?.unmount() })

describe('theme mode toggle', () => {
  it.each([
    [false, 'light'],
    [true, 'dark'],
  ] as [boolean, string][])(
    'applies data-theme=%s on <html> when dark=%s',
    async (dark, expected) => {
      wrapper = mount(App, { global: { plugins: [router] } })
      const store = useUserPreferencesStore()

      store.dark = dark
      await wrapper.vm.$nextTick()

      expect(document.documentElement.dataset.theme).toBe(expected)
    },
  )

  it('toggles to light and applies it on click', async () => {
    wrapper = mount(App, { global: { plugins: [router] } })
    const store = useUserPreferencesStore()

    await wrapper.find('.theme-switch').trigger('click')

    expect(store.dark).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(wrapper.find('.theme-switch').attributes('aria-checked')).toBe('false')
  })
})
