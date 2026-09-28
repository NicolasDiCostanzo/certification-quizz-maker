import { beforeEach, describe, expect, it, vi } from 'vitest'
import { restoreSession, signIn } from './auth'

const getCurrentUserMock = vi.hoisted(() => vi.fn())
const fetchUserAttributesMock = vi.hoisted(() => vi.fn())
const amplifySignInMock = vi.hoisted(() => vi.fn())

vi.mock('aws-amplify/auth', () => ({
  getCurrentUser: getCurrentUserMock,
  fetchUserAttributes: fetchUserAttributesMock,
  signIn: amplifySignInMock,
}))

beforeEach(() => {
  vi.clearAllMocks()
  getCurrentUserMock.mockResolvedValue({ userId: 'sub-1' })
  fetchUserAttributesMock.mockResolvedValue({ email: 'dev@example.com' })
  amplifySignInMock.mockResolvedValue({ isSignedIn: true })
})

describe('auth', () => {
  it('keeps the authenticated identity when the user attributes cannot be fetched', async () => {
    fetchUserAttributesMock.mockRejectedValue(new Error('network unreachable'))

    await expect(restoreSession()).resolves.toEqual({ userId: 'sub-1', email: null })
  })

  it('returns null only when there is no authenticated session', async () => {
    getCurrentUserMock.mockRejectedValue(new Error('not signed in'))

    await expect(restoreSession()).resolves.toBeNull()
  })

  it('signs in with a null email when the user attributes cannot be fetched', async () => {
    fetchUserAttributesMock.mockRejectedValue(new Error('network unreachable'))

    await expect(signIn('dev@example.com', 'Passw0rd!')).resolves.toEqual({ userId: 'sub-1', email: null })
  })
})