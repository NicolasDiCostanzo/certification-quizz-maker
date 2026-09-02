import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import TimerBar from './TimerBar.vue'

describe('TimerBar', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('formats minutes and seconds when under an hour', () => {
    const deadline = Date.now() + 90_000
    const wrapper = mount(TimerBar, { props: { deadlineAt: deadline } })
    expect(wrapper.find('.timer-value').text()).toBe('1:30')
  })

  it('formats hours, minutes, and seconds when over an hour', () => {
    const deadline = Date.now() + 3_661_000
    const wrapper = mount(TimerBar, { props: { deadlineAt: deadline } })
    expect(wrapper.find('.timer-value').text()).toBe('1:01:01')
  })

  it('applies the low-time class in the final minute', () => {
    const deadline = Date.now() + 30_000
    const wrapper = mount(TimerBar, { props: { deadlineAt: deadline } })
    expect(wrapper.find('.timer--low').exists()).toBe(true)
  })

  it('emits time-up when the deadline passes', async () => {
    const deadline = Date.now() + 1_000
    const wrapper = mount(TimerBar, { props: { deadlineAt: deadline } })
    vi.advanceTimersByTime(1_500)
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.emitted('time-up')).toBeTruthy()
  })

  it('shows zero after the deadline', () => {
    const deadline = Date.now() - 1_000
    const wrapper = mount(TimerBar, { props: { deadlineAt: deadline } })
    expect(wrapper.find('.timer-value').text()).toBe('0:00')
  })

  it('emits time-up immediately when mounted with an already-expired deadline', () => {
    const deadline = Date.now() - 1_000
    const wrapper = mount(TimerBar, { props: { deadlineAt: deadline } })
    expect(wrapper.emitted('time-up')).toBeTruthy()
  })

  it('restarts the timer when the deadline is replaced', async () => {
    const firstDeadline = Date.now() + 10_000
    const wrapper = mount(TimerBar, { props: { deadlineAt: firstDeadline } })
    expect(wrapper.find('.timer-value').text()).toBe('0:10')

    await wrapper.setProps({ deadlineAt: Date.now() + 20_000 })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.timer-value').text()).toBe('0:20')
  })

  it('emits time-up when the replaced deadline is already expired', async () => {
    const firstDeadline = Date.now() + 10_000
    const wrapper = mount(TimerBar, { props: { deadlineAt: firstDeadline } })
    expect(wrapper.emitted('time-up')).toBeFalsy()

    await wrapper.setProps({ deadlineAt: Date.now() - 1_000 })
    expect(wrapper.emitted('time-up')?.length).toBe(1)
  })

  it('stops the timer when the deadline is removed', async () => {
    const deadline = Date.now() + 10_000
    const wrapper = mount(TimerBar, { props: { deadlineAt: deadline } })
    expect(wrapper.find('.timer-value').text()).toBe('0:10')

    await wrapper.setProps({ deadlineAt: undefined })
    vi.advanceTimersByTime(5_000)
    await vi.advanceTimersByTimeAsync(0)
    expect(wrapper.find('.timer-value').text()).toBe('0:00')
  })
})
