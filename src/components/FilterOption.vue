<script setup lang="ts">
defineProps<{ text: string }>()
</script>

<template>
  <label class="filter-option">
    <slot />
    <span>{{ text }}</span>
  </label>
</template>

<style scoped>
.filter-option {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
}
</style>
