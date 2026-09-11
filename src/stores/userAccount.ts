import { defineStore } from 'pinia'
import 'pinia-plugin-persistedstate'
import type { AccountMode, AuthUser, HistoryExportFile, ProgressExportFile } from '../types'

const MAX_GUEST_HISTORY_ENTRIES = 50

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
      this.guestHistory =
        history.entries.length > MAX_GUEST_HISTORY_ENTRIES
          ? {
              ...history,
              entries: [...history.entries]
                .sort((a, b) => b.finishedAt - a.finishedAt)
                .slice(0, MAX_GUEST_HISTORY_ENTRIES),
            }
          : history
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
