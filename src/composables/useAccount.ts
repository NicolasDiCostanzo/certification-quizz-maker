import { ref } from 'vue'
import { useRouter } from 'vue-router'
import * as auth from '../services/auth'
import { getSyncAdapter } from '../services/remoteSync'
import { texts } from '../texts/en'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { useUserAccountStore } from '../stores/userAccount'
import { useUserProgressStore } from '../stores/userProgress'
import type { AuthUser } from '../types'

export function useAccount() {
  const router = useRouter()
  const account = useUserAccountStore()
  const progressStore = useUserProgressStore()
  const historyStore = useQuizHistoryStore()
  const sync = getSyncAdapter()
  const syncError = ref<string | null>(null)

  async function pullRemoteData() {
    try {
      const payload = await sync.pull()
      if (!payload) return
      progressStore.importProgress(payload.progress)
      historyStore.importHistory(payload.history)
    } catch {
      syncError.value = texts.syncFailed
    }
  }

  async function pushLocalData() {
    try {
      await sync.push({
        progress: progressStore.exportProgress(),
        history: historyStore.exportHistory(),
      })
    } catch {
      syncError.value = texts.syncFailed
    }
  }

  async function completeAuthentication(user: AuthUser) {
    account.user = user
    account.accountMode = 'account'
    await pullRemoteData()
    await pushLocalData()
    await router.push({ name: 'cert-selector' })
  }

  async function signUp(email: string, password: string): Promise<boolean> {
    return auth.signUp(email, password)
  }

  async function confirmSignUp(email: string, code: string, password: string) {
    await auth.confirmSignUp(email, code)
    const user = await auth.signIn(email, password)
    await completeAuthentication(user)
  }

  async function signIn(email: string, password: string) {
    const user = await auth.signIn(email, password)
    await completeAuthentication(user)
  }

  async function signOut() {
    try {
      await auth.signOut()
    } catch {
      syncError.value = texts.syncFailed
    }
    account.user = null
    account.accountMode = null
    await router.push({ name: 'welcome' })
  }

  async function continueLocal() {
    account.accountMode = 'local'
    await router.push({ name: 'cert-selector' })
  }

  return { signUp, confirmSignUp, signIn, signOut, continueLocal, syncError }
}