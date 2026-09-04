<script setup lang="ts">
import { onMounted, onUnmounted, useId } from 'vue'
import Card from './BaseCard.vue'
import PrimaryButton from './PrimaryButton.vue'
import SecondaryButton from './SecondaryButton.vue'

defineProps<{
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const titleId = useId()

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') emit('cancel')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <div class="modal-overlay" @click.self="emit('cancel')">
    <Card
      padding="xl"
      radius="2xl"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="titleId"
      class="modal"
    >
      <h2 :id="titleId">{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <SecondaryButton @click="emit('cancel')">{{ cancelLabel }}</SecondaryButton>
        <PrimaryButton @click="emit('confirm')">{{ confirmLabel }}</PrimaryButton>
      </div>
    </Card>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: var(--overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  max-width: 400px;
  width: 90%;
}

.modal h2 {
  margin: 0 0 12px;
  font-size: 18px;
  color: var(--text-h);
}

.modal p {
  margin: 0 0 20px;
  color: var(--text);
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
