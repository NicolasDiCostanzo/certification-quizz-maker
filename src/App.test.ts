import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App.vue'
import { router } from './router'
import { useUserPreferencesStore } from './stores/userPreferences'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('theme mode toggle', () => {
  it.each([
    [false, 'light'],
    [true, 'dark'],
  ] as [boolean, string][])(
    'applies data-theme=%s on <html> when dark=%s',
    async (dark, expected) => {
      const wrapper = mount(App, { global: { plugins: [router] } })
      const store = useUserPreferencesStore()

      store.dark = dark
      await wrapper.vm.$nextTick()

      expect(document.documentElement.dataset.theme).toBe(expected)
      wrapper.unmount()
    },
  )

  it('renders both icons inside the switch', () => {
    const wrapper = mount(App, { global: { plugins: [router] } })
    const $switch = wrapper.find('.theme-switch')

    expect($switch.find('.icon-sun').exists()).toBe(true)
    expect($switch.find('.icon-moon').exists()).toBe(true)
    wrapper.unmount()
  })

  it('toggles to light and applies it on click', async () => {
    const wrapper = mount(App, { global: { plugins: [router] } })
    const store = useUserPreferencesStore()

    await wrapper.find('.theme-switch').trigger('click')

    expect(store.dark).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(wrapper.find('.theme-switch').attributes('aria-checked')).toBe('false')
    wrapper.unmount()
  })
})
