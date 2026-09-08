import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getSyncAdapter } from './remoteSync'

const fetchAuthSessionMock = vi.hoisted(() => vi.fn())

vi.mock('aws-amplify/auth', () => ({
  fetchAuthSession: fetchAuthSessionMock,
}))

vi.mock('../config', () => ({
  awsConfig: {
    region: 'eu-west-3',
    userPoolId: 'eu-west-3_TEST',
    userPoolClientId: 'client-id',
    syncApiUrl: 'https://sync.example.com/sync',
  },
  isAuthConfigured: () => true,
}))

const fetchMock = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', fetchMock)
})

describe('remote sync adapter', () => {
  const adapter = getSyncAdapter()

  it('pull sends the bearer token and returns the remote payload', async () => {
    fetchAuthSessionMock.mockResolvedValue({ tokens: { accessToken: 'token-1' } })
    const payload = {
      progress: { format: 'quiz-progress', version: 1, exportedAt: '', byExamCode: {} },
      history: null,
    }
    fetchMock.mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }))

    await expect(adapter.pull()).resolves.toEqual(payload)
    expect(fetchMock).toHaveBeenCalledWith('https://sync.example.com/sync', {
      headers: { Authorization: 'Bearer token-1' },
    })
  })

  it('pull rejects on a 401 response so an auth failure cannot act as an empty account', async () => {
    fetchAuthSessionMock.mockResolvedValue({ tokens: { accessToken: 'token-1' } })
    fetchMock.mockResolvedValue(new Response('', { status: 401 }))

    await expect(adapter.pull()).rejects.toThrow('sync pull failed: 401')
  })

  it('pull rejects when the auth session cannot be retrieved, without sending a tokenless request', async () => {
    fetchAuthSessionMock.mockRejectedValue(new Error('session expired'))
    fetchMock.mockResolvedValue(new Response('', { status: 401 }))

    await expect(adapter.pull()).rejects.toThrow('session expired')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('push sends the payload with the bearer token and throws on failure', async () => {
    fetchAuthSessionMock.mockResolvedValue({ tokens: { accessToken: 'token-1' } })
    fetchMock.mockResolvedValue(new Response('', { status: 200 }))

    const payload = { progress: null, history: null }
    await expect(adapter.push(payload)).resolves.toBeUndefined()
    expect(fetchMock).toHaveBeenCalledWith('https://sync.example.com/sync', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer token-1' },
      body: JSON.stringify(payload),
    })

    fetchMock.mockResolvedValue(new Response('', { status: 401 }))
    await expect(adapter.push(payload)).rejects.toThrow('sync push failed: 401')
  })
})