import { enableAutoUnmount, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it } from 'vitest'
import ConfirmModal from './ConfirmModal.vue'

enableAutoUnmount(afterEach)

const props = {
  title: 'Delete quiz',
  message: 'Are you sure you want to delete this quiz?',
  confirmLabel: 'Delete',
  cancelLabel: 'Cancel',
}

describe('ConfirmModal', () => {
  it('exposes dialog semantics for assistive tech', () => {
    const wrapper = mount(ConfirmModal, { props })
    const dialog = wrapper.find('[role="dialog"]')
    expect(dialog.exists()).toBe(true)
    expect(dialog.attributes('aria-modal')).toBe('true')
    expect(dialog.attributes('aria-labelledby')).toBeTruthy()
  })

  it('emits cancel when the Escape key is pressed', () => {
    const wrapper = mount(ConfirmModal, { props, attachTo: document.body })
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    expect(wrapper.emitted('cancel')).toBeTruthy()
    wrapper.unmount()
  })

  it('emits cancel when clicking the overlay, and confirm/cancel from their buttons', async () => {
    const wrapper = mount(ConfirmModal, { props })
    await wrapper.find('.modal-overlay').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(1)

    await wrapper.find('.btn--secondary').trigger('click')
    expect(wrapper.emitted('cancel')).toHaveLength(2)

    await wrapper.find('.btn--primary').trigger('click')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })
})
