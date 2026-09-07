import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { createApp } from 'vue'
import { useRouter } from 'vue-router'
import * as auth from '../services/auth'
import type { RemoteSyncPayload } from '../services/remoteSync'
import { texts } from '../texts/en'
import { useUserAccountStore } from '../stores/userAccount'
import { useUserProgressStore } from '../stores/userProgress'
import type { AuthUser } from '../types'
import { useAccount } from './useAccount'

vi.mock('vue-router', async () => {
  const push = vi.fn().mockResolvedValue(undefined)
  return { useRouter: () => ({ push }) }
})

vi.mock('../services/auth', () => ({
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

const adapter = { pull: vi.fn(), push: vi.fn() }
vi.mock('../services/remoteSync', () => ({
  getSyncAdapter: () => adapter,
}))

const pushRoute = useRouter().push as Mock

const USER: AuthUser = { userId: 'sub-1', email: 'dev@example.com' }

function makePayload(): RemoteSyncPayload {
  const exportedAt = new Date().toISOString()
  return {
    progress: {
      format: 'quiz-progress',
      version: 1,
      exportedAt,
      byExamCode: {
        'DVA-C02': { q1: { questionId: 'q1', attempts: 1, timesCorrect: 1, timesWrong: 0, flagged: false, lastSeenAt: 1 } },
      },
    },
    history: { format: 'quiz-history', version: 1, exportedAt, entries: [] },
  }
}

beforeEach(() => {
  localStorage.clear()
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  createApp({ render: () => null }).use(pinia)
  setActivePinia(pinia)
  vi.clearAllMocks()
  pushRoute.mockResolvedValue(undefined)
})

describe('useAccount sign-in', () => {
  it('stores the user, switches to account mode, merges pulled data, pushes local data up and opens the cert selector', async () => {
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockResolvedValue(makePayload())
    adapter.push.mockResolvedValue(undefined)

    await useAccount().signIn('dev@example.com', 'Passw0rd!')

    const account = useUserAccountStore()
    expect(account.user).toEqual(USER)
    expect(account.accountMode).toBe('account')
    expect(adapter.pull).toHaveBeenCalledOnce()
    expect(adapter.push).toHaveBeenCalledWith(
      expect.objectContaining({
        progress: expect.objectContaining({ format: 'quiz-progress' }),
        history: expect.objectContaining({ format: 'quiz-history' }),
      }),
    )
    expect(useUserProgressStore().byExamCode['DVA-C02']?.q1?.attempts).toBe(1)
    expect(pushRoute).toHaveBeenCalledWith({ name: 'cert-selector' })
  })

  it('a failed sign-in leaves the account untouched and navigates nowhere', async () => {
    vi.mocked(auth.signIn).mockRejectedValue(new Error('NotAuthorizedException'))

    await expect(useAccount().signIn('dev@example.com', 'wrong')).rejects.toThrow()

    expect(useUserAccountStore().accountMode).toBeNull()
    expect(adapter.pull).not.toHaveBeenCalled()
    expect(pushRoute).not.toHaveBeenCalled()
  })

  it('a failing pull is reported through syncError without blocking sign-in', async () => {
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockRejectedValue(new Error('offline'))

    const { signIn, syncError } = useAccount()
    await signIn('dev@example.com', 'Passw0rd!')

    expect(syncError.value).toBe(texts.syncFailed)
    expect(useUserAccountStore().accountMode).toBe('account')
    expect(pushRoute).toHaveBeenCalledWith({ name: 'cert-selector' })
  })

  it('a failing push is reported through syncError without blocking sign-in', async () => {
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockResolvedValue(null)
    adapter.push.mockRejectedValue(new Error('offline'))

    const { signIn, syncError } = useAccount()
    await signIn('dev@example.com', 'Passw0rd!')

    expect(syncError.value).toBe(texts.syncFailed)
    expect(useUserAccountStore().accountMode).toBe('account')
  })
})

describe('useAccount sign-up', () => {
  it('reports whether email confirmation is required', async () => {
    vi.mocked(auth.signUp).mockResolvedValue(true)

    await expect(useAccount().signUp('dev@example.com', 'Passw0rd!')).resolves.toBe(true)
    expect(auth.signUp).toHaveBeenCalledWith('dev@example.com', 'Passw0rd!')
  })

  it('confirming the code signs the user in and completes authentication', async () => {
    vi.mocked(auth.confirmSignUp).mockResolvedValue(undefined)
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockResolvedValue(null)
    adapter.push.mockResolvedValue(undefined)

    await useAccount().confirmSignUp('dev@example.com', '123456', 'Passw0rd!')

    expect(auth.confirmSignUp).toHaveBeenCalledWith('dev@example.com', '123456')
    expect(auth.signIn).toHaveBeenCalledWith('dev@example.com', 'Passw0rd!')
    expect(useUserAccountStore().user).toEqual(USER)
    expect(useUserAccountStore().accountMode).toBe('account')
  })
})

describe('useAccount session ends', () => {
  it('signing out clears the account state and returns to the welcome screen', async () => {
    vi.mocked(auth.signOut).mockResolvedValue(undefined)
    const accountStore = useUserAccountStore()
    accountStore.user = USER
    accountStore.accountMode = 'account'

    await useAccount().signOut()

    expect(auth.signOut).toHaveBeenCalledOnce()
    expect(accountStore.user).toBeNull()
    expect(accountStore.accountMode).toBeNull()
    expect(pushRoute).toHaveBeenCalledWith({ name: 'welcome' })
  })

  it('a failed server sign-out still clears the local account and returns to the welcome screen', async () => {
    vi.mocked(auth.signOut).mockRejectedValue(new Error('network down'))
    const accountStore = useUserAccountStore()
    accountStore.user = USER
    accountStore.accountMode = 'account'

    const { signOut, syncError } = useAccount()
    await signOut()

    expect(syncError.value).toBe(texts.syncFailed)
    expect(accountStore.user).toBeNull()
    expect(accountStore.accountMode).toBeNull()
    expect(pushRoute).toHaveBeenCalledWith({ name: 'welcome' })
  })

  it('continuing locally never syncs and opens the cert selector', async () => {
    await useAccount().continueLocal()

    expect(useUserAccountStore().accountMode).toBe('local')
    expect(useUserAccountStore().user).toBeNull()
    expect(adapter.pull).not.toHaveBeenCalled()
    expect(adapter.push).not.toHaveBeenCalled()
    expect(pushRoute).toHaveBeenCalledWith({ name: 'cert-selector' })
  })
})