import { defineStore } from 'pinia'
import 'pinia-plugin-persistedstate'
import type { AccountMode, AuthUser } from '../types'

export const useUserAccountStore = defineStore('userAccount', {
  state: (): { accountMode: AccountMode | null; user: AuthUser | null } => ({
    accountMode: null,
    user: null,
  }),

  persist: true,
})
