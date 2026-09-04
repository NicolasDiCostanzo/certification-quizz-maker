import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { texts } from '../texts/en'
import type { QuizHistoryEntry } from '../types'
import QuizHistoryItem from './QuizHistoryItem.vue'

function makeEntry(overrides: Partial<QuizHistoryEntry> = {}): QuizHistoryEntry {
  return {
    id: 'DVA-C02-1',
    certCode: 'DVA-C02',
    mode: 'exam',
    startedAt: Date.now(),
    finishedAt: Date.now() + 5 * 60_000,
    questions: [],
    answers: {},
    flags: [],
    result: { percentCorrect: 80, passed: true, timesCorrect: 8, totalAnswered: 10 },
    ...overrides,
  }
}

describe('QuizHistoryItem', () => {
  it('shows the completion duration when the timestamps are usable', () => {
    const wrapper = mount(QuizHistoryItem, { props: { entry: makeEntry() } })
    expect(wrapper.text()).toContain(texts.completedIn('5 min'))
  })

  it('hides the completion duration when the timestamps are inconsistent', () => {
    const wrapper = mount(QuizHistoryItem, {
      props: { entry: makeEntry({ startedAt: 2000, finishedAt: 1000 }) },
    })
    expect(wrapper.find('.entry-duration').exists()).toBe(false)
  })

  it('emits requestDelete with the entry id', async () => {
    const wrapper = mount(QuizHistoryItem, { props: { entry: makeEntry() } })
    await wrapper.find('.btn--danger').trigger('click')
    expect(wrapper.emitted('requestDelete')).toEqual([['DVA-C02-1']])
  })
})
