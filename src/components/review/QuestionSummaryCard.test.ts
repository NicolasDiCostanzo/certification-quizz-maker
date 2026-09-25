import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuestionSummaryCard from './QuestionSummaryCard.vue'

const mountCard = (overrides: Record<string, boolean>) =>
  mount(QuestionSummaryCard, { props: { questionId: 'q1', index: 1, correct: true, flagged: false, selected: false, ...overrides } })

describe('QuestionSummaryCard', () => {
  it('emits select with the question id on click', async () => {
    const wrapper = mountCard({ correct: true, flagged: false, selected: false })
    await wrapper.trigger('click')
    expect(wrapper.emitted('select')).toEqual([['q1']])
  })

  it('reflects the selected prop as a data attribute', () => {
    expect(mountCard({ correct: true, flagged: false, selected: true }).attributes('data-selected')).toBe('true')
    expect(mountCard({ correct: true, flagged: false, selected: false }).attributes('data-selected')).toBe('false')
  })

  it('reflects the correct prop as a data attribute', () => {
    expect(mountCard({ correct: true, flagged: false, selected: false }).attributes('data-correct')).toBe('true')
    expect(mountCard({ correct: false, flagged: false, selected: false }).attributes('data-correct')).toBe('false')
  })

  it('shows a flag icon when flagged', () => {
    const flagged = mountCard({ correct: true, flagged: true, selected: false })
    expect(flagged.find('svg').exists()).toBe(true)

    const unflagged = mountCard({ correct: true, flagged: false, selected: false })
    expect(unflagged.find('svg').exists()).toBe(false)
  })
})
