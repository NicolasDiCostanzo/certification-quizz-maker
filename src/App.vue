<script setup lang="ts">
import { useThemeMode } from './composables/useThemeMode'
import SecondaryButton from './components/SecondaryButton.vue'
import IconMoon from './components/icons/IconMoon.vue'
import IconSun from './components/icons/IconSun.vue'
import { useAccount } from './composables/useAccount'
import { texts } from './texts/en'
import { useUserAccountStore } from './stores/userAccount'

const preferences = useThemeMode()
const account = useUserAccountStore()
const { signOut } = useAccount()
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="app-title">{{ texts.appTitle }}</RouterLink>
    <div class="app-header__actions">
      <div v-if="account.user" class="account-chip">
        <span class="account-chip__email">{{ account.user.email ?? account.user.userId }}</span>
        <SecondaryButton size="sm" @click="signOut">{{ texts.signOut }}</SecondaryButton>
      </div>
      <button
        type="button"
        class="theme-switch"
        role="switch"
        :aria-checked="preferences.dark"
        :aria-label="texts.themeToggle(preferences.dark)"
        @click="preferences.toggleTheme()"
      >
        <IconSun class="icon icon-sun" />
        <span class="track"><span class="knob"></span></span>
        <IconMoon class="icon icon-moon" />
      </button>
    </div>
  </header>
  <main>
    <RouterView v-slot="{ Component, route }">
      <Transition name="page" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
  </main>
</template>

<style scoped>
.app-header__actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.account-chip {
  display: flex;
  align-items: center;
  gap: 8px;
}

.account-chip__email {
  font-size: 14px;
  color: var(--text);
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.page-leave-to {
  opacity: 0;
}
</style>
