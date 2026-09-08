<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import SecondaryButton from './components/SecondaryButton.vue'
import SyncBanner from './components/SyncBanner.vue'
import IconMoon from './components/icons/IconMoon.vue'
import IconSun from './components/icons/IconSun.vue'
import { useAccount } from './composables/useAccount'
import { syncError } from './composables/useSync'
import { useThemeMode } from './composables/useThemeMode'
import { useUserAccountStore } from './stores/userAccount'
import { texts } from './texts/en'

const router = useRouter()
const preferences = useThemeMode()
const account = useUserAccountStore()
const { signOut } = useAccount()

const titleTarget = computed(() => (account.accountMode ? '/' : '/welcome'))

function goToWelcome() {
  router.push('/welcome')
}

function dismissSyncError() {
  syncError.value = null
}
</script>

<template>
  <header class="app-header">
    <RouterLink :to="titleTarget" class="app-title">{{ texts.appTitle }}</RouterLink>
    <div class="app-header__actions">
      <div v-if="account.user" class="account-chip">
        <span class="account-chip__email">{{ account.user.email ?? account.user.userId }}</span>
        <SecondaryButton size="sm" @click="signOut">{{ texts.signOut }}</SecondaryButton>
      </div>
      <SecondaryButton v-else-if="account.accountMode === 'local'" size="sm" @click="goToWelcome">
        {{ texts.signIn }}
      </SecondaryButton>
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
    <SyncBanner v-if="syncError" :message="syncError" @dismiss="dismissSyncError" />
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
