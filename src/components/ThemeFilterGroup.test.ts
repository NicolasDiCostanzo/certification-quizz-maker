import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { ThemeGroupFilter } from '../types'
import { texts } from '../texts/en'
import ThemeFilterGroup from './ThemeFilterGroup.vue'

const base: ThemeGroupFilter = { values: [], match: 'all' }

function mountGroup(modelValue: ThemeGroupFilter = base, matchChoice = false) {
  return mount(ThemeFilterGroup, {
    props: { label: 'services', values: ['lambda', 's3'], modelValue, matchChoice },
  })
}

describe('ThemeFilterGroup', () => {
  it('renders a checkbox per value with the group label', () => {
    const wrapper = mountGroup()

    expect(wrapper.find('[role="group"]').attributes('aria-label')).toBe('services')
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('lambda')
  })

  it('emits the added value when a checkbox is checked', async () => {
    const wrapper = mountGroup()

    await wrapper.findAll('input[type="checkbox"]')[0].setValue(true)

    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ values: ['lambda'], match: 'all' })
  })

  it('emits the removed value when a checkbox is unchecked', async () => {
    const wrapper = mountGroup({ values: ['lambda'], match: 'any' })

    await wrapper.findAll('input[type="checkbox"]')[0].setValue(false)

    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ values: [], match: 'any' })
  })

  it('emits the match mode when a radio is picked', async () => {
    const wrapper = mountGroup({ values: [], match: 'any' }, true)
    const radios = wrapper.findAll('input[type="radio"]')

    expect(radios).toHaveLength(2)
    await radios[1].setValue(true)

    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ values: [], match: 'all' })
    expect(wrapper.text()).toContain(texts.matchAny)
  })

  it('hides the any/all radios when matchChoice is false', () => {
    const wrapper = mountGroup()

    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(0)
  })
})
