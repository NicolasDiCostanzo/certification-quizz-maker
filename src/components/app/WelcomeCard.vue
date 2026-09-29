<script setup lang="ts">
import Card from '../ui/BaseCard.vue'
import PrimaryButton from '../ui/PrimaryButton.vue'

withDefaults(defineProps<{
  title: string
  description: string
  ctaLabel: string
  variant?: 'default' | 'primary'
}>(), {
  variant: 'default',
})

defineEmits<{ select: [] }>()
</script>

<template>
  <Card padding="lg" class="welcome-card">
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
.welcome-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
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
