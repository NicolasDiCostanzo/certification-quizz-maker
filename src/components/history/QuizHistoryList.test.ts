import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { QuizHistoryEntry } from '../../types'
import QuizHistoryList from './QuizHistoryList.vue'

const entry: QuizHistoryEntry = {
  id: 'h1',
  certCode: 'DVA-C02',
  mode: 'preparation',
  startedAt: 0,
  finishedAt: 1,
  questionIds: ['q1'],
  answers: {},
  flags: [],
  result: { percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 },
}

describe('QuizHistoryList', () => {
  it('emits review with the entry id instead of navigating itself', async () => {
    const wrapper = mount(QuizHistoryList, { props: { entries: [entry] } })

    await wrapper.findComponent({ name: 'QuizHistoryItem' }).vm.$emit('review')

    expect(wrapper.emitted('review')).toEqual([['h1']])
  })

  it('forwards requestDelete from the item', async () => {
    const wrapper = mount(QuizHistoryList, { props: { entries: [entry] } })

    await wrapper.findComponent({ name: 'QuizHistoryItem' }).vm.$emit('request-delete', 'h1')

    expect(wrapper.emitted('requestDelete')).toEqual([['h1']])
  })
})
