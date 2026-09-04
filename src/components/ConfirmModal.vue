<script setup lang="ts">
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
</script>

<template>
  <div class="modal-overlay" @click.self="emit('cancel')">
    <div class="modal">
      <h2>{{ title }}</h2>
      <p>{{ message }}</p>
      <div class="modal-actions">
        <SecondaryButton @click="emit('cancel')">{{ cancelLabel }}</SecondaryButton>
        <PrimaryButton @click="emit('confirm')">{{ confirmLabel }}</PrimaryButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-2xl);
  padding: 24px;
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
