import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '../router'
import { useUserProgressStore } from '../stores/userProgress'
import { texts } from '../texts/en'

vi.mock('../composables/useQuizLoader', async () => {
  const { validCertBundle } = await import('../utils/fixtures/certBundle.fixture')
  return {
    useQuizLoader: () => ({
      availableCerts: [validCertBundle],
      certLoadIssues: {},
      getCert: (code: string) => (code === 'FIX-001' ? validCertBundle : undefined),
      activePool: (code: string) => (code === 'FIX-001' ? validCertBundle.questions : []),
    }),
  }
})

import QuizConfigureView from './QuizConfigureView.vue'

const mountView = async (
  seedProgress?: (store: ReturnType<typeof useUserProgressStore>) => void,
) => {
  await router.push('/certs/FIX-001/configure')
  await router.isReady()
  const pinia = createPinia()
  setActivePinia(pinia)
  if (seedProgress) seedProgress(useUserProgressStore())
  const wrapper = mount(QuizConfigureView, { global: { plugins: [router, pinia] } })
  return wrapper
}

beforeEach(async () => {
  await router.push('/')
})

describe('QuizConfigureView', () => {
  it('renders the exam name in the title', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('h1').text()).toContain('Fixture Certification')
    wrapper.unmount()
  })

  it('splits the configuration into quick setup and filter sections', async () => {
    const wrapper = await mountView()
    const cards = wrapper.findAll('.config-card')

    expect(cards).toHaveLength(2)
    expect(cards[0].find('.section-title').text()).toBe(texts.quickSetupLabel)
    expect(cards[1].find('.section-title').text()).toBe(texts.filterQuestionsLabel)
    expect(wrapper.find('.topics-section').exists()).toBe(true)
    expect(wrapper.find('.include-section').exists()).toBe(true)
    expect(wrapper.find('.exclude-section').exists()).toBe(true)
    expect(wrapper.find('.include-section .match-row').classes()).toContain('match-row--disabled')

    const includeDetails = wrapper.find('details.include-section')
    const excludeDetails = wrapper.find('details.exclude-section')
    expect(includeDetails.attributes('open')).toBeUndefined()
    expect(excludeDetails.attributes('open')).toBeUndefined()
    expect(includeDetails.find('summary').text()).toBe(texts.includeLabel)
    expect(excludeDetails.find('summary').text()).toBe(texts.excludeLabel)
    wrapper.unmount()
  })

  it('displays localized labels for known theme groups', async () => {
    const wrapper = await mountView()
    const headings = wrapper
      .find('.include-section')
      .findAll('.group-label')
      .map((heading) => heading.text())

    expect(headings).toEqual([texts.services, texts.concepts])
    wrapper.unmount()
  })

  it('disables the match-groups pills until two groups have selections', async () => {
    const wrapper = await mountView()
    const includeCheckboxes = wrapper.find('.include-section').findAll('input[type="checkbox"]')
    const matchRow = () => wrapper.find('.include-section .match-row')

    expect(matchRow().classes()).toContain('match-row--disabled')

    await includeCheckboxes[0].setValue(true)
    expect(matchRow().classes()).toContain('match-row--disabled')

    await includeCheckboxes[2].setValue(true)
    expect(matchRow().classes()).not.toContain('match-row--disabled')
    expect(matchRow().attributes('aria-label')).toBe(texts.matchGroupsLabel)

    const pills = wrapper.findAll('.include-section .match-row input[type="radio"]')
    expect(pills).toHaveLength(2)
    expect(wrapper.findAll('.include-section .match-row .pill').map((pill) => pill.text())).toEqual([
      texts.matchAllGroups,
      texts.matchAnyGroups,
    ])
    expect((pills[1].element as HTMLInputElement).checked).toBe(true)
    expect((pills[0].element as HTMLInputElement).checked).toBe(false)

    await pills[0].setValue(true)

    expect((pills[0].element as HTMLInputElement).checked).toBe(true)
    expect((pills[1].element as HTMLInputElement).checked).toBe(false)
    wrapper.unmount()
  })

  it('previews the matching question count', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('.match-preview').text()).toContain('2 questions match your filters')
    wrapper.unmount()
  })

  it('updates the preview from a theme include checkbox', async () => {
    const wrapper = await mountView()
    const include = wrapper.find('.include-section')
    const lambdaCheckbox = include.findAll('input[type="checkbox"]')[0]

    await lambdaCheckbox.setValue(true)
    expect(wrapper.find('.match-preview').text()).toContain('1 question match')

    const s3Checkbox = include.findAll('input[type="checkbox"]')[1]
    await s3Checkbox.setValue(true)
    expect(wrapper.find('.match-preview').text()).toContain('1 question match')

    const servicesGroup = include.findAll('.filter-group')[0]
    const matchAllRadio = servicesGroup.findAll('input[type="radio"]')[1]
    await matchAllRadio.setValue(true)
    expect(wrapper.find('.match-preview').text()).toContain('No question matches')
    wrapper.unmount()
  })

  it('disables exclude checkboxes for values selected in include', async () => {
    const wrapper = await mountView()

    await wrapper.find('.include-section').findAll('input[type="checkbox"]')[0].setValue(true)

    const excludeCheckboxes = wrapper.find('.exclude-section').findAll('input[type="checkbox"]')
    expect(excludeCheckboxes[0].attributes('disabled')).toBeDefined()
    expect(excludeCheckboxes[1].attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('keeps the filter questions card folded by default', async () => {
    const wrapper = await mountView()
    const filters = wrapper.find('details.filters-card')

    expect(filters.exists()).toBe(true)
    expect(filters.attributes('open')).toBeUndefined()
    expect(filters.find('summary').text()).toBe(texts.filterQuestionsLabel)
    wrapper.unmount()
  })

  it('ticks the topics All option by default and unticks it when a topic is picked', async () => {
    const wrapper = await mountView()
    const topics = wrapper.find('.topics-section')
    const checkboxes = topics.findAll('input[type="checkbox"]')

    expect(checkboxes).toHaveLength(3)
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)

    await checkboxes[1].setValue(true)

    expect((topics.findAll('input[type="checkbox"]')[0].element as HTMLInputElement).checked).toBe(false)
    expect(wrapper.find('.match-preview').text()).toContain('1 question match')
    wrapper.unmount()
  })

  it('re-ticks All when every picked topic is removed', async () => {
    const wrapper = await mountView()
    const topics = wrapper.find('.topics-section')
    const checkboxes = topics.findAll('input[type="checkbox"]')

    await checkboxes[1].setValue(true)
    await topics.findAll('input[type="checkbox"]')[1].setValue(false)

    expect((topics.findAll('input[type="checkbox"]')[0].element as HTMLInputElement).checked).toBe(true)
    expect(wrapper.find('.match-preview').text()).toContain('2 questions match')
    wrapper.unmount()
  })

  it('applies topic filters to the preview', async () => {
    const wrapper = await mountView()

    await wrapper.find('.topics-section input[type="checkbox"]').setValue(true)
    await wrapper.findAll('.topics-section input[type="checkbox"]')[1].setValue(true)

    expect(wrapper.find('.match-preview').text()).toContain('1 question match')
    wrapper.unmount()
  })

  it.each([
    { mode: 'wrong', expected: 'No question matches' },
    { mode: 'flagged', expected: 'No question matches' },
    { mode: 'unattempted', expected: '2 questions match' },
  ] as { mode: string; expected: string }[])('replay mode $mode previews $expected', async ({ mode, expected }) => {
    const wrapper = await mountView()
    const radios = wrapper.findAll('input[name="replay-mode"]')
    const index = ['all', 'wrong', 'flagged', 'unattempted'].indexOf(mode)

    await radios[index].setValue(true)

    expect(wrapper.find('.match-preview').text()).toContain(expected)
    wrapper.unmount()
  })

  it('applies stored progress to the replay preview', async () => {
    const wrapper = await mountView((store) => {
      store.recordAnswer('FIX-001', 'q1', false)
      store.toggleFlag('FIX-001', 'q2')
    })
    const radios = wrapper.findAll('input[name="replay-mode"]')

    await radios[1].setValue(true)
    expect(wrapper.find('.match-preview').text()).toContain('1 question match')

    await radios[2].setValue(true)
    expect(wrapper.find('.match-preview').text()).toContain('1 question match')

    await radios[3].setValue(true)
    expect(wrapper.find('.match-preview').text()).toContain('1 question match')
    wrapper.unmount()
  })

  it('shows the custom count input only when custom mode is selected', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('.count-input').exists()).toBe(false)

    await wrapper.findAll('input[name="count-mode"]')[1].setValue(true)

    expect(wrapper.find('.count-input').exists()).toBe(true)
    expect(wrapper.find('.count-input').attributes('max')).toBe('2')
    wrapper.unmount()
  })

  it('enables the start CTA once questions match the filters', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('.start-cta').attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('disables the start CTA when no question matches the filters', async () => {
    const wrapper = await mountView()

    await wrapper.find('.include-section').findAll('input[type="checkbox"]')[0].setValue(true)
    await wrapper.find('.include-section').findAll('input[type="checkbox"]')[1].setValue(true)
    const matchAllRadio = wrapper.find('.include-section').findAll('.filter-group')[0].findAll('input[type="radio"]')[1]
    await matchAllRadio.setValue(true)

    expect(wrapper.find('.match-preview').text()).toContain('No question matches')
    expect(wrapper.find('.start-cta').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})
