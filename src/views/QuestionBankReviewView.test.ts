import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { useUserProgressStore } from '../stores/userProgress'
import type { Question, QuizHistoryEntry } from '../types'
import QuestionBankReviewView from './QuestionBankReviewView.vue'

vi.mock('../composables/useQuizLoader', () => ({
  useQuizLoader: () => ({
    getCert: () => ({
      version: 1,
      exam: { name: 'Test', code: 'TEST', totalQuestions: 2, timeLimitMinutes: 10, passingScore: { passingScore: 700, scale: 1000 } },
      themes: { services: ['lambda', 's3'] },
      questions: [
        { id: 'q1', question: 'Q1?', options: ['A', 'B'], answers: 'A', topic: 'Security', themes: { services: ['lambda'] } },
        { id: 'q2', question: 'Q2?', options: ['A', 'B'], answers: 'B', topic: 'Deployment', themes: { services: ['s3'] } },
        { id: 'q3', question: 'Q3?', options: ['A', 'B'], answers: 'A', topic: '100% coverage', themes: { services: ['lambda'] } },
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
    { path: '/certs/:certCode', name: 'quiz-dashboard', component: { template: '<div/>' } },
    { path: '/certs/:certCode/flagged', name: 'flagged-review', component: QuestionBankReviewView, props: true },
    { path: '/certs/:certCode/topic/:topic', name: 'topic-review', component: QuestionBankReviewView, props: true },
    { path: '/certs/:certCode/theme/:themeGroup/:themeValue', name: 'theme-review', component: QuestionBankReviewView, props: true },
  ],
})

function makeQuestion(id: string): Question {
  return { id, question: `${id.toUpperCase()}?`, options: ['A', 'B'], answers: 'A', topic: 'Security', themes: { services: ['lambda'] } }
}

describe('QuestionBankReviewView', () => {
  it('flagged review lists bank-flagged questions even when they appear in no history entry', async () => {
    const progressStore = useUserProgressStore()
    progressStore.byExamCode['TEST'] = {
      q1: { questionId: 'q1', attempts: 1, timesCorrect: 0, timesWrong: 1, flagged: true, lastSeenAt: 1 },
    }
    const historyStore = useQuizHistoryStore()
    const entry: QuizHistoryEntry = {
      id: 'e1',
      certCode: 'TEST',
      mode: 'preparation',
      startedAt: 1,
      finishedAt: 2,
      questions: [makeQuestion('q2')],
      answers: { q2: { selected: ['A'], correct: true, answeredAt: 1 } },
      flags: [],
      result: { percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 },
    }
    historyStore.entries.push(entry)

    await router.push('/certs/TEST/flagged')
    const wrapper = mount(QuestionBankReviewView, {
      global: { plugins: [pinia, router] },
      props: { certCode: 'TEST' },
    })

    expect(wrapper.find('.review--not-found').exists()).toBe(false)
    expect(wrapper.findAll('.summary-card')).toHaveLength(1)
    expect(wrapper.find('.detail-panel__question').text()).toContain('Q1?')
  })

  it('topic review handles encoded topic params containing a literal percent', async () => {
    const historyStore = useQuizHistoryStore()
    const entry: QuizHistoryEntry = {
      id: 'e1',
      certCode: 'TEST',
      mode: 'preparation',
      startedAt: 1,
      finishedAt: 2,
      questions: [
        { id: 'q3', question: 'Q3?', options: ['A', 'B'], answers: 'A', topic: '100% coverage', themes: { services: ['lambda'] } },
      ],
      answers: { q3: { selected: ['A'], correct: true, answeredAt: 1 } },
      flags: [],
      result: { percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 },
    }
    historyStore.entries.push(entry)

    await router.push('/certs/TEST/topic/100%25%20coverage')
    const wrapper = mount({ template: '<router-view />' }, { global: { plugins: [pinia, router] } })

    expect(wrapper.find('.review--not-found').exists()).toBe(false)
    expect(wrapper.find('.review__header h1').text()).toContain('Topic: 100% coverage')
    expect(wrapper.findAll('.summary-card')).toHaveLength(1)
    expect(wrapper.find('.detail-panel__question').text()).toContain('Q3?')
  })
})
