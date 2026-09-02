import { nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { texts } from '../texts/en'
import CountPicker from './CountPicker.vue'

function mountPicker(modelValue: number | 'all' = 'all', max = 20) {
  return mount(CountPicker, { props: { max, modelValue } })
}

describe('CountPicker', () => {
  it('previews the matching count on the all option and hides the input', () => {
    const wrapper = mountPicker()

    expect(wrapper.text()).toContain(texts.countAll(20))
    expect(wrapper.find('.count-input').exists()).toBe(false)
  })

  it('shows a clamped custom input when custom mode is picked', async () => {
    const wrapper = mountPicker()

    await wrapper.findAll('input[name="count-mode"]')[1].setValue(true)

    expect(wrapper.emitted('update:modelValue')![0]).toEqual([1])

    const custom = mountPicker(5)
    expect(custom.find('.count-input').exists()).toBe(true)
    expect(custom.find('.count-input').attributes('max')).toBe('20')
  })

  it('clamps the custom count to the available maximum', async () => {
    const wrapper = mountPicker(5)
    const input = wrapper.find('.count-input')
    const inputElement = input.element as HTMLInputElement
    inputElement.value = '99'
    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')![0]).toEqual([20])
  })

  it('clamps the custom count to a minimum of one', async () => {
    const wrapper = mountPicker(5)
    const input = wrapper.find('.count-input')
    const inputElement = input.element as HTMLInputElement
    inputElement.value = '0'
    await input.trigger('change')

    expect(wrapper.emitted('update:modelValue')![0]).toEqual([1])
  })

  it('emits all when the all radio is picked from custom mode', async () => {
    const wrapper = mountPicker(5)

    await wrapper.findAll('input[name="count-mode"]')[0].setValue(true)

    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['all'])
  })

  it('emits all and hides the input when max is below one', () => {
    const wrapper = mountPicker(5, 0)

    expect(wrapper.find('.count-input').exists()).toBe(false)
    expect(wrapper.findAll('input[name="count-mode"]')[1].attributes('disabled')).toBeDefined()
  })

  it('resets a custom selection to all when max drops below one', async () => {
    const wrapper = mount(CountPicker, {
      props: { max: 20, modelValue: 5, 'onUpdate:modelValue': (v) => wrapper.setProps({ modelValue: v }) },
    })
    expect(wrapper.find('.count-input').exists()).toBe(true)

    await wrapper.setProps({ max: 0 })

    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['all'])
    expect(wrapper.find('.count-input').exists()).toBe(false)
  })

  it('clamps a custom selection to max when max drops below the current value', async () => {
    const wrapper = mount(CountPicker, {
      props: { max: 20, modelValue: 10, 'onUpdate:modelValue': (v) => wrapper.setProps({ modelValue: v }) },
    })

    await wrapper.setProps({ max: 5 })

    expect(wrapper.emitted('update:modelValue')![0]).toEqual([5])
  })

  it('emits all instead of a number from the custom radio change when max is below one', async () => {
    const wrapper = mountPicker(5, 0)

    wrapper.findAll('input[name="count-mode"]')[1].element.dispatchEvent(new Event('change'))
    await nextTick()

    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['all'])
  })
})
