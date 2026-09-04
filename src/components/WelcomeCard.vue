<script setup lang="ts">
import Card from './BaseCard.vue'
import PrimaryButton from './PrimaryButton.vue'

defineProps<{
  title: string
  description: string
  ctaLabel: string
  variant?: 'default' | 'warning'
}>()

defineEmits<{ select: [] }>()
</script>

<template>
  <Card padding="lg" class="welcome-card" :class="{ 'welcome-card--warning': variant === 'warning' }">
    <h2>{{ title }}</h2>
    <p>{{ description }}</p>
    <PrimaryButton
      pill
      ghost
      :danger="variant === 'warning'"
      class="welcome-card__cta"
      @click="$emit('select')"
    >
      {{ ctaLabel }}
    </PrimaryButton>
  </Card>
</template>

<style scoped>
.welcome-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.welcome-card--warning.card {
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
}
</style>