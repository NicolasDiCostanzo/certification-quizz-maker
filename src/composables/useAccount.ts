import { useRouter } from 'vue-router'
import * as auth from '../services/auth'
import type { RemoteSyncPayload } from '../services/remoteSync'
import { getSyncAdapter } from '../services/remoteSync'
import { syncError } from './useSync'
import { texts } from '../texts/en'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { useUserAccountStore } from '../stores/userAccount'
import { useUserProgressStore } from '../stores/userProgress'
import type { AuthUser } from '../types'

const PROGRESS_FORMAT = 'quiz-progress'
const PROGRESS_VERSION = 1
const HISTORY_FORMAT = 'quiz-history'
const HISTORY_VERSION = 1

export function useAccount() {
  const router = useRouter()
  const account = useUserAccountStore()
  const progressStore = useUserProgressStore()
  const historyStore = useQuizHistoryStore()
  const sync = getSyncAdapter()

  function applyRemoteData(payload: RemoteSyncPayload | null) {
    const progress = payload?.progress
    if (progress && progress.format === PROGRESS_FORMAT && progress.version === PROGRESS_VERSION) {
      progressStore.replaceAll(progress.byExamCode)
    } else {
      progressStore.replaceAll({})
    }
    const history = payload?.history
    if (history && history.format === HISTORY_FORMAT && history.version === HISTORY_VERSION) {
      historyStore.replaceAll(history.entries)
    } else {
      historyStore.replaceAll([])
    }
  }

  async function loadAccountData() {
    try {
      applyRemoteData(await sync.pull())
    } catch {
      applyRemoteData(null)
      syncError.value = texts.syncFailed
    }
  }

  async function pushLocalData() {
    if (account.accountMode !== 'account') return
    try {
      await sync.push({
        progress: progressStore.exportProgress(),
        history: historyStore.exportHistory(),
      })
    } catch {
      syncError.value = texts.syncFailed
    }
  }

  async function migrateGuestData() {
    let remote: RemoteSyncPayload | null = null
    try {
      remote = await sync.pull()
    } catch {
      syncError.value = texts.syncFailed
      return
    }
    if (remote?.progress) progressStore.importProgress(remote.progress)
    if (remote?.history) historyStore.importHistory(remote.history)
    try {
      await sync.push({
        progress: progressStore.exportProgress(),
        history: historyStore.exportHistory(),
      })
    } catch {
      syncError.value = texts.syncFailed
      return
    }
    account.takeGuestSnapshot()
  }

  async function completeAuthentication(user: AuthUser, options: { migrateGuest?: boolean } = {}) {
    const wasSignedIn = account.accountMode === 'account'
    account.user = user
    account.accountMode = 'account'
    if (!wasSignedIn) {
      account.stashGuest(progressStore.exportProgress(), historyStore.exportHistory())
    }
    if (options.migrateGuest && !wasSignedIn) {
      await migrateGuestData()
    } else {
      await loadAccountData()
    }
    await router.push({ name: 'cert-selector' })
  }

  async function signUp(email: string, password: string): Promise<boolean> {
    return auth.signUp(email, password)
  }

  async function confirmSignUp(email: string, code: string, password: string, options: { migrateGuest?: boolean } = {}) {
    await auth.confirmSignUp(email, code)
    const user = await auth.signIn(email, password)
    await completeAuthentication(user, options)
  }

  async function signIn(email: string, password: string, options: { migrateGuest?: boolean } = {}) {
    const user = await auth.signIn(email, password)
    await completeAuthentication(user, options)
  }

  async function signOut() {
    try {
      await auth.signOut()
    } catch {
      syncError.value = texts.syncFailed
    }
    const guest = account.takeGuestSnapshot()
    if (guest.progress) {
      progressStore.replaceAll(guest.progress.byExamCode)
    } else {
      progressStore.replaceAll({})
    }
    if (guest.history) {
      historyStore.replaceAll(guest.history.entries)
    } else {
      historyStore.replaceAll([])
    }
    account.user = null
    account.accountMode = null
    await router.push({ name: 'welcome' })
  }

  async function continueLocal() {
    account.accountMode = 'local'
    await router.push({ name: 'cert-selector' })
  }

  return { signUp, confirmSignUp, signIn, signOut, continueLocal, pushLocalData, syncError }
}