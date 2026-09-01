import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CertCard from './CertCard.vue'
import { router } from '../router'
import { validCertBundle } from '../utils/fixtures/certBundle.fixture'

describe('CertCard', () => {
  it('renders the exam name, code, and quiz-configure link', () => {
    const wrapper = mount(CertCard, {
      props: { cert: validCertBundle },
      global: { plugins: [router] },
    })

    expect(wrapper.classes()).toContain('cert-card')
    expect(wrapper.text()).toContain(validCertBundle.exam.name)
    expect(wrapper.find('.cert-code').text()).toBe(validCertBundle.exam.code)
    expect(wrapper.attributes('href')).toContain(`#/certs/${validCertBundle.exam.code}/configure`)
  })

  it('renders one weight pill per exam weight and the instructions', () => {
    const wrapper = mount(CertCard, {
      props: { cert: validCertBundle },
      global: { plugins: [router] },
    })

    const expectedWeights = Object.entries(validCertBundle.exam.weights!)
    expect(wrapper.findAll('.cert-weight-pill')).toHaveLength(expectedWeights.length)
    for (const [topic, weight] of expectedWeights) {
      expect(wrapper.text()).toContain(`${topic} ${weight}%`)
    }
    expect(wrapper.find('.cert-instructions').text()).toBe(validCertBundle.exam.instructions)
  })
})
