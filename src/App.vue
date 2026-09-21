<script setup lang="ts">
import AppHeader from './components/AppHeader.vue'
import SyncBanner from './components/SyncBanner.vue'
import { syncError } from './composables/useSync'

function dismissSyncError() {
  syncError.value = null
}
</script>

<template>
  <AppHeader />
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
