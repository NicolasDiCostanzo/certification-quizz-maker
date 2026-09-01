import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WeightPill from './WeightPill.vue'

describe('WeightPill', () => {
  it('renders the topic with its weight percentage', () => {
    const wrapper = mount(WeightPill, { props: { topic: 'Deployment', weight: 24 } })

    expect(wrapper.classes()).toContain('cert-weight-pill')
    expect(wrapper.text()).toBe('Deployment 24%')
  })
})
