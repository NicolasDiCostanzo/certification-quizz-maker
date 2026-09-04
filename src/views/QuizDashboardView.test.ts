import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { useUserProgressStore } from '../stores/userProgress'
import QuizDashboardView from './QuizDashboardView.vue'

vi.mock('../composables/useQuizLoader', () => ({
  useQuizLoader: () => ({
    getCert: () => ({
      version: 1,
      exam: { name: 'Test', code: 'TEST', totalQuestions: 2, timeLimitMinutes: 10, passingScore: { passingScore: 700, scale: 1000 } },
      themes: { services: ['lambda'] },
      questions: [
        { id: 'q1', question: 'Q1?', options: ['A', 'B'], answers: 'A', topic: 'Security', themes: { services: ['lambda'] } },
      ],
    }),
  }),
}))

const pinia = createPinia()
setActivePinia(pinia)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'cert-selector', component: { template: '<div/>' } },
    { path: '/certs/:certCode', name: 'quiz-dashboard', component: QuizDashboardView, props: true },
    { path: '/certs/:certCode/configure', name: 'quiz-configure', component: { template: '<div/>' } },
    { path: '/certs/:certCode/flagged', name: 'flagged-review', component: { template: '<div/>' } },
    { path: '/certs/:certCode/topic/:topic', name: 'topic-review', component: { template: '<div/>' } },
    { path: '/certs/:certCode/theme/:themeGroup/:themeValue', name: 'theme-review', component: { template: '<div/>' } },
  ],
})

describe('QuizDashboardView', () => {
  beforeEach(() => {
    useUserProgressStore().byExamCode = {}
    useQuizHistoryStore().entries = []
  })

  it('shows the flagged review button when a question is flagged without any quiz history', async () => {
    const progressStore = useUserProgressStore()
    progressStore.byExamCode['TEST'] = {
      q1: { questionId: 'q1', attempts: 1, timesCorrect: 0, timesWrong: 1, flagged: true, lastSeenAt: 1 },
    }

    await router.push('/certs/TEST')
    const wrapper = mount(QuizDashboardView, { global: { plugins: [pinia, router] }, props: { certCode: 'TEST' } })

    const button = wrapper.find('.flagged-review-btn')
    expect(button.exists()).toBe(true)
    expect(button.attributes('disabled')).toBeUndefined()
  })

  it('shows no review breakdown when there is no history and nothing flagged', async () => {
    await router.push('/certs/TEST')
    const wrapper = mount(QuizDashboardView, { global: { plugins: [pinia, router] }, props: { certCode: 'TEST' } })

    expect(wrapper.find('.flagged-review-btn').exists()).toBe(false)
  })
})
