import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import type { ThemeGroupFilter } from '../types'
import ThemeFilterGroup from './ThemeFilterGroup.vue'

const base: ThemeGroupFilter = { values: [], match: 'all' }

function mountGroup(modelValue: ThemeGroupFilter = base, matchChoice = false) {
  return mount(ThemeFilterGroup, {
    props: { label: 'services', values: ['lambda', 's3'], modelValue, matchChoice },
  })
}

describe('ThemeFilterGroup', () => {
  it('renders the inner filter with the group values and label', () => {
    const wrapper = mountGroup()

    expect(wrapper.find('[role="group"]').attributes('aria-label')).toBe('services')
    expect(wrapper.findAll('input[type="checkbox"]')).toHaveLength(2)
    expect(wrapper.text()).toContain('lambda')
  })

  it('hides the any/all radios when matchChoice is false', () => {
    const wrapper = mountGroup()

    expect(wrapper.findAll('input[type="radio"]')).toHaveLength(0)
  })

  it('re-emits value updates from the inner filter', async () => {
    const wrapper = mountGroup()

    await wrapper.findAll('input[type="checkbox"]')[0].setValue(true)

    expect(wrapper.emitted('update:modelValue')![0][0]).toEqual({ values: ['lambda'], match: 'all' })
  })

  it('passes disabledValues through to the inner filter', () => {
    const wrapper = mount(ThemeFilterGroup, {
      props: {
        label: 'services',
        values: ['lambda', 's3'],
        modelValue: base,
        matchChoice: false,
        disabledValues: ['lambda'],
      },
    })

    expect(wrapper.findAll('input[type="checkbox"]')[0].attributes('disabled')).toBeDefined()
  })
})


