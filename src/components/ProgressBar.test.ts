import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ProgressBar from './ProgressBar.vue'

describe('ProgressBar', () => {
  it('sets fill width from the value prop', () => {
    const wrapper = mount(ProgressBar, { props: { value: 75, passing: 70 } })
    expect(wrapper.find('.progress-bar__fill').attributes('style')).toContain('width: 75%')
  })

  it('marks the fill as passed when value meets the threshold', () => {
    const wrapper = mount(ProgressBar, { props: { value: 80, passing: 70 } })
    expect(wrapper.find('.progress-bar__fill').attributes('data-passed')).toBe('true')
  })

  it('marks the fill as not passed when value is below the threshold', () => {
    const wrapper = mount(ProgressBar, { props: { value: 50, passing: 70 } })
    expect(wrapper.find('.progress-bar__fill').attributes('data-passed')).toBe('false')
  })

  it('exposes progressbar semantics for assistive tech', () => {
    const wrapper = mount(ProgressBar, { props: { value: 42, passing: 70 } })
    const track = wrapper.find('[role="progressbar"]')
    expect(track.exists()).toBe(true)
    expect(track.attributes('aria-valuenow')).toBe('42')
    expect(track.attributes('aria-valuemin')).toBe('0')
    expect(track.attributes('aria-valuemax')).toBe('100')
  })
})
