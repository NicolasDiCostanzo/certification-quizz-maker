import { defineStore } from 'pinia'
import 'pinia-plugin-persistedstate'
import type { AccountMode } from '../types'

export const useUserAccountStore = defineStore('userAccount', {
  state: (): { accountMode: AccountMode | null } => ({
    accountMode: null,
  }),

  persist: true,
})
