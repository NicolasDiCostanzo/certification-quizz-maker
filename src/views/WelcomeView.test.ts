import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it } from 'vitest'
import { createApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useUserAccountStore } from '../stores/userAccount'
import WelcomeView from './WelcomeView.vue'

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)
createApp({ render: () => null }).use(pinia)
setActivePinia(pinia)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/welcome', name: 'welcome', component: WelcomeView },
    { path: '/auth', name: 'auth', component: { template: '<div/>' } },
    { path: '/', name: 'cert-selector', component: { template: '<div/>' } },
  ],
})

function mountWelcome() {
  return mount(WelcomeView, { global: { plugins: [pinia, router] } })
}

beforeEach(() => {
  const account = useUserAccountStore()
  account.accountMode = null
  account.user = null
})

describe('WelcomeView', () => {
  it.each([
    ['existing account', 0, 'signin'],
    ['new account', 1, 'signup'],
  ])('the %s card opens the auth form in %s mode', async (_name, index, mode) => {
    const wrapper = mountWelcome()
    await wrapper.findAll('.btn--primary')[index].trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('auth')
    expect(router.currentRoute.value.query.mode).toBe(mode)
  })

  it('continuing locally goes straight to the cert selector without any auth step', async () => {
    const wrapper = mountWelcome()
    await wrapper.findAll('.btn--primary')[2].trigger('click')
    await flushPromises()

    expect(useUserAccountStore().accountMode).toBe('local')
    expect(router.currentRoute.value.name).toBe('cert-selector')
  })
})
