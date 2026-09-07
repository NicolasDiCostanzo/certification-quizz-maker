import * as auth from './auth'
import { useUserAccountStore } from '../stores/userAccount'

export async function restoreAccountSession(): Promise<void> {
  const account = useUserAccountStore()
  if (account.accountMode !== 'account' || !account.user) return
  if ((await auth.checkSessionStatus()) === 'invalid') {
    account.user = null
    account.accountMode = null
  }
}