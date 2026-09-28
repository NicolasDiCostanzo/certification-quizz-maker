<script setup lang="ts">
  import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAccount } from '../../composables/useAccount'
import { useThemeMode } from '../../composables/useThemeMode'
import { links } from '../../config'
import { useUserAccountStore } from '../../stores/userAccount'
import { texts } from '../../texts/en'
import ExternalLink from './ExternalLink.vue'
import IconCoffee from '../icons/IconCoffee.vue'
import IconGithub from '../icons/IconGithub.vue'
import IconHome from '../icons/IconHome.vue'
import IconMoon from '../icons/IconMoon.vue'
import IconSun from '../icons/IconSun.vue'
import SecondaryButton from '../ui/SecondaryButton.vue'

  const router = useRouter()
  const preferences = useThemeMode()
  const account = useUserAccountStore()
  const { signOut } = useAccount()

  const signOutPending = ref(false)

  const titleTarget = computed(() => (account.accountMode === 'account' ? '/cert' : '/'))

  async function handleSignOut() {
    if (signOutPending.value) return
    signOutPending.value = true
    try {
      await signOut()
    } finally {
      signOutPending.value = false
    }
  }

  function goToWelcome() {
    router.push({ name: 'welcome' })
  }
</script>

<template>
  <header class="app-header">
    <div class="icons-wrapper">
      <RouterLink :to="titleTarget" class="app-title" :aria-label="texts.appTitle" :title="texts.appTitle">
        <IconHome class="app-title__icon" />
      </RouterLink>
      <ExternalLink :href="links.repo" :label="texts.githubLinkLabel" icon-only class="app-title__icon">
        <template #icon><IconGithub /></template>
      </ExternalLink>
      <ExternalLink :href="links.sponsor" :label="texts.sponsorLinkLabel" icon-only class="app-title__icon">
        <template #icon><IconCoffee /></template>
      </ExternalLink>
    </div>
    <div class="app-header__actions">
      <div v-if="account.user" class="account-chip">
        <span class="account-chip__email">{{ account.user.email ?? account.user.userId }}</span>
        <SecondaryButton size="sm" :disabled="signOutPending" @click="handleSignOut">{{ texts.signOut }}
        </SecondaryButton>
      </div>
      <SecondaryButton v-else-if="account.accountMode === 'local'" size="sm" @click="goToWelcome">
        {{ texts.signIn }}
      </SecondaryButton>
      <button type="button" class="theme-switch" role="switch" :aria-checked="preferences.dark"
        :aria-label="texts.themeToggle(preferences.dark)" @click="preferences.toggleTheme()">
        <IconSun class="icon icon-sun" />
        <span class="track"><span class="knob"></span></span>
        <IconMoon class="icon icon-moon" />
      </button>
    </div>
  </header>
</template>

<style scoped>
  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    text-align: left;
  }

  .app-title {
    display: inline-flex;
    align-items: center;
    color: var(--text-h);
    text-decoration: none;
    flex-shrink: 0;
    transition: color 0.15s ease;
  }

  .icons-wrapper {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .app-title:hover {
    color: var(--text);
  }

  .app-title__icon {
    width: 24px;
    height: 24px;
  }

  .app-header__actions {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .account-chip {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .account-chip .btn {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .account-chip__email {
    font-size: 14px;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .theme-switch {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0;
    color: var(--text);
    background: none;
    border: none;
    cursor: pointer;
    transition: color 0.15s ease;
    flex-shrink: 0;
  }

  .theme-switch:hover {
    color: var(--text-h);
  }

  .theme-switch .icon {
    width: 20px;
    height: 20px;
  }

  .theme-switch .track {
    position: relative;
    flex-shrink: 0;
    width: 52px;
    height: 28px;
    border-radius: 999px;
    background: var(--border);
    transition: background 0.15s ease;
  }

  .theme-switch .knob {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: var(--text-h);
    transition: transform 0.15s ease;
  }

  .theme-switch[aria-checked='true'] .knob {
    transform: translateX(24px);
  }

  @media (max-width: 1024px) {
    .app-header {
      padding: 14px 20px;
    }
  }

  @media (max-width: 720px) {
    .app-header {
      padding: 12px 16px;
      gap: 10px;
    }

    .app-header__actions {
      gap: 8px;
    }
  }

  @media (max-width: 500px) {
    .account-chip {
      gap: 6px;
    }

    .account-chip__email {
      display: none;
    }
  }
</style>
