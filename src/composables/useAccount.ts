import { useRouter } from 'vue-router'
import { getSyncAdapter } from '../services/remoteSync'
import { useQuizHistoryStore } from '../stores/quizHistory'
import { useUserAccountStore } from '../stores/userAccount'
import { useUserProgressStore } from '../stores/userProgress'
import type { AccountMode } from '../types'

export function useAccount() {
  const router = useRouter()
  const account = useUserAccountStore()
  const progressStore = useUserProgressStore()
  const historyStore = useQuizHistoryStore()
  const sync = getSyncAdapter()

  async function chooseAccountMode(mode: AccountMode) {
    account.accountMode = mode
    await router.push({ name: 'cert-selector' })
  }

  async function pullRemoteData() {
    const payload = await sync.pull()
    if (!payload) return
    progressStore.importProgress(payload.progress)
    historyStore.importHistory(payload.history)
  }

  async function createAccount() {
    // TODO(AWS): create the account on the backend, then push local progress/history to it.
    await chooseAccountMode('account')
    await pullRemoteData()
  }

  async function signIn() {
    // TODO(AWS): sign in on the backend.
    await chooseAccountMode('account')
    await pullRemoteData()
  }

  async function continueLocal() {
    await chooseAccountMode('local')
  }

  return { createAccount, signIn, continueLocal }
}