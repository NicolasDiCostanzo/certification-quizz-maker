import { createPinia, setActivePinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createApp } from 'vue'
import * as auth from '../services/auth'
import { useUserAccountStore } from '../stores/userAccount'
import { restoreAccountSession } from './sessionRestore'

vi.mock('../services/auth', () => ({
  checkSessionStatus: vi.fn(),
}))

const USER = { userId: 'sub-1', email: 'dev@example.com' }

beforeEach(() => {
  localStorage.clear()
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  createApp({ render: () => null }).use(pinia)
  setActivePinia(pinia)
  vi.clearAllMocks()
})

describe('restoreAccountSession', () => {
  it('keeps the persisted account when the session is confirmed valid', async () => {
    const account = useUserAccountStore()
    account.accountMode = 'account'
    account.user = USER
    vi.mocked(auth.checkSessionStatus).mockResolvedValue('valid')

    await restoreAccountSession()

    expect(account.user).toEqual(USER)
    expect(account.accountMode).toBe('account')
  })

  it('keeps the persisted account when the session status is unknown, e.g. the device is offline', async () => {
    const account = useUserAccountStore()
    account.accountMode = 'account'
    account.user = USER
    vi.mocked(auth.checkSessionStatus).mockResolvedValue('unknown')

    await restoreAccountSession()

    expect(account.user).toEqual(USER)
    expect(account.accountMode).toBe('account')
  })

  it('clears the persisted account when the session is confirmed invalid', async () => {
    const account = useUserAccountStore()
    account.accountMode = 'account'
    account.user = USER
    vi.mocked(auth.checkSessionStatus).mockResolvedValue('invalid')

    await restoreAccountSession()

    expect(account.user).toBeNull()
    expect(account.accountMode).toBeNull()
  })

  it('leaves local mode untouched without checking any session', async () => {
    const account = useUserAccountStore()
    account.accountMode = 'local'

    await restoreAccountSession()

    expect(auth.checkSessionStatus).not.toHaveBeenCalled()
    expect(account.accountMode).toBe('local')
  })
})