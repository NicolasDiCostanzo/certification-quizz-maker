import { watchEffect } from 'vue'
import { useUserPreferencesStore } from '../stores/userPreferences'

export function useThemeMode() {
  const store = useUserPreferencesStore()

  watchEffect(() => {
    document.documentElement.dataset.theme = store.dark ? 'dark' : 'light'
  })

  return store
}
