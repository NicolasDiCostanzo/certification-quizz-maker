import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { router } from '../router'

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

const mountView = async () => {
  await router.push('/certs/FIX-001/configure')
  await router.isReady()
  const wrapper = mount(QuizConfigureView, { global: { plugins: [router] } })
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

  it('applies topic filters to the preview', async () => {
    const wrapper = await mountView()

    await wrapper.find('.topics-section input[type="checkbox"]').setValue(true)

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

  it('shows the custom count input only when custom mode is selected', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('.count-input').exists()).toBe(false)

    await wrapper.findAll('input[name="count-mode"]')[1].setValue(true)

    expect(wrapper.find('.count-input').exists()).toBe(true)
    expect(wrapper.find('.count-input').attributes('max')).toBe('2')
    wrapper.unmount()
  })

  it('keeps the start CTA disabled until the session store lands', async () => {
    const wrapper = await mountView()

    expect(wrapper.find('.start-cta').attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})
