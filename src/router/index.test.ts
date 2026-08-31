import { beforeEach, describe, expect, it } from 'vitest'
import { useQuizLoader } from '../composables/useQuizLoader'
import { router } from './index'

describe('router', () => {
  beforeEach(async () => {
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
})
