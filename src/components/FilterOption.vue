<script setup lang="ts">
defineProps<{ text: string; description?: string }>()
</script>

<template>
  <label class="filter-option">
    <slot />
    <span class="text-wrapper">
      <span>{{ text }}</span>
      <span class="description">{{ description }}</span>
    </span>
    </label>
</template>

<style scoped>
.filter-option {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: left;
  color: var(--text);
  margin-bottom: 8px;
}

.text-wrapper{
  display: flex;
  gap: 12px;
  align-items: center;
}

.description {
  font-size: 0.8rem;
  line-height: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
}
</style>
