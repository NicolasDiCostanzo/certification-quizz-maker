import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useQuizSessionStore } from '../stores/quizSession'
import { useUserProgressStore } from '../stores/userProgress'
import type { Question } from '../types'
import QuizReviewView from './QuizReviewView.vue'

vi.mock('../composables/useQuizLoader', () => ({
  useQuizLoader: () => ({
    getCert: () => ({
      exam: { name: 'Test', code: 'TEST', totalQuestions: 65, timeLimitMinutes: 130, passingScore: { passingScore: 700, scale: 1000 } },
      themes: { services: ['lambda', 's3'] },
    }),
  }),
}))

function makeQuestions(): Question[] {
  return [
    { id: 'q1', question: 'Q1?', options: ['A', 'B', 'C'], answers: 'B', topic: 'Security', themes: { services: ['lambda'] } },
    { id: 'q2', question: 'Q2?', options: ['A', 'B', 'C', 'D'], answers: ['A', 'C'], topic: 'Deployment', themes: { services: ['s3'] } },
    { id: 'q3', question: 'Q3?', options: ['A', 'B'], answers: 'A', topic: 'Security', explanation: 'Because.' },
  ]
}

const pinia = createPinia()
setActivePinia(pinia)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'cert-selector', component: { template: '<div/>' } },
    { path: '/certs/:certCode/quiz/review', name: 'quiz-review', component: QuizReviewView },
  ],
})

describe('QuizReviewView', () => {
  let store: ReturnType<typeof useQuizSessionStore>
  let progressStore: ReturnType<typeof useUserProgressStore>

  beforeEach(() => {
    store = useQuizSessionStore()
    store.resetSession()
    progressStore = useUserProgressStore()
    progressStore.byExamCode = {}
  })

  it('shows a not-found state without a finished session', () => {
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    expect(wrapper.find('.review--not-found').exists()).toBe(true)
    expect(wrapper.find('.banner--passed').exists()).toBe(false)
  })

  it('shows a pass banner when the result is a pass', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q1', ['B'])
    store.answerQuestion('q2', ['A', 'C'])
    store.answerQuestion('q3', ['A'])
    store.finishSession({ percentCorrect: 100, passed: true, timesCorrect: 3, totalAnswered: 3, projectedScaledScore: 1000 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    expect(wrapper.find('.banner--passed').exists()).toBe(true)
    expect(wrapper.find('.banner--failed').exists()).toBe(false)
  })

  it('shows a fail banner when the result is a fail', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q1', ['A'])
    store.finishSession({ percentCorrect: 0, passed: false, timesCorrect: 0, totalAnswered: 1 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    expect(wrapper.find('.banner--failed').exists()).toBe(true)
  })

  it('renders projected scaled score and disclaimer when scale is present', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q1', ['B'])
    store.finishSession({ percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1, projectedScaledScore: 1000 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    expect(wrapper.find('.score-card__scaled').text()).toContain('Projected scaled score: 1000 / 1000')
    expect(wrapper.find('.score-card__disclaimer').exists()).toBe(true)
  })

  it('omits projected scaled score when scale is absent', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q1', ['B'])
    store.finishSession({ percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    expect(wrapper.find('.score-card__scaled').exists()).toBe(false)
  })

  it('renders one breakdown row per topic with correct counts', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q1', ['B'])
    store.answerQuestion('q2', ['A'])
    store.answerQuestion('q3', ['A'])
    store.finishSession({ percentCorrect: 67, passed: false, timesCorrect: 2, totalAnswered: 3 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    const labels = wrapper.findAll('.breakdown__label').map((el) => el.text())
    expect(labels).toContain('Security')
    expect(labels).toContain('Deployment')
  })

  it('renders one summary card per question', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q1', ['B'])
    store.finishSession({ percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    expect(wrapper.findAll('.summary-card')).toHaveLength(3)
  })

  it('shows the detail panel when a card is selected', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q1', ['B'])
    store.finishSession({ percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    expect(wrapper.find('.detail-panel__content').exists()).toBe(true)
    expect(wrapper.find('.detail-panel__question').text()).toContain('Q1?')
    await wrapper.findAll('.summary-card')[2].trigger('click')
    expect(wrapper.find('.detail-panel__question').text()).toContain('Q3?')
  })

  it('toggles selection when clicking the same card twice', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q1', ['B'])
    store.finishSession({ percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    const card = wrapper.findAll('.summary-card')[2]
    await card.trigger('click')
    expect(wrapper.find('.detail-panel__question').text()).toContain('Q3?')
    await card.trigger('click')
    expect(wrapper.find('.detail-panel__content').exists()).toBe(false)
  })

  it('shows the correct answer badge in the detail panel', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q1', ['A'])
    store.finishSession({ percentCorrect: 0, passed: false, timesCorrect: 0, totalAnswered: 1 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    expect(wrapper.find('.badge--status-incorrect').exists()).toBe(true)
  })

  it('shows explanation in the detail panel when present', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q3', ['A'])
    store.finishSession({ percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    await wrapper.findAll('.summary-card')[2].trigger('click')
    expect(wrapper.find('.detail-panel__explanation').text()).toContain('Because.')
  })

  it('toggles the flag when the flag button is clicked', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q1', ['B'])
    store.finishSession({ percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    await wrapper.find('.btn--secondary').trigger('click')
    expect(progressStore.isFlagged('TEST', 'q1')).toBe(true)
  })

  it('navigates to home when the CTA is clicked', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, makeQuestions(), undefined)
    store.answerQuestion('q1', ['B'])
    store.finishSession({ percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 })

    await router.push('/certs/TEST/quiz/review')
    const wrapper = mount(QuizReviewView, { global: { plugins: [pinia, router] } })
    await wrapper.find('.btn--primary').trigger('click')
    expect(store.hasSession).toBe(false)
  })
})
