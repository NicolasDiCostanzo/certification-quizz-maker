<template>
  <div class="sync-banner" role="alert">
    <span class="sync-banner__message">{{ message }}</span>
    <button
      type="button"
      class="sync-banner__dismiss"
      aria-label="Dismiss"
      @click="onDismiss"
    >&times;</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
  onDismiss: () => void
}>()
</script>

<style scoped>
.sync-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 10px 16px;
  background: var(--red);
  color: var(--text-inverse, #fff);
  font-size: 14px;
}

.sync-banner__message {
  text-align: center;
}

.sync-banner__dismiss {
  font: inherit;
  font-size: 18px;
  line-height: 1;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.8;
}

.sync-banner__dismiss:hover {
  opacity: 1;
}
</style>
