import { defineStore } from 'pinia'
import 'pinia-plugin-persistedstate'
import type { AccountMode, AuthUser, HistoryExportFile, ProgressExportFile } from '../types'

export const useUserAccountStore = defineStore('userAccount', {
  state: (): {
    accountMode: AccountMode | null
    user: AuthUser | null
    guestProgress: ProgressExportFile | null
    guestHistory: HistoryExportFile | null
  } => ({
    accountMode: null,
    user: null,
    guestProgress: null,
    guestHistory: null,
  }),

  actions: {
    stashGuest(progress: ProgressExportFile, history: HistoryExportFile) {
      this.guestProgress = progress
      this.guestHistory = history
    },

    takeGuestSnapshot(): { progress: ProgressExportFile | null; history: HistoryExportFile | null } {
      const snapshot = { progress: this.guestProgress, history: this.guestHistory }
      this.guestProgress = null
      this.guestHistory = null
      return snapshot
    },
  },

  persist: true,
})
