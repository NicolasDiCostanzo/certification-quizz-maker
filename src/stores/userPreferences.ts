import { defineStore } from 'pinia'
import 'pinia-plugin-persistedstate'
import type { AccountMode } from '../types'

export const useUserPreferencesStore = defineStore('userPreferences', {
  state: (): { dark: boolean; accountMode: AccountMode | null } => ({
    dark: true,
    accountMode: null,
  }),

  actions: {
    toggleTheme() {
      this.dark = !this.dark
    },
  },

  persist: true,
})
