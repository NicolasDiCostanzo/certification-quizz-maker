import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CertCodeBadge from './CertCodeBadge.vue'

describe('CertCodeBadge', () => {
  it('renders the exam code', () => {
    const wrapper = mount(CertCodeBadge, { props: { code: 'DVA-C02' } })

    expect(wrapper.classes()).toContain('cert-code')
    expect(wrapper.text()).toBe('DVA-C02')
  })
})
