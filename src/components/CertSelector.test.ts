import { mount, type DOMWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useQuizLoader } from '../composables/useQuizLoader'
import { router } from '../router'
import { texts } from '../texts/en'
import CertSelector from './CertSelector.vue'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('CertSelector', () => {
  function mountSelector() {
    const { availableCerts } = useQuizLoader()
    const wrapper = mount(CertSelector, {
      props: { certs: availableCerts },
      global: { plugins: [router] },
    })
    return { availableCerts, wrapper }
  }

  function findCardByExamCode(cards: DOMWrapper<Element>[], examCode: string) {
    return cards.find((card) => card.find('.cert-code').text() === examCode)
  }

  it('renders one card per built-in cert with its exam facts', () => {
    const { availableCerts, wrapper } = mountSelector()
    expect(availableCerts.length).toBeGreaterThan(0)

    const cards = wrapper.findAll('.cert-card')
    expect(cards).toHaveLength(availableCerts.length)

    for (const cert of availableCerts) {
      const card = findCardByExamCode(cards, cert.exam.code)
      expect(card, `card for ${cert.exam.code}`).toBeDefined()
      expect(card!.text()).toContain(cert.exam.name)
      expect(card!.text()).toContain(String(cert.questions.length))
      expect(card!.text()).toContain(texts.realExamValue(cert.exam.totalQuestions))
      expect(card!.text()).toContain(texts.timeLimitValue(cert.exam.timeLimitMinutes))
      expect(card!.text()).toContain(formatExpectedPassingScore(cert.exam.passingScore))
    }
  })

  it('breaks down the exam weights per topic', () => {
    const { availableCerts, wrapper } = mountSelector()
    const cards = wrapper.findAll('.cert-card')

    for (const cert of availableCerts) {
      if (!cert.exam.weights) continue
      const weights = findCardByExamCode(cards, cert.exam.code)!
        .findAll('.cert-weights li')
        .map((li) => li.text())
      const expected = Object.entries(cert.exam.weights).map(([topic, weight]) => `${topic} ${weight}%`)
      expect(weights, `weights for ${cert.exam.code}`).toEqual(expected)
    }
  })

  it('shows the exam instructions on the card', () => {
    const { wrapper } = mountSelector()

    expect(wrapper.find('.cert-instructions').exists()).toBe(true)
  })

  it('links each card to the quiz-configure route of its cert', () => {
    const { availableCerts, wrapper } = mountSelector()
    const cards = wrapper.findAll('.cert-card')

    for (const cert of availableCerts) {
      const href = findCardByExamCode(cards, cert.exam.code)!.attributes('href')
      expect(href).toContain(`#/certs/${cert.exam.code}/configure`)
    }
  })

  it('renders the empty state when no certs are provided', () => {
    const wrapper = mount(CertSelector, { props: { certs: [] } })

    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(wrapper.find('.cert-grid').exists()).toBe(false)
  })

  it('shows the request-a-cert notice pointing at the GitHub issue tracker', () => {
    const { wrapper } = mountSelector()

    const notice = wrapper.find('.request-notice')
    expect(notice.text()).toContain('open a GitHub issue')
    expect(notice.find('a').attributes('href')).toBe(
      'https://github.com/NicolasDiCostanzo/dva-c02-quizz/issues/new',
    )
  })
})

function formatExpectedPassingScore(passingScore: { passingScore: number; scale?: number }): string {
  if (passingScore.scale === undefined) return `${passingScore.passingScore}%`
  const percent = Math.round((passingScore.passingScore / passingScore.scale) * 100)
  return `${passingScore.passingScore} / ${passingScore.scale} (${percent}%)`
}
