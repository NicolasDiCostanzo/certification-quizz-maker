import { useRouter } from 'vue-router'
import * as auth from '../services/auth'
import type { RemoteSyncPayload } from '../services/remoteSync'
import { getSyncAdapter } from '../services/remoteSync'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { useUserAccountStore } from '../stores/userAccount'
import { useUserProgressStore } from '../stores/userProgress'
import { texts } from '../texts/en'
import type { AuthUser } from '../types'
import { syncError } from './useSync'

const PROGRESS_FORMAT = 'quiz-progress'
const PROGRESS_VERSION = 1
const HISTORY_FORMAT = 'quiz-history'
const HISTORY_VERSION = 1

const FLAG_TOGGLE_DEBOUNCE_MS = 400

let syncSession: symbol | null = null
let authAttempt = 0
let pendingPush: Promise<void> = Promise.resolve()

let pendingDebounceResolvers: (() => void)[] = []
let debounceTimer: ReturnType<typeof setTimeout> | null = null
let flushDebouncedPush: (() => void) | null = null
let activePushAbort: AbortController | null = null
let activeAttemptAbort: AbortController | null = null
let accountDataLoadFailed = false

function isAbortError(err: unknown): boolean {
  return err instanceof Error && err.name === 'AbortError'
}

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

  async function loadAccountData(signal: AbortSignal): Promise<boolean> {
    try {
      const payload = await sync.pull(signal)
      if (signal.aborted) return false
      applyRemoteData(payload)
      return true
    } catch {
      if (signal.aborted) return false
      applyRemoteData(null)
      syncError.value = texts.syncFailed
      return false
    }
  }

  async function pushLocalData() {
    if (account.accountMode !== 'account') return
    const session = syncSession
    if (session === null) return
    const payload = {
      progress: progressStore.exportProgress(),
      history: historyStore.exportHistory(),
    }
    const next = pendingPush
      .catch(() => undefined)
      .then(() => {
        if (syncSession !== session) return
        const controller = new AbortController()
        activePushAbort = controller
        return sync.push(payload, () => syncSession === session, controller.signal)
      })
    pendingPush = next
    try {
      await next
    } catch (err) {
      if (!isAbortError(err)) {
        syncError.value = texts.syncFailed
      }
    }
  }

  function pushLocalDataDebounced(delayMs = FLAG_TOGGLE_DEBOUNCE_MS): Promise<void> {
  return new Promise<void>((resolve) => {
    if (debounceTimer !== null) clearTimeout(debounceTimer)
    pendingDebounceResolvers.push(resolve)
    flushDebouncedPush = () => {
      debounceTimer = null
      flushDebouncedPush = null
      const resolvers = pendingDebounceResolvers
      pendingDebounceResolvers = []
      void pushLocalData().then(() => resolvers.forEach((r) => r())).catch(() => resolvers.forEach((r) => r()))
    }
    debounceTimer = setTimeout(flushDebouncedPush, delayMs)
  })
}

  async function migrateGuestData(attempt: number, signal: AbortSignal): Promise<boolean> {
    let remote: RemoteSyncPayload | null = null
    try {
      remote = await sync.pull(signal)
    } catch {
      if (signal.aborted) return false
      syncError.value = texts.syncFailed
      return false
    }
    if (signal.aborted) return false
    if (remote?.progress) progressStore.importProgress(remote.progress)
    if (remote?.history) historyStore.importHistory(remote.history)
    const controller = new AbortController()
    activePushAbort = controller
    const attemptPush = sync.push(
      {
        progress: progressStore.exportProgress(),
        history: historyStore.exportHistory(),
      },
      () => authAttempt === attempt,
      controller.signal,
    )
    pendingPush = attemptPush
    try {
      await attemptPush
    } catch (err) {
      if (!isAbortError(err)) {
        syncError.value = texts.syncFailed
      }
      return false
    }
    if (authAttempt !== attempt) return false
    account.takeGuestSnapshot()
    return true
  }

  async function completeAuthentication(user: AuthUser, options: { migrateGuest?: boolean } = {}) {
    const attempt = ++authAttempt
    activePushAbort?.abort()
    activePushAbort = null
    activeAttemptAbort?.abort()
    const controller = new AbortController()
    activeAttemptAbort = controller
    syncSession = null
    const wasSignedIn = account.accountMode === 'account'
    account.user = user
    account.accountMode = 'account'
    if (!wasSignedIn) {
      account.stashGuest(progressStore.exportProgress(), historyStore.exportHistory())
    }
    const ok =
      options.migrateGuest && !wasSignedIn
        ? await migrateGuestData(attempt, controller.signal)
        : await loadAccountData(controller.signal)
    if (authAttempt === attempt) {
      // Leaving syncSession null on failure is deliberate, not a dead end: push
      // replaces the remote document wholesale, so enabling it here would risk
      // uploading the just-blanked local state over the account's real data.
      // The user retries by signing in again; accountDataLoadFailed keeps this
      // attempt from being mistaken for "synced" if they sign out instead.
      syncSession = ok ? Symbol() : null
      accountDataLoadFailed = !ok
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
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer)
      flushDebouncedPush?.()
    }
    activeAttemptAbort?.abort()
    const outcome = await Promise.race([
      pendingPush.then(
        () => 'ok' as const,
        () => 'failed' as const,
      ),
      new Promise<'timeout'>((resolve) => setTimeout(() => resolve('timeout'), 2000)),
    ])
    // pendingPush resolves trivially when the initial account-data load failed
    // (push is disabled, so nothing was ever attempted): without this check that
    // no-op would read as "synced" and wrongly let the stale guest snapshot below
    // overwrite whatever the user did locally while sync was broken.
    const synced = outcome === 'ok' && !accountDataLoadFailed
    if (!synced) {
      // Don't let a stuck rejection trap every future sign-out attempt (e.g. while offline).
      syncError.value = texts.syncFailed
      pendingPush = Promise.resolve()
    }
    try {
      await auth.signOut()
    } catch {
      syncError.value = texts.syncFailed
    }
    syncSession = null
    const guest = account.takeGuestSnapshot()
    if (synced) {
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
    }
    account.user = null
    account.accountMode = null
    await router.push({ name: 'welcome' })
  }

  async function continueLocal() {
    account.accountMode = 'local'
    await router.push({ name: 'cert-selector' })
  }

  return {
    signUp,
    confirmSignUp,
    signIn,
    signOut,
    continueLocal,
    pushLocalData,
    pushLocalDataDebounced,
    syncError,
  }
}