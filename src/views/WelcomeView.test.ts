import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import type { RemoteSyncPayload } from '../services/remoteSync'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { useUserAccountStore } from '../stores/userAccount'
import { useUserProgressStore } from '../stores/userProgress'
import WelcomeView from './WelcomeView.vue'

let pulledPayload: RemoteSyncPayload | null = null

vi.mock('../services/remoteSync', () => ({
  getSyncAdapter: () => ({
    pull: async () => pulledPayload,
    push: async () => {},
  }),
}))

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
    useUserAccountStore().accountMode = null
    useUserProgressStore().byExamCode = {}
    useQuizHistoryStore().entries = []
    pulledPayload = null
  })

  it.each([
    ['create account', 0, 'account'],
    ['sign in', 1, 'account'],
    ['continue locally', 2, 'local'],
  ])('%s stores the account mode and moves on to the cert selector', async (_name, index, mode) => {
    const wrapper = mountWelcome()
    await wrapper.findAll('.btn--primary')[index].trigger('click')
    await flushPromises()

    expect(useUserAccountStore().accountMode).toBe(mode)
    expect(router.currentRoute.value.name).toBe('cert-selector')
  })

  it.each([
    ['create account', 0],
    ['sign in', 1],
  ])('%s pulls and merges remote data when the sync adapter returns a payload', async (_name, index) => {
    pulledPayload = {
      progress: { format: 'quiz-progress', version: 1, exportedAt: new Date().toISOString(), byExamCode: { 'DVA-C02': { q1: { questionId: 'q1', attempts: 1, timesCorrect: 1, timesWrong: 0, flagged: false, lastSeenAt: 1 } } } },
      history: { format: 'quiz-history', version: 1, exportedAt: new Date().toISOString(), entries: [] },
    }

    const wrapper = mountWelcome()
    await wrapper.findAll('.btn--primary')[index].trigger('click')
    await flushPromises()

    expect(useUserProgressStore().byExamCode['DVA-C02']?.q1?.attempts).toBe(1)
  })

  it('continuing locally does not pull remote data', async () => {
    pulledPayload = {
      progress: { format: 'quiz-progress', version: 1, exportedAt: new Date().toISOString(), byExamCode: { 'DVA-C02': { q1: { questionId: 'q1', attempts: 1, timesCorrect: 1, timesWrong: 0, flagged: false, lastSeenAt: 1 } } } },
      history: { format: 'quiz-history', version: 1, exportedAt: new Date().toISOString(), entries: [] },
    }

    const wrapper = mountWelcome()
    await wrapper.findAll('.btn--primary')[2].trigger('click')
    await flushPromises()

    expect(useUserProgressStore().byExamCode['DVA-C02']).toBeUndefined()
  })
})
