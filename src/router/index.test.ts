import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useQuizLoader } from '../composables/useQuizLoader'
import { useQuizSessionStore } from '../stores/quizSession'
import { router } from './index'
import type { Question } from '../types'

const sessionQuestions: Question[] = [
  { id: 'q1', question: 'Q1?', options: ['A', 'B'], answers: 'A', topic: 'Security' },
]

describe('router', () => {
  beforeEach(async () => {
    setActivePinia(createPinia())
    await router.push({ name: 'cert-selector' })
  })

  it('resolves / to the cert-selector home screen', async () => {
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('cert-selector')
  })

  it('lets navigation through for a built-in cert code', async () => {
    const { getCert } = useQuizLoader()
    expect(getCert('DVA-C02')).toBeDefined()

    await router.push('/certs/DVA-C02/configure')
    expect(router.currentRoute.value.name).toBe('quiz-configure')
    expect(router.currentRoute.value.params.certCode).toBe('DVA-C02')
  })

  it('redirects an unknown cert code back to the cert-selector home screen', async () => {
    await router.push('/certs/NOPE-01/quiz')
    expect(router.currentRoute.value.name).toBe('cert-selector')
  })

  it('does not interfere with routes that have no cert code', async () => {
    await router.push('/')
    expect(router.currentRoute.value.name).toBe('cert-selector')
  })

  it('redirects quiz-session to configure when no session is active', async () => {
    await router.push('/certs/DVA-C02/quiz')
    expect(router.currentRoute.value.name).toBe('quiz-configure')
    expect(router.currentRoute.value.params.certCode).toBe('DVA-C02')
  })

  it('redirects quiz-review to configure when no session is active', async () => {
    await router.push('/certs/DVA-C02/quiz/review')
    expect(router.currentRoute.value.name).toBe('quiz-configure')
    expect(router.currentRoute.value.params.certCode).toBe('DVA-C02')
  })

  it('redirects quiz-session to home when the cert code is not bundled', async () => {
    const session = useQuizSessionStore()
    session.startSession(
      'DVA-C02',
      { certCode: 'DVA-C02', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' },
      sessionQuestions,
      undefined,
    )

    await router.push('/certs/SAA-C03/quiz')
    expect(router.currentRoute.value.name).toBe('cert-selector')
  })

  it('lets navigation through to quiz-session when a session matches the cert code', async () => {
    const session = useQuizSessionStore()
    session.startSession(
      'DVA-C02',
      { certCode: 'DVA-C02', mode: 'preparation', includeMatchMode: 'or', replayMode: 'all', count: 'all' },
      sessionQuestions,
      undefined,
    )

    await router.push('/certs/DVA-C02/quiz')
    expect(router.currentRoute.value.name).toBe('quiz-session')
    expect(router.currentRoute.value.params.certCode).toBe('DVA-C02')
  })
})
