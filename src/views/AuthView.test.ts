import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { texts } from '../texts/en'
import AuthView from './AuthView.vue'

const signUp = vi.fn()
const confirmSignUp = vi.fn()
const signIn = vi.fn()

vi.mock('../composables/useAccount', () => ({
  useAccount: () => ({
    signUp,
    confirmSignUp,
    signIn,
    signOut: vi.fn(),
    continueLocal: vi.fn(),
    syncError: ref(null),
  }),
}))

let query: Record<string, unknown> = {}
vi.mock('vue-router', () => ({
  useRoute: () => ({ query }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  query = {}
})

async function fillAndSubmit(email: string, password: string) {
  const wrapper = mount(AuthView)
  await wrapper.find('input[type="email"]').setValue(email)
  await wrapper.find('input[type="password"]').setValue(password)
  await wrapper.find('form').trigger('submit')
  await flushPromises()
  return wrapper
}

describe('AuthView', () => {
  it('renders the sign-in form by default', () => {
    const wrapper = mount(AuthView)

    expect(wrapper.text()).toContain(texts.authSignInTitle)
    expect(wrapper.text()).toContain(texts.authSignInCta)
  })

  it('renders the sign-up form when the route query asks for signup', () => {
    query = { mode: 'signup' }
    const wrapper = mount(AuthView)

    expect(wrapper.text()).toContain(texts.authSignUpTitle)
    expect(wrapper.text()).toContain(texts.authSignUpCta)
  })

  it('a new account that requires confirmation moves to the code step without signing in', async () => {
    query = { mode: 'signup' }
    signUp.mockResolvedValue(true)

    const wrapper = await fillAndSubmit('dev@example.com', 'Passw0rd!')

    expect(signUp).toHaveBeenCalledWith('dev@example.com', 'Passw0rd!')
    expect(signIn).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain(texts.authConfirmTitle)
    expect(wrapper.find('input[autocomplete="one-time-code"]').exists()).toBe(true)
  })

  it('confirming the code verifies the account with the credentials entered earlier', async () => {
    query = { mode: 'signup' }
    signUp.mockResolvedValue(true)
    const wrapper = await fillAndSubmit('dev@example.com', 'Passw0rd!')

    await wrapper.find('input[autocomplete="one-time-code"]').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(confirmSignUp).toHaveBeenCalledWith('dev@example.com', '123456', 'Passw0rd!', { migrateGuest: false })
  })

  it('a sign-up that completes without confirmation goes straight to sign-in', async () => {
    query = { mode: 'signup' }
    signUp.mockResolvedValue(false)
    signIn.mockResolvedValue({ userId: 'sub-1', email: 'dev@example.com' })

    await fillAndSubmit('dev@example.com', 'Passw0rd!')

    expect(signIn).toHaveBeenCalledWith('dev@example.com', 'Passw0rd!', { migrateGuest: false })
  })

  it('the upload flag requests guest migration after authentication', async () => {
    query = { upload: '1' }
    signIn.mockResolvedValue({ userId: 'sub-1', email: 'dev@example.com' })

    const wrapper = await fillAndSubmit('dev@example.com', 'Passw0rd!')

    expect(signIn).toHaveBeenCalledWith('dev@example.com', 'Passw0rd!', { migrateGuest: true })
    expect(wrapper.text()).toContain(texts.authUploadHint)
  })

  it('a failed sign-in surfaces the error message', async () => {
    signIn.mockRejectedValue(new Error('NotAuthorizedException'))

    const wrapper = await fillAndSubmit('dev@example.com', 'wrong')

    expect(wrapper.find('[role="alert"]').text()).toBe(texts.authSignInError)
  })

  it('the switch link flips between sign-in and sign-up', async () => {
    const wrapper = mount(AuthView)

    await wrapper.find('.auth__switch').trigger('click')

    expect(wrapper.text()).toContain(texts.authSignUpTitle)
  })
})