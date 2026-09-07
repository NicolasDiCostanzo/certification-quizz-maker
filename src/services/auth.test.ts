import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchAuthSession } from 'aws-amplify/auth'
import { checkSessionStatus } from './auth'

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: vi.fn(),
}))

function setOnline(online: boolean) {
  Object.defineProperty(window.navigator, 'onLine', { value: online, configurable: true })
}

beforeEach(() => {
  vi.clearAllMocks()
  setOnline(true)
})

describe('checkSessionStatus', () => {
  it('reports valid when the session tokens are present', async () => {
    vi.mocked(fetchAuthSession).mockResolvedValue({ tokens: { accessToken: {}, idToken: {} } } as never)

    await expect(checkSessionStatus()).resolves.toBe('valid')
  })

  it('reports invalid when no tokens exist, e.g. the user was signed out locally', async () => {
    vi.mocked(fetchAuthSession).mockResolvedValue({ tokens: undefined } as never)

    await expect(checkSessionStatus()).resolves.toBe('invalid')
  })

  it('reports invalid when the check fails while the device is online, e.g. a revoked refresh token', async () => {
    vi.mocked(fetchAuthSession).mockRejectedValue(new Error('NotAuthorizedException'))

    await expect(checkSessionStatus()).resolves.toBe('invalid')
  })

  it('reports unknown when the check fails while the device is offline', async () => {
    setOnline(false)
    vi.mocked(fetchAuthSession).mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(checkSessionStatus()).resolves.toBe('unknown')
  })
})