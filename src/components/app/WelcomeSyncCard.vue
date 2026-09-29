<script setup lang="ts">
  import Card from '../ui/BaseCard.vue';
import SecondaryButton from '../ui/SecondaryButton.vue';

defineProps<{
  title: string
  description: string
  signInLabel: string
  signUpLabel: string
}>()

defineEmits<{ 'sign-in': []; 'sign-up': [] }>()
</script>

<template>
<Card padding="md" class="welcome-sync">
  <h2>{{ title }}</h2>
  <p>{{ description }}</p>
  <div class="welcome-sync__actions">
    <SecondaryButton class="welcome-sync__btn" @click="$emit('sign-up')">{{ signUpLabel }}</SecondaryButton>
    <SecondaryButton class="welcome-sync__btn" @click="$emit('sign-in')">{{ signInLabel }}</SecondaryButton>
  </div>
</Card>
</template>

<style scoped>
.welcome-sync.card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: center;
}

.welcome-sync h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-h);
}

.welcome-sync p {
  margin: 0;
  font-size: 14px;
  color: var(--text);
}

.welcome-sync__actions {
  display: flex;
  gap: 10px;
}

.welcome-sync__btn {
  flex: 1;
  border-radius: var(--radius-pill);
  font-weight: 600;
}

@media (max-width: 420px) {
  .welcome-sync__actions {
    flex-direction: column;
  }
}
</style>
