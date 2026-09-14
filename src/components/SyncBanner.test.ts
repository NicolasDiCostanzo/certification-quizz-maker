import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { texts } from '../texts/en'
import SyncBanner from './SyncBanner.vue'

describe('SyncBanner', () => {
  it('shows the message and calls onDismiss when the dismiss button is clicked', async () => {
    const onDismiss = vi.fn()
    const wrapper = mount(SyncBanner, { props: { message: 'Something went wrong', onDismiss } })

    expect(wrapper.find('.sync-banner__message').text()).toBe('Something went wrong')

    const dismissButton = wrapper.find('.sync-banner__dismiss')
    expect(dismissButton.attributes('aria-label')).toBe(texts.dismiss)
    await dismissButton.trigger('click')
    expect(onDismiss).toHaveBeenCalledOnce()
  })
})
