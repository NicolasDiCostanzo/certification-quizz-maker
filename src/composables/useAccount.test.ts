import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Mock } from 'vitest'
import { createApp } from 'vue'
import { useRouter } from 'vue-router'
import * as auth from '../services/auth'
import type { RemoteSyncPayload } from '../services/remoteSync'
import { texts } from '../texts/en'
import { useQuizHistoryStore } from '../stores/quizHistory'
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

const historyEntry = {
  id: 'h1',
  certCode: 'DVA-C02',
  mode: 'preparation' as const,
  startedAt: 1,
  finishedAt: 2,
  questionIds: ['q1'],
  answers: {},
  flags: [],
  result: { percentCorrect: 100, passed: true, timesCorrect: 1, totalAnswered: 1 },
}

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
    history: { format: 'quiz-history', version: 1, exportedAt, entries: [historyEntry] },
  }
}

function seedDeviceData() {
  const progressStore = useUserProgressStore()
  progressStore.byExamCode['DVA-C02'] = {
    qDev: { questionId: 'qDev', attempts: 3, timesCorrect: 1, timesWrong: 2, flagged: true, lastSeenAt: 999 },
  }
  const historyStore = useQuizHistoryStore()
  historyStore.entries.push({
    id: 'hDev',
    certCode: 'DVA-C02',
    mode: 'exam',
    startedAt: 10,
    finishedAt: 20,
    questionIds: ['qDev'],
    answers: {},
    flags: ['qDev'],
    result: { percentCorrect: 0, passed: false, timesCorrect: 0, totalAnswered: 1 },
  })
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
  it('replaces device data with the account data pulled from the backend and never pushes at sign-in', async () => {
    seedDeviceData()
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockResolvedValue(makePayload())

    await useAccount().signIn('dev@example.com', 'Passw0rd!')

    const account = useUserAccountStore()
    expect(account.user).toEqual(USER)
    expect(account.accountMode).toBe('account')
    expect(adapter.pull).toHaveBeenCalledOnce()
    expect(adapter.push).not.toHaveBeenCalled()

    const progressStore = useUserProgressStore()
    expect(progressStore.byExamCode['DVA-C02']?.q1?.attempts).toBe(1)
    expect(progressStore.byExamCode['DVA-C02']?.qDev).toBeUndefined()
    expect(useQuizHistoryStore().entries).toEqual([historyEntry])

    expect(account.guestProgress).not.toBeNull()
    expect(account.guestHistory?.entries.map((e) => e.id)).toEqual(['hDev'])
    expect(pushRoute).toHaveBeenCalledWith({ name: 'cert-selector' })
  })

  it('a failed sign-in leaves the account untouched and navigates nowhere', async () => {
    vi.mocked(auth.signIn).mockRejectedValue(new Error('NotAuthorizedException'))

    await expect(useAccount().signIn('dev@example.com', 'wrong')).rejects.toThrow()

    expect(useUserAccountStore().accountMode).toBeNull()
    expect(adapter.pull).not.toHaveBeenCalled()
    expect(pushRoute).not.toHaveBeenCalled()
  })

  it('a failing pull clears the stores and reports syncError without blocking sign-in', async () => {
    seedDeviceData()
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockRejectedValue(new Error('offline'))

    const { signIn, syncError } = useAccount()
    await signIn('dev@example.com', 'Passw0rd!')

    expect(syncError.value).toBe(texts.syncFailed)
    expect(useUserAccountStore().accountMode).toBe('account')
    expect(useUserProgressStore().byExamCode).toEqual({})
    expect(useQuizHistoryStore().entries).toEqual([])
    expect(pushRoute).toHaveBeenCalledWith({ name: 'cert-selector' })
  })

  it('signing in while already signed in does not overwrite the guest snapshot', async () => {
    seedDeviceData()
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockResolvedValue(makePayload())
    const { signIn } = useAccount()
    await signIn('dev@example.com', 'Passw0rd!')

    const progressStore = useUserProgressStore()
    progressStore.byExamCode['DVA-C02'] = {
      qAccount: { questionId: 'qAccount', attempts: 1, timesCorrect: 0, timesWrong: 1, flagged: false, lastSeenAt: 50 },
    }
    await signIn('dev@example.com', 'Passw0rd!')

    const account = useUserAccountStore()
    expect(account.guestProgress?.byExamCode['DVA-C02']?.qDev).toBeDefined()
    expect(account.guestProgress?.byExamCode['DVA-C02']?.qAccount).toBeUndefined()
  })

  it('a failing push is reported through syncError', async () => {
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockResolvedValue(null)
    adapter.push.mockRejectedValue(new Error('offline'))

    const { signIn, pushLocalData, syncError } = useAccount()
    await signIn('dev@example.com', 'Passw0rd!')
    await pushLocalData()

    expect(syncError.value).toBe(texts.syncFailed)
    expect(useUserAccountStore().accountMode).toBe('account')
  })

  it('push is a no-op when not signed in to an account', async () => {
    await useAccount().continueLocal()
    seedDeviceData()

    await useAccount().pushLocalData()

    expect(adapter.push).not.toHaveBeenCalled()
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

describe('useAccount guest migration', () => {
  it('upload merges guest and remote data, pushes the union and discards the guest snapshot', async () => {
    seedDeviceData()
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockResolvedValue(makePayload())
    adapter.push.mockResolvedValue(undefined)

    await useAccount().signIn('dev@example.com', 'Passw0rd!', { migrateGuest: true })

    const progressStore = useUserProgressStore()
    expect(progressStore.byExamCode['DVA-C02']?.qDev?.attempts).toBe(3)
    expect(progressStore.byExamCode['DVA-C02']?.q1?.attempts).toBe(1)
    expect(useQuizHistoryStore().entries.map((e) => e.id).sort()).toEqual(['h1', 'hDev'])
    expect(adapter.push).toHaveBeenCalledOnce()
    expect(useUserAccountStore().guestProgress).toBeNull()
  })

  it('migration keeps the newest lastSeenAt version of a question present on both sides', async () => {
    const progressStore = useUserProgressStore()
    progressStore.byExamCode['DVA-C02'] = {
      q1: { questionId: 'q1', attempts: 3, timesCorrect: 1, timesWrong: 2, flagged: true, lastSeenAt: 999 },
    }
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockResolvedValue({
      ...makePayload(),
      progress: {
        format: 'quiz-progress',
        version: 1,
        exportedAt: new Date().toISOString(),
        byExamCode: {
          'DVA-C02': { q1: { questionId: 'q1', attempts: 9, timesCorrect: 9, timesWrong: 0, flagged: false, lastSeenAt: 1 } },
        },
      },
    })
    adapter.push.mockResolvedValue(undefined)

    await useAccount().signIn('dev@example.com', 'Passw0rd!', { migrateGuest: true })

    expect(progressStore.byExamCode['DVA-C02']?.q1?.attempts).toBe(3)
  })

  it('a failed pull during migration keeps the guest data in place and never pushes', async () => {
    seedDeviceData()
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockRejectedValue(new Error('offline'))

    const { signIn, syncError } = useAccount()
    await signIn('dev@example.com', 'Passw0rd!', { migrateGuest: true })

    expect(syncError.value).toBe(texts.syncFailed)
    expect(useUserProgressStore().byExamCode['DVA-C02']?.qDev?.attempts).toBe(3)
    expect(useUserAccountStore().guestProgress).not.toBeNull()
    expect(adapter.push).not.toHaveBeenCalled()
  })
})

describe('useAccount session ends', () => {
  it('signing out restores the guest snapshot captured at sign-in', async () => {
    seedDeviceData()
    vi.mocked(auth.signIn).mockResolvedValue(USER)
    adapter.pull.mockResolvedValue(makePayload())
    const { signIn, signOut } = useAccount()
    await signIn('dev@example.com', 'Passw0rd!')

    await signOut()

    const progressStore = useUserProgressStore()
    expect(progressStore.byExamCode['DVA-C02']?.qDev?.attempts).toBe(3)
    expect(progressStore.byExamCode['DVA-C02']?.q1).toBeUndefined()
    expect(useQuizHistoryStore().entries.map((e) => e.id)).toEqual(['hDev'])
    expect(useUserAccountStore().guestProgress).toBeNull()
  })

  it('signing out with no guest snapshot clears the stores', async () => {
    vi.mocked(auth.signOut).mockResolvedValue(undefined)
    const accountStore = useUserAccountStore()
    accountStore.user = USER
    accountStore.accountMode = 'account'
    useUserProgressStore().byExamCode['DVA-C02'] = {
      qAccount: { questionId: 'qAccount', attempts: 1, timesCorrect: 1, timesWrong: 0, flagged: false, lastSeenAt: 1 },
    }

    await useAccount().signOut()

    expect(useUserProgressStore().byExamCode).toEqual({})
    expect(useQuizHistoryStore().entries).toEqual([])
  })

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