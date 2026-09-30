import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useUserAccountStore } from '../stores/userAccount'
import NotFoundView from './NotFoundView.vue'

vi.mock('../composables/useQuizLoader', () => ({
  useQuizLoader: () => ({ availableCerts: [{ exam: { code: 'DVA-C02' }, questionCount: 1 }] }),
}))

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
    { path: '/', name: 'welcome', component: { template: '<div/>' } },
    { path: '/cert', name: 'cert-selector', component: { template: '<div/>' } },
  ],
})

beforeEach(async () => {
  setActivePinia(createPinia())
  await router.push('/nope/missing-page?x=1')
})

describe('NotFoundView', () => {
  it('shows the requested path so the user can see what was mistyped', () => {
    const wrapper = mount(NotFoundView, { global: { plugins: [router] } })

    expect(wrapper.find('code').text()).toBe('/nope/missing-page?x=1')
  })

  it('sends a local-only user back to the welcome screen', async () => {
    useUserAccountStore().accountMode = 'local'
    const wrapper = mount(NotFoundView, { global: { plugins: [router] } })

    await wrapper.get('.not-found__actions .btn--primary').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('welcome')
  })

  it('sends a signed-in account to the cert selector instead of the welcome screen', async () => {
    useUserAccountStore().accountMode = 'account'
    const wrapper = mount(NotFoundView, { global: { plugins: [router] } })

    await wrapper.get('.not-found__actions .btn--primary').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('cert-selector')
  })
})
