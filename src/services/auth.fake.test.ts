import { beforeEach, describe, expect, it } from 'vitest'
import { configureAuth, confirmPasswordReset, confirmSignUp, requestPasswordReset, resendSignUpCode, signIn, signOut, signUp } from './auth.fake'

beforeEach(() => {
  localStorage.clear()
})

describe('auth.fake', () => {
  it('signs up, confirms, then signs in with the same credentials', async () => {
    const needsConfirmation = await signUp('dev@example.com', 'Passw0rd!')
    expect(needsConfirmation).toBe(true)

    await confirmSignUp('dev@example.com', '123456')
    const user = await signIn('dev@example.com', 'Passw0rd!')

    expect(user).toEqual({ userId: expect.any(String), email: 'dev@example.com' })
  })

  it('rejects sign-in with the wrong password', async () => {
    await signUp('dev@example.com', 'Passw0rd!')
    await confirmSignUp('dev@example.com', '123456')

    await expect(signIn('dev@example.com', 'wrong')).rejects.toThrow()
  })

  it('rejects sign-in for an email that never signed up', async () => {
    await expect(signIn('nobody@example.com', 'Passw0rd!')).rejects.toThrow()
  })

  it('reports an unconfirmed account as needing confirmation rather than as a bad sign-in', async () => {
    await signUp('dev@example.com', 'Passw0rd!')

    const error = await signIn('dev@example.com', 'Passw0rd!').catch((err: Error) => err)

    expect(error).toBeInstanceOf(Error)
    expect((error as Error).name).toBe('UserNotConfirmedException')
  })

  it('rejects a second sign-up for an email that already exists, leaving the first account intact', async () => {
    await signUp('dev@example.com', 'Passw0rd!')

    const rejection = await signUp('dev@example.com', 'OtherPassw0rd!').catch((err: Error) => err)

    expect(rejection).toBeInstanceOf(Error)
    expect((rejection as Error).name).toBe('UsernameExistsException')

    await confirmSignUp('dev@example.com', '123456')
    await expect(signIn('dev@example.com', 'Passw0rd!')).resolves.toEqual({
      userId: expect.any(String),
      email: 'dev@example.com',
    })
  })

  it('rejects confirmation with an empty code', async () => {
    await signUp('dev@example.com', 'Passw0rd!')

    await expect(confirmSignUp('dev@example.com', '')).rejects.toThrow()
  })

  it('a password reset swaps the password while keeping the confirmed account usable', async () => {
    await signUp('dev@example.com', 'Passw0rd!')
    await confirmSignUp('dev@example.com', '123456')

    await requestPasswordReset('dev@example.com')
    await confirmPasswordReset('dev@example.com', '654321', 'NewPassw0rd!')

    await expect(signIn('dev@example.com', 'Passw0rd!')).rejects.toThrow()
    await expect(signIn('dev@example.com', 'NewPassw0rd!')).resolves.toEqual({
      userId: expect.any(String),
      email: 'dev@example.com',
    })
  })

  it.each([
    { case: 'an empty code', email: 'dev@example.com', code: '', password: 'NewPassw0rd!' },
    { case: 'an email that never signed up', email: 'nobody@example.com', code: '654321', password: 'NewPassw0rd!' },
  ])('rejects a reset with $case and leaves the old password in place', async ({ email, code, password }) => {
    await signUp('dev@example.com', 'Passw0rd!')
    await confirmSignUp('dev@example.com', '123456')

    await expect(confirmPasswordReset(email, code, password)).rejects.toThrow()
    await expect(signIn('dev@example.com', 'Passw0rd!')).resolves.toEqual({
      userId: expect.any(String),
      email: 'dev@example.com',
    })
  })

  it.each([
    { case: 'a reset request', call: () => requestPasswordReset('') },
    { case: 'a confirmation-code resend', call: () => resendSignUpCode('') },
  ])('rejects $case without an email address', async ({ call }) => {
    await expect(call()).rejects.toThrow()
  })

  it('sign-out resolves without throwing', async () => {
    await expect(signOut()).resolves.toBeUndefined()
  })

  it('configureAuth resolves true without needing real pool credentials', async () => {
    await expect(configureAuth()).resolves.toBe(true)
  })

  it('exports every function the real auth service exposes, so the E2E swap cannot miss an API', async () => {
    const functionsOf = (module: object) =>
      Object.entries(module)
        .filter(([, value]) => typeof value === 'function')
        .map(([name]) => name)
        .sort()

    const [fake, real] = await Promise.all([import('./auth.fake'), import('./auth')])

    expect(functionsOf(fake)).toEqual(functionsOf(real))
  })
})
