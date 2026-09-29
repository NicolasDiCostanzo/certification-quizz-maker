<script setup lang="ts">
import Card from '../ui/BaseCard.vue';
import PrimaryButton from '../ui/PrimaryButton.vue';

withDefaults(defineProps<{
  title: string
  description: string
  ctaLabel: string
  variant?: 'default' | 'primary' | 'secondary'
}>(), {
  variant: 'default',
})

defineEmits<{ select: [] }>()
</script>

<template>
  <Card padding="md" :borderTop="variant === 'primary'" class="welcome-card" :class="`welcome-card--${variant}`">
    <h2>{{ title }}</h2>
    <p v-if="description">{{ description }}</p>
    <PrimaryButton
      pill
      :ghost="variant !== 'primary'"
      class="welcome-card__cta"
      @click="$emit('select')"
    >
      {{ ctaLabel }}
    </PrimaryButton>
  </Card>
</template>

<style scoped>
.welcome-card.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
  border: 1px solid transparent;
  background: transparent;
  transition: border-color 0.15s ease, background 0.15s ease;
}

.welcome-card--primary.card {
  background: var(--accent-bg);
}

.welcome-card--secondary.card {
  background: var(--surface);
  border-color: var(--border);
}

.welcome-card--primary.card.card--border-top {
  border-top: 3px solid var(--accent);
}

.welcome-card.card:hover {
  border-color: var(--accent-border);
  background: var(--accent-bg);
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
