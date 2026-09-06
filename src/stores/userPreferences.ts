import { defineStore } from 'pinia'
import 'pinia-plugin-persistedstate'

export const useUserPreferencesStore = defineStore('userPreferences', {
  state: (): { dark: boolean } => ({
    dark: true,
  }),

  actions: {
    toggleTheme() {
      this.dark = !this.dark
    },
  },

  persist: true,
})
