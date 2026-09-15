import { beforeEach, describe, expect, it } from 'vitest'
import { configureAuth, confirmSignUp, signIn, signOut, signUp } from './auth.fake'

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

  it('rejects sign-in before the account is confirmed', async () => {
    await signUp('dev@example.com', 'Passw0rd!')

    await expect(signIn('dev@example.com', 'Passw0rd!')).rejects.toThrow()
  })

  it('rejects confirmation with an empty code', async () => {
    await signUp('dev@example.com', 'Passw0rd!')

    await expect(confirmSignUp('dev@example.com', '')).rejects.toThrow()
  })

  it('sign-out resolves without throwing', async () => {
    await expect(signOut()).resolves.toBeUndefined()
  })

  it('configureAuth resolves true without needing real pool credentials', async () => {
    await expect(configureAuth()).resolves.toBe(true)
  })
})
