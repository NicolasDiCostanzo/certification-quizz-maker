<script setup lang="ts">
import { useThemeMode } from './composables/useThemeMode'
import IconMoon from './components/icons/IconMoon.vue'
import IconSun from './components/icons/IconSun.vue'
import { texts } from './texts/en'

const preferences = useThemeMode()
</script>

<template>
  <header class="app-header">
    <RouterLink to="/" class="app-title">{{ texts.appTitle }}</RouterLink>
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
