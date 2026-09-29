<script setup lang="ts">
defineProps<{
  text: string
}>()
</script>

<template>
  <p class="eyebrow">{{ text }}</p>
</template>

<style scoped>
.eyebrow {
  padding: 4px 12px;
  border-radius: var(--radius-pill);
  background: var(--brand-bg);
  color: var(--brand);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1.2px;
  text-transform: uppercase;
}
</style>
