<script setup lang="ts">
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
        <button type="button" class="btn-cancel" @click="emit('cancel')">{{ cancelLabel }}</button>
        <button type="button" class="btn-confirm" @click="emit('confirm')">{{ confirmLabel }}</button>
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
  border-radius: 12px;
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

.btn-cancel,
.btn-confirm {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text);
}

.btn-confirm {
  background: var(--accent);
  border-color: var(--accent);
  color: var(--bg);
}

.btn-cancel:hover {
  border-color: var(--accent);
}

.btn-confirm:hover {
  opacity: 0.9;
}
</style>
