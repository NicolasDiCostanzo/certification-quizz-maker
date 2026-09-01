import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RequestNotice from './RequestNotice.vue'

describe('RequestNotice', () => {
  it('points at the GitHub issue tracker', () => {
    const wrapper = mount(RequestNotice)

    expect(wrapper.text()).toContain('open a GitHub issue')
    expect(wrapper.find('a').attributes('href')).toBe(
      'https://github.com/NicolasDiCostanzo/dva-c02-quizz/issues/new',
    )
  })
})
