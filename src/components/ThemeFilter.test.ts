import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { ThemeGroupFilter } from '../types'
import ThemeFilter from './ThemeFilter.vue'

const base: ThemeGroupFilter = { values: [], match: 'all' }

function mountGroup(modelValue: ThemeGroupFilter = base, matchChoice = false) {
  return mount(ThemeFilter, {
    props: { label: 'services', values: ['lambda', 's3'], modelValue, matchChoice },
  })
}

let wrapper!: ReturnType<typeof mount>

beforeEach(() => {
  wrapper?.unmount()
  wrapper = mountGroup()
})

afterEach(() => { wrapper?.unmount() })

describe('ThemeFilter', () => {
  it('emits the added value when a checkbox is checked', async () => {
    await wrapper.findAll('input[type="checkbox"]')[0].setValue(true)

    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ values: ['lambda'], match: 'all' })
  })

  it('emits the removed value when a checkbox is unchecked', async () => {
    wrapper?.unmount()
    wrapper = mountGroup({ values: ['lambda'], match: 'any' })

    await wrapper.findAll('input[type="checkbox"]')[0].setValue(false)

    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ values: [], match: 'any' })
  })

  it('emits the match mode when a radio is picked', async () => {
    wrapper?.unmount()
    wrapper = mountGroup({ values: [], match: 'any' }, true)
    const radios = wrapper.findAll('input[type="radio"]')

    await radios[1].setValue(true)

    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ values: [], match: 'all' })
  })

  it('hides the any/all radios when matchChoice is false', () => {
    expect(wrapper.find('.match-choice').exists()).toBe(false)
  })

  it('disables checkboxes for values listed in disabledValues', () => {
    wrapper?.unmount()
    wrapper = mount(ThemeFilter, {
      props: {
        label: 'services',
        values: ['lambda', 's3'],
        modelValue: base,
        matchChoice: false,
        disabledValues: ['lambda'],
      },
    })

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect(checkboxes[0].attributes('disabled')).toBeDefined()
    expect(checkboxes[1].attributes('disabled')).toBeUndefined()
  })

  it('checks the All checkbox by default when allOption is set', () => {
    wrapper?.unmount()
    wrapper = mount(ThemeFilter, {
      props: { label: 'topics', values: ['Security', 'Deployment'], modelValue: base, matchChoice: false, allOption: true },
    })

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(true)
  })

  it('unticks All once a value is selected', () => {
    wrapper?.unmount()
    wrapper = mount(ThemeFilter, {
      props: { label: 'topics', values: ['Security', 'Deployment'], modelValue: { values: ['Security'], match: 'any' }, matchChoice: false, allOption: true },
    })

    const checkboxes = wrapper.findAll('input[type="checkbox"]')
    expect((checkboxes[0].element as HTMLInputElement).checked).toBe(false)
    expect((checkboxes[1].element as HTMLInputElement).checked).toBe(true)
  })

  it('emits an empty selection when All is clicked', async () => {
    wrapper?.unmount()
    wrapper = mount(ThemeFilter, {
      props: { label: 'topics', values: ['Security', 'Deployment'], modelValue: { values: ['Security'], match: 'any' }, matchChoice: false, allOption: true },
    })

    await wrapper.findAll('input[type="checkbox"]')[0].setValue(true)

    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ values: [], match: 'any' })
  })

  it('keeps its match radios checked independently of same-label instances', () => {
    const Host = defineComponent({
      setup() {
        return () =>
          h('div', [
            h(ThemeFilter, { label: 'services', values: ['lambda'], modelValue: { values: [], match: 'any' }, matchChoice: true }),
            h(ThemeFilter, { label: 'services', values: ['lambda'], modelValue: { values: [], match: 'any' }, matchChoice: true }),
          ])
      },
    })
    wrapper?.unmount()
    wrapper = mount(Host)

    const matchChoices = wrapper.findAll('.match-choice')
    const names = matchChoices.flatMap((choice) =>
      choice.findAll('input[type="radio"]').map((radio) => radio.attributes('name')),
    )
    const anyRadios = matchChoices.map((choice) => choice.findAll('input[type="radio"]')[0])

    expect(names).toHaveLength(4)
    expect(names[0]).toBe(names[1])
    expect(names[2]).toBe(names[3])
    expect(names[0]).not.toBe(names[2])
    expect((anyRadios[0].element as HTMLInputElement).checked).toBe(true)
    expect((anyRadios[1].element as HTMLInputElement).checked).toBe(true)
  })
})
