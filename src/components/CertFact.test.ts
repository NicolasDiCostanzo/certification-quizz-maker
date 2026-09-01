import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CertFact from './CertFact.vue'

describe('CertFact', () => {
  it('renders its label and value as a description term/detail pair', () => {
    const wrapper = mount(CertFact, { props: { label: 'Real exam', value: '65 questions' } })

    expect(wrapper.find('dt').text()).toBe('Real exam')
    expect(wrapper.find('dd').text()).toBe('65 questions')
  })
})
