import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FilterOption from './FilterOption.vue'

describe('FilterOption', () => {
  it('renders the input slot inside a filter-option label with the text', () => {
    const wrapper = mount(FilterOption, {
      props: { text: 'All matching (20)' },
      slots: { default: '<input type="radio" />' },
    })

    expect(wrapper.find('label').classes()).toContain('filter-option')
    expect(wrapper.find('input[type="radio"]').exists()).toBe(true)
    expect(wrapper.find('span').text()).toBe('All matching (20)')
  })
})
