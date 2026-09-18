import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { texts } from '../texts/en'
import AuthView from './AuthView.vue'

const signUp = vi.fn()
const confirmSignUp = vi.fn()
const resendConfirmationCode = vi.fn()
const requestPasswordReset = vi.fn()
const confirmPasswordReset = vi.fn()
const signIn = vi.fn()

vi.mock('../composables/useAccount', () => ({
  useAccount: () => ({
    signUp,
    confirmSignUp,
    resendConfirmationCode,
    requestPasswordReset,
    confirmPasswordReset,
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

  it('a weak password on sign-up surfaces the password requirement message', async () => {
    query = { mode: 'signup' }
    signUp.mockRejectedValue(Object.assign(new Error('Password did not conform with policy'), { name: 'InvalidPasswordException' }))

    const wrapper = await fillAndSubmit('dev@example.com', 'weak')

    expect(wrapper.find('[role="alert"]').text()).toBe(texts.authWeakPasswordError)
  })

  it('a non-password sign-up failure keeps the generic sign-up error', async () => {
    query = { mode: 'signup' }
    signUp.mockRejectedValue(new Error('UsernameExistsException'))

    const wrapper = await fillAndSubmit('dev@example.com', 'Passw0rd!')

    expect(wrapper.find('[role="alert"]').text()).toBe(texts.authSignUpError)
  })

  it('the switch link flips between sign-in and sign-up', async () => {
    const wrapper = mount(AuthView)

    await wrapper.find('.auth__switch').trigger('click')

    expect(wrapper.text()).toContain(texts.authSignUpTitle)
  })

  it('the forgot-password link requests a reset for the entered email and advances to the code step', async () => {
    requestPasswordReset.mockResolvedValue(undefined)
    const wrapper = mount(AuthView)

    await wrapper.find('input[type="email"]').setValue('dev@example.com')
    await wrapper.findAll('.auth-link').at(0)?.trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(requestPasswordReset).toHaveBeenCalledWith('dev@example.com')
    expect(wrapper.text()).toContain(texts.authResetConfirmTitle)
  })

  it('a failed reset request keeps the email step and surfaces the error', async () => {
    requestPasswordReset.mockRejectedValue(new Error('UserNotFoundException'))
    const wrapper = mount(AuthView)

    await wrapper.find('input[type="email"]').setValue('dev@example.com')
    await wrapper.findAll('.auth-link').at(0)?.trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain(texts.authResetTitle)
    expect(wrapper.find('[role="alert"]').text()).toBe(texts.authResetRequestError)
  })

  it('confirming the reset sets the new password and signs in with the stored credentials', async () => {
    requestPasswordReset.mockResolvedValue(undefined)
    confirmPasswordReset.mockResolvedValue(undefined)
    const wrapper = mount(AuthView)

    await wrapper.find('input[type="email"]').setValue('dev@example.com')
    await wrapper.findAll('.auth-link').at(0)?.trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    await wrapper.find('input[autocomplete="one-time-code"]').setValue('654321')
    await wrapper.find('input[autocomplete="new-password"]').setValue('NewPassw0rd!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(confirmPasswordReset).toHaveBeenCalledWith('dev@example.com', '654321', 'NewPassw0rd!', { migrateGuest: false })
  })

  it('a weak new password surfaces the password requirement message on reset confirmation', async () => {
    requestPasswordReset.mockResolvedValue(undefined)
    const codeRejection = Object.assign(new Error('Password did not conform with policy'), {
      name: 'InvalidPasswordException',
    })
    confirmPasswordReset.mockRejectedValue(codeRejection)
    const wrapper = mount(AuthView)

    await wrapper.find('input[type="email"]').setValue('dev@example.com')
    await wrapper.findAll('.auth-link').at(0)?.trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    await wrapper.find('input[autocomplete="one-time-code"]').setValue('654321')
    await wrapper.find('input[autocomplete="new-password"]').setValue('weak')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe(texts.authWeakPasswordError)
  })

  it('a failed reset confirmation stays on the code step with the reset error', async () => {
    requestPasswordReset.mockResolvedValue(undefined)
    confirmPasswordReset.mockRejectedValue(new Error('ExpiredCodeException'))
    const wrapper = mount(AuthView)

    await wrapper.find('input[type="email"]').setValue('dev@example.com')
    await wrapper.findAll('.auth-link').at(0)?.trigger('click')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    await wrapper.find('input[autocomplete="one-time-code"]').setValue('654321')
    await wrapper.find('input[autocomplete="new-password"]').setValue('NewPassw0rd!')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain(texts.authResetConfirmTitle)
    expect(wrapper.find('[role="alert"]').text()).toBe(texts.authResetConfirmError)
  })

  it('the confirmation step offers a resend that reports its outcome without leaving the step', async () => {
    query = { mode: 'signup' }
    signUp.mockResolvedValue(true)
    resendConfirmationCode.mockResolvedValue(undefined)
    const wrapper = await fillAndSubmit('dev@example.com', 'Passw0rd!')

    await wrapper.findAll('.auth-link').at(0)?.trigger('click')
    await flushPromises()

    expect(resendConfirmationCode).toHaveBeenCalledWith('dev@example.com')
    expect(wrapper.text()).toContain(texts.authCodeResent)
    expect(wrapper.text()).toContain(texts.authConfirmTitle)
  })

  it('a failed resend reports the resend error without leaving the confirmation step', async () => {
    query = { mode: 'signup' }
    signUp.mockResolvedValue(true)
    resendConfirmationCode.mockRejectedValue(new Error('LimitExceededException'))
    const wrapper = await fillAndSubmit('dev@example.com', 'Passw0rd!')

    await wrapper.findAll('.auth-link').at(0)?.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe(texts.authResendError)
    expect(wrapper.text()).toContain(texts.authConfirmTitle)
  })

  it('a sign-in for an unconfirmed account moves to the code step and verifies with the password already typed', async () => {
    signIn.mockRejectedValue(Object.assign(new Error('sign-in did not complete'), { name: 'UserNotConfirmedException' }))
    const wrapper = await fillAndSubmit('dev@example.com', 'Passw0rd!')

    expect(wrapper.text()).toContain(texts.authConfirmTitle)
    expect(wrapper.text()).toContain(texts.authUnconfirmedNotice)

    await wrapper.find('input[autocomplete="one-time-code"]').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(confirmSignUp).toHaveBeenCalledWith('dev@example.com', '123456', 'Passw0rd!', { migrateGuest: false })
  })

  it('a duplicate sign-up resends the code and moves to the code step', async () => {
    query = { mode: 'signup' }
    signUp.mockRejectedValue(Object.assign(new Error('User already exists'), { name: 'UsernameExistsException' }))
    signIn.mockRejectedValue(Object.assign(new Error('sign-in did not complete'), { name: 'UserNotConfirmedException' }))
    resendConfirmationCode.mockResolvedValue(undefined)

    const wrapper = await fillAndSubmit('dev@example.com', 'Passw0rd!')

    expect(resendConfirmationCode).toHaveBeenCalledWith('dev@example.com')
    expect(wrapper.text()).toContain(texts.authConfirmTitle)
    expect(wrapper.text()).toContain(texts.authCodeResent)
  })

  it('a duplicate sign-up for an account that is already confirmed lands on the code step like a new sign-up, without naming the conflict', async () => {
    query = { mode: 'signup' }
    signUp.mockRejectedValue(Object.assign(new Error('User already exists'), { name: 'UsernameExistsException' }))
    signIn.mockRejectedValue(Object.assign(new Error('Incorrect username or password.'), { name: 'NotAuthorizedException' }))

    const wrapper = await fillAndSubmit('dev@example.com', 'Passw0rd!')

    expect(wrapper.text()).toContain(texts.authConfirmTitle)
    expect(wrapper.find('input[autocomplete="one-time-code"]').exists()).toBe(true)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(resendConfirmationCode).not.toHaveBeenCalled()
  })

  it('the never-confirmed link resends the code and opens the code step without a password', async () => {
    resendConfirmationCode.mockResolvedValue(undefined)
    const wrapper = mount(AuthView)

    await wrapper.find('input[type="email"]').setValue('dev@example.com')
    await wrapper.findAll('.auth-link').at(1)?.trigger('click')
    await flushPromises()

    expect(resendConfirmationCode).toHaveBeenCalledWith('dev@example.com')
    expect(wrapper.text()).toContain(texts.authConfirmTitle)
    expect(wrapper.text()).toContain(texts.authCodeResent)
  })

  it('a failed resend from the sign-in form keeps the sign-in form and reports the error', async () => {
    resendConfirmationCode.mockRejectedValue(new Error('LimitExceededException'))
    const wrapper = mount(AuthView)

    await wrapper.find('input[type="email"]').setValue('dev@example.com')
    await wrapper.findAll('.auth-link').at(1)?.trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain(texts.authSignInTitle)
    expect(wrapper.find('[role="alert"]').text()).toBe(texts.authResendError)
  })

  it('a confirmation that verifies the account but cannot sign in falls back to the sign-in form', async () => {
    query = { mode: 'signup' }
    signUp.mockResolvedValue(true)
    confirmSignUp.mockRejectedValue(
      Object.assign(new Error('sign-in did not complete'), { name: 'ConfirmAutoSignInError' }),
    )
    const wrapper = await fillAndSubmit('dev@example.com', 'Passw0rd!')

    await wrapper.find('input[autocomplete="one-time-code"]').setValue('123456')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(wrapper.text()).toContain(texts.authSignInTitle)
    expect(wrapper.find('[role="status"]').text()).toBe(texts.authConfirmCompleted)
  })
})