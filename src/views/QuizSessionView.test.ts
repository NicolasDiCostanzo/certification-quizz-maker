import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import QuizSessionView from './QuizSessionView.vue'
import { useQuizSessionStore } from '../stores/quizSession'
import { useUserProgressStore } from '../stores/userProgress'
import type { Question } from '../types'

function makeQuestions(n: number): Question[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `q${i + 1}`,
    question: `Question ${i + 1}`,
    options: ['A', 'B', 'C', 'D'],
    answers: 'B',
    topic: 't1',
  }))
}

const questions = makeQuestions(3)

const pinia = createPinia()
setActivePinia(pinia)

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'cert-selector', component: { template: '<div/>' } },
    { path: '/certs/:certCode/configure', name: 'quiz-configure', component: { template: '<div/>' } },
    { path: '/certs/:certCode/quiz', name: 'quiz-session', component: QuizSessionView },
    { path: '/certs/:certCode/quiz/review', name: 'quiz-review', component: { template: '<div/>' } },
  ],
})

vi.mock('../composables/useQuizLoader', () => ({
  useQuizLoader: () => ({
    getCert: () => ({
      exam: { name: 'Test', code: 'TEST', totalQuestions: 65, timeLimitMinutes: 130, passingScore: { passingScore: 700, scale: 1000 } },
    }),
  }),
}))

describe('QuizSessionView', () => {
  let store: ReturnType<typeof useQuizSessionStore>
  let progressStore: ReturnType<typeof useUserProgressStore>

  beforeEach(() => {
    store = useQuizSessionStore()
    store.resetSession()
    progressStore = useUserProgressStore()
    progressStore.byExamCode = {}
  })

  it('renders nothing without a session', () => {
    const wrapper = mount(QuizSessionView, { global: { plugins: [pinia, router] } })
    expect(wrapper.find('.session').exists()).toBe(false)
  })

  it('shows the question counter and hides the timer in preparation mode', () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, questions, undefined)
    const wrapper = mount(QuizSessionView, { global: { plugins: [pinia, router] } })
    expect(wrapper.text()).toContain('Question 1 of 3')
    expect(wrapper.findComponent({ name: 'TimerBar' }).exists()).toBe(false)
  })

  it('shows the timer in exam mode', () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'exam', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, questions, 130)
    const wrapper = mount(QuizSessionView, { global: { plugins: [pinia, router] } })
    expect(wrapper.findComponent({ name: 'TimerBar' }).exists()).toBe(true)
  })

  it('disables the previous button on the first question', () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, questions, undefined)
    const wrapper = mount(QuizSessionView, { global: { plugins: [pinia, router] } })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].attributes('disabled')).toBeDefined()
  })

  it('advances to the next question and shows finish on the last one', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, questions, undefined)
    const wrapper = mount(QuizSessionView, { global: { plugins: [pinia, router] } })
    await wrapper.find('input').setValue(true)
    await wrapper.findAll('button')[1].trigger('click')
    await wrapper.findAll('button')[3].trigger('click')
    expect(wrapper.text()).toContain('Question 2 of 3')
    await wrapper.find('input').setValue(true)
    await wrapper.findAll('button')[1].trigger('click')
    await wrapper.findAll('button')[3].trigger('click')
    expect(wrapper.text()).toContain('Finish quiz')
  })

  it('toggles the flag and shows the badge', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, questions, undefined)
    const wrapper = mount(QuizSessionView, { global: { plugins: [pinia, router] } })
    await wrapper.findAll('button')[2].trigger('click')
    expect(wrapper.text()).toContain('Flagged')
    expect(store.currentSession?.flags).toEqual(['q1'])
  })

  it('reveals feedback only after submitting in preparation mode', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, questions, undefined)
    const wrapper = mount(QuizSessionView, { global: { plugins: [pinia, router] } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.find('.feedback').exists()).toBe(false)
    await wrapper.findAll('button')[1].trigger('click')
    expect(wrapper.find('.feedback').exists()).toBe(true)
  })

  it('keeps the next button enabled in preparation mode regardless of submission', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, questions, undefined)
    const wrapper = mount(QuizSessionView, { global: { plugins: [pinia, router] } })
    const nextBtn = wrapper.findAll('button')[3]
    expect(nextBtn.attributes('disabled')).toBeUndefined()
    await wrapper.find('input').setValue(true)
    expect(nextBtn.attributes('disabled')).toBeUndefined()
    await wrapper.findAll('button')[1].trigger('click')
    expect(nextBtn.attributes('disabled')).toBeUndefined()
  })

  it('does not reveal feedback in exam mode', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'exam', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, questions, 130)
    const wrapper = mount(QuizSessionView, { global: { plugins: [pinia, router] } })
    await wrapper.find('input').setValue(true)
    expect(wrapper.find('.feedback').exists()).toBe(false)
  })

  it('finishes the session and redirects to review', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, questions, undefined)
    const wrapper = mount(QuizSessionView, { global: { plugins: [pinia, router] } })
    for (let i = 0; i < 3; i++) {
      await wrapper.find('input').setValue(true)
      await wrapper.findAll('button')[1].trigger('click')
      if (i < 2) await wrapper.findAll('button')[3].trigger('click')
    }
    await wrapper.findAll('button')[3].trigger('click')
    expect(store.currentSession?.finished).toBe(true)
    expect(store.currentSession?.result).toBeTruthy()
  })

  it('does not record answers again when finishQuiz is called on an already-finished session', async () => {
    store.startSession('TEST', { certCode: 'TEST', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' }, questions, undefined)
    const wrapper = mount(QuizSessionView, { global: { plugins: [pinia, router] } })

    for (let i = 0; i < 3; i++) {
      await wrapper.find('input').setValue(true)
      await wrapper.findAll('button')[1].trigger('click')
      if (i < 2) await wrapper.findAll('button')[3].trigger('click')
    }
    await wrapper.findAll('button')[3].trigger('click')
    expect(store.currentSession?.finished).toBe(true)

    const firstAttemptCount = progressStore.byExamCode['TEST']?.q1?.attempts ?? 0
    expect(firstAttemptCount).toBe(1)

    await wrapper.findAll('button')[3].trigger('click')

    expect(progressStore.byExamCode['TEST']?.q1?.attempts).toBe(firstAttemptCount)
  })
})
