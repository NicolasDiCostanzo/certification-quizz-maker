import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useUserPreferencesStore } from '../stores/userPreferences'
import WelcomeView from './WelcomeView.vue'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
createApp({ render: () => null }).use(pinia)
setActivePinia(pinia)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/welcome', name: 'welcome', component: WelcomeView },
    { path: '/', name: 'cert-selector', component: { template: '<div/>' } },
  ],
})

function mountWelcome() {
  return mount(WelcomeView, { global: { plugins: [pinia, router] } })
}

describe('WelcomeView', () => {
  beforeEach(() => {
    useUserPreferencesStore().accountMode = null
  })

  it.each([
    ['create account', 0, 'account'],
    ['sign in', 1, 'account'],
    ['continue locally', 2, 'local'],
  ])('%s stores the account mode and moves on to the cert selector', async (_name, index, mode) => {
    const wrapper = mountWelcome()
    await wrapper.findAll('.welcome-card__cta')[index].trigger('click')
    await flushPromises()

    expect(useUserPreferencesStore().accountMode).toBe(mode)
    expect(router.currentRoute.value.name).toBe('cert-selector')
  })
})
