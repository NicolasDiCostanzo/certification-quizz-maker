<script setup lang="ts">
defineProps<{
  title: string
  description: string
  ctaLabel: string
  variant?: 'default' | 'warning'
}>()

defineEmits<{ select: [] }>()
</script>

<template>
  <div class="welcome-card" :class="{ 'welcome-card--warning': variant === 'warning' }">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <button type="button" class="welcome-card__cta" @click="$emit('select')">
      {{ ctaLabel }}
    </button>
  </div>
</template>

<style scoped>
.welcome-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  text-align: center;
}

.welcome-card--warning {
  border-color: var(--red);
}

.welcome-card h2 {
  margin: 0;
  font-size: 20px;
  color: var(--text-h);
}

.welcome-card p {
  color: var(--text);
}

.welcome-card__cta {
  align-self: center;
  padding: 10px 24px;
  font: inherit;
  font-weight: 600;
  color: var(--accent);
  background: var(--accent-bg);
  border: 1px solid var(--accent-border);
  border-radius: 999px;
  cursor: pointer;
  transition: border-color 0.15s ease;
}

.welcome-card__cta:hover {
  border-color: var(--accent);
}

.welcome-card--warning .welcome-card__cta {
  color: var(--red);
  background: transparent;
  border-color: var(--red);
}
</style>