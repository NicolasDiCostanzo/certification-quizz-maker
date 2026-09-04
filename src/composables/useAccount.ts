import { useRouter } from 'vue-router'
import { useUserPreferencesStore } from '../stores/userPreferences'
import type { AccountMode } from '../types'

export function useAccount() {
  const router = useRouter()
  const preferences = useUserPreferencesStore()

  async function chooseAccountMode(mode: AccountMode) {
    preferences.accountMode = mode
    await router.push({ name: 'cert-selector' })
  }

  async function createAccount() {
    // TODO(AWS): create the account on the backend, then migrate local progress into it.
    await chooseAccountMode('account')
  }

  async function signIn() {
    // TODO(AWS): sign in on the backend, then load the remote progress.
    await chooseAccountMode('account')
  }

  async function continueLocal() {
    await chooseAccountMode('local')
  }

  return { createAccount, signIn, continueLocal }
}